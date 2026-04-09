import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CarTax, CarTaxDocument } from './entities/car-tax.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import {
  Subscribe,
  SubscribeDocument,
} from '../subscribe/entities/subscribe.entity';
import {
  getInitialReport,
  parseCarTaxResponse,
  mergeReports,
  enrichWithDvla,
  callUkvd,
  parseUkvdResponse,
} from 'src/app/helpers/carTaxAPI';
import {
  fetchAllCcdData,
  parseCcdResponse,
} from 'src/app/helpers/checkCarDetailsAPI';
import {
  freeDVLACarCheck,
} from 'src/app/helpers/davlaAPI';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import config from 'src/app/config';

@Injectable()
export class CarTaxService {
  private readonly apiKey = config.carTax.apiKey ?? '';

  constructor(
    @InjectModel(CarTax.name)
    private readonly carTaxModel: Model<CarTaxDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Subscribe.name)
    private readonly subscribeModel: Model<SubscribeDocument>,
  ) {}

  private async getUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    return user;
  }

  private async isSubscribed(userId: string): Promise<boolean> {
    const count = await this.subscribeModel.countDocuments({
      user: new Types.ObjectId(userId),
    });
    return count > 0;
  }

  // ─── Car Check — CheckCarDetails (primary) + RapidAPI + DVLA ───────
  async carCheck(userId: string, vrm: string) {
    const user = await this.getUser(userId);
    const subscribed = await this.isSubscribed(userId);
    const cleanVrm = vrm.replace(/\s/g, '').toUpperCase();

    let parsed: any = {};
    let rawResponse: any = null;

    // ──────────────────────────────────────────────────────────────
    // STEP 1: CheckCarDetails API (PRIMARY — comprehensive data)
    // ──────────────────────────────────────────────────────────────
    console.log('[CarTax] Step 1: Fetching CheckCarDetails data for', cleanVrm);
    try {
      const ccdData = await fetchAllCcdData(cleanVrm);
      const ccdParsed = parseCcdResponse(ccdData);

      // Log what we got
      console.log('[CarTax] CCD parsed — performance:', JSON.stringify(ccdParsed?.performance));
      console.log('[CarTax] CCD parsed — fuelEconomy:', JSON.stringify(ccdParsed?.fuelEconomy));
      console.log('[CarTax] CCD parsed — dimensions:', JSON.stringify(ccdParsed?.dimensions));
      console.log('[CarTax] CCD parsed — vehicleDetails:', JSON.stringify(ccdParsed?.vehicleDetails));

      // Check if CCD returned meaningful data
      const hasData = ccdParsed?.vehicleDetails?.make || ccdParsed?.status?.taxStatus;
      if (hasData) {
        parsed = ccdParsed;
        rawResponse = ccdData;
        console.log('[CarTax] CheckCarDetails data loaded successfully!');
      } else {
        console.log('[CarTax] CheckCarDetails returned empty — falling back to RapidAPI');
      }
    } catch (err) {
      console.error('[CarTax] CheckCarDetails error:', err);
    }

    // ──────────────────────────────────────────────────────────────
    // STEP 2: RapidAPI fallback (if CCD didn't return data)
    // ──────────────────────────────────────────────────────────────
    if (!parsed?.vehicleDetails?.make) {
      console.log('[CarTax] Step 2: Fetching RapidAPI report (fallback)');
      try {
        rawResponse = await getInitialReport(cleanVrm, this.apiKey);
        const rapidParsed = parseCarTaxResponse(rawResponse);
        parsed = mergeReports(parsed, rapidParsed);
        console.log('[CarTax] RapidAPI data merged');
      } catch (err) {
        console.error('[CarTax] RapidAPI error:', err);
      }
    }

    // ──────────────────────────────────────────────────────────────
    // STEP 3: UKVD enrichment (fills performance, dimensions, fuel)
    // ──────────────────────────────────────────────────────────────
    console.log('[CarTax] Step 3: Fetching UKVD data (new key)');
    try {
      const ukvdRaw = await callUkvd(cleanVrm, 'VehicleData');
      if (ukvdRaw?.Response?.DataItems) {
        const ukvdParsed = parseUkvdResponse(ukvdRaw);
        if (ukvdParsed) {
          parsed = mergeReports(parsed, ukvdParsed);
          console.log('[CarTax] UKVD data merged — performance:', JSON.stringify(ukvdParsed?.performance));
          console.log('[CarTax] UKVD fuel:', JSON.stringify(ukvdParsed?.fuelEconomy));
          console.log('[CarTax] UKVD dimensions:', JSON.stringify(ukvdParsed?.dimensions));
        }
      } else {
        console.log('[CarTax] UKVD returned no DataItems');
      }
    } catch (err) {
      console.error('[CarTax] UKVD error:', err);
    }

    // ──────────────────────────────────────────────────────────────
    // STEP 4: DVLA enrichment (always — fills tax/MOT status gaps)
    // ──────────────────────────────────────────────────────────────
    console.log('[CarTax] Step 4: Fetching DVLA data');
    let dvlaData: any = null;
    try {
      // Always use free DVLA key (paid key has auth issues)
      dvlaData = await freeDVLACarCheck(cleanVrm);
      console.log('[CarTax] DVLA data received:', Object.keys(dvlaData ?? {}));
    } catch (err) {
      console.error('[CarTax] DVLA call failed:', err);
    }

    // Enrich parsed data with DVLA fields
    parsed = enrichWithDvla(parsed, dvlaData);

    console.log('[CarTax] ═══ FINAL RESULT ═══');
    console.log('[CarTax] performance:', JSON.stringify(parsed.performance));
    console.log('[CarTax] fuelEconomy:', JSON.stringify(parsed.fuelEconomy));
    console.log('[CarTax] dimensions:', JSON.stringify(parsed.dimensions));
    console.log('[CarTax] vehicleDetails.make:', parsed?.vehicleDetails?.make);

    return this.carTaxModel.create({
      user: user._id,
      registrationNumber: cleanVrm,
      reportType: 'initial',
      keyType: subscribed ? 'paid' : 'free',
      ...parsed,
      dvlaData,
      rawResponse,
    });
  }

  // ─── Get all my reports ───────────────────────────────────────────
  async getMyReports(userId: string, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const user = await this.getUser(userId);

    const data = await this.carTaxModel
      .find({ user: user._id })
      .limit(limit)
      .skip(skip)
      .sort({ [sortBy]: sortOrder } as any);

    const total = await this.carTaxModel.countDocuments({ user: user._id });
    return { data, meta: { page, limit, total } };
  }

  // ─── Get single report ────────────────────────────────────────────
  async getSingleReport(id: string) {
    const report = await this.carTaxModel.findById(id);
    if (!report) throw new HttpException('Report not found', 404);
    return report;
  }

  // ─── Delete report ────────────────────────────────────────────────
  async deleteReport(id: string) {
    const result = await this.carTaxModel.findByIdAndDelete(id);
    if (!result) throw new HttpException('Report not found', 404);
    return result;
  }
}
