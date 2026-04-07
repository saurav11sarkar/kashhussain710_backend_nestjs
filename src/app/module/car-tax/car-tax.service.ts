import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarTax, CarTaxDocument } from './entities/car-tax.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { getInitialReport, parseCarTaxResponse } from 'src/app/helpers/carTaxAPI';
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
  ) {}

  private async getUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    return user;
  }

  // ─── Car Check — calls GetInitialReport, parses & saves ──────────
  async carCheck(userId: string, vrm: string) {
    const user = await this.getUser(userId);

    const rawResponse = await getInitialReport(vrm, this.apiKey);
    const parsed = parseCarTaxResponse(rawResponse);

    return this.carTaxModel.create({
      user: user._id,
      registrationNumber: vrm.replace(/\s/g, '').toUpperCase(),
      reportType: 'initial',
      ...parsed,
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