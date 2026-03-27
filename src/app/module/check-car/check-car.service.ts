import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DvsaMotResponse,
  extractMileageInfo,
  extractMotSummary,
  freeDvlaApi,
  getDvsaMotHistory,
  VehicleResponse,
} from 'src/app/helpers/davlaAPI';
import { CheckCar, CheckCarDocument } from './entities/check-car.entity';

import { User, UserDocument } from '../user/entities/user.entity';
import {
  MotHistory,
  MotHistoryDocument,
} from '../mot-history/entities/mot-history.entity';
import { freeDvlaCarCheck, paidDvlaCarCheck } from 'src/app/helpers/davlaAPI';
import { getMotHistory } from 'src/app/helpers/motAPI';

@Injectable()
export class CheckCarService {
  constructor(
    @InjectModel(CheckCar.name)
    private readonly checkCarModel: Model<CheckCarDocument>,
    @InjectModel(MotHistory.name)
    private readonly motHistoryModel: Model<MotHistoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ─── Private: DVLA data → CheckCar format ───────────────────────
  private buildCheckCarData(
    data: Awaited<ReturnType<typeof freeDvlaCarCheck>>,
  ) {
    const taxDays = data.taxDueDate
      ? Math.ceil(
          (new Date(data.taxDueDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const motDays = data.motExpiryDate
      ? Math.ceil(
          (new Date(data.motExpiryDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      registrationNumber: data.registrationNumber,
      heroSection: {
        registrationNumber: vehicle.registrationNumber,
        vehicleName: vehicle.make,
        tax: {
          expiryDate: data.taxDueDate,
          daysLeft: taxDays !== null ? `${taxDays} days` : undefined,
        },
        mot: {
          expiryDate: data.motExpiryDate,
          daysLeft: motDays !== null ? `${motDays} days` : undefined,
        },
      },
      vehicleDetails: {
        modelVariant: data.make,
        primaryColour: data.colour,
        fuelType: data.fuelType,
        engine: data.engineCapacity ? `${data.engineCapacity} cc` : undefined,
        yearOfManufacture: data.yearOfManufacture,
        euroStatus: data.euroStatus,
        wheelPlan: data.wheelplan,
        lastV5CIssuedDate: data.dateOfLastV5CIssued,
        registrationDate: data.monthOfFirstRegistration,
      },
      co2EmissionFigures: {
        value: data.co2Emissions?.toString(),
      },
      importantVehicleInformation: {
        exported: vehicle.markedForExport ? 'Yes' : 'No',
        safetyRecalls: 'Need premium provider',
        damageHistory: 'Need premium provider',
        salvageHistory: 'Need premium provider',
        fullServiceHistory: 'Need premium provider',
        exTaxiNhsPoliceCheck: 'Need premium provider',
        writtenOff: 'Need premium provider',
        internetHistory: 'Need premium provider',
        onFinance: 'Need premium provider',
        keeperPlateChangesImportExportVinLogbookCheck: 'Need premium provider',
        stolen: 'Need premium provider',
      },
      dimensionsAndWeight: {
        width: 'N/A',
        height: 'N/A',
        length: 'N/A',
        wheelBase: 'N/A',
        kerbWeight: 'N/A',
        maxAllowedWeight: 'N/A',
      },
      fuelEconomy: {
        urban: 'N/A',
        extraUrban: 'N/A',
        combined: 'N/A',
      },
      co2EmissionFigures: {
        value: `${vehicle.co2Emissions || 0} g/km`,
        rating: this.getCo2Rating(vehicle.co2Emissions || 0),
      },
      safetyRatings: {
        child: 'N/A',
        adult: 'N/A',
        pedestrian: 'N/A',
      },
      roadTax: {
        tax12MonthsCost: 'Check DVLA tax calculator',
        tax6MonthsCost: 'Check DVLA tax calculator',
      },
      pricingPlans: [
        {
          name: 'Silver Check',
          price: '4.99',
          features: ['DVLA summary', 'Tax status', 'MOT status'],
          isPopular: false,
        },
        {
          name: 'Gold Check',
          price: '9.99',
          features: [
            'Everything in Silver',
            'Mileage verification',
            'Ownership insights',
          ],
          isPopular: true,
        },
        {
          name: 'Premium Check',
          price: '14.99',
          features: [
            'Everything in Gold',
            'Finance check',
            'Write-off and stolen markers',
          ],
          isPopular: false,
        },
      ],
    };
  }

  // ─── Private: MOT data → MotHistory format ──────────────────────
  private buildMotHistoryData(
    motData: Awaited<ReturnType<typeof getMotHistory>>,
    userId: string,
    checkCarId: string,
  ) {
    const tests = motData.motTests ?? [];
    const passed = tests.filter((t) => t.testResult === 'PASSED').length;
    const failed = tests.filter((t) => t.testResult === 'FAILED').length;
    const latest = tests[0]; // API returns newest first

    const lastMileage = latest?.odometerValue
      ? parseInt(latest.odometerValue, 10)
      : undefined;

    return {
      user: userId,
      checkCar: checkCarId,
      registrationNumber: motData.registration,
      make: motData.make,
      model: motData.model,
      primaryColour: motData.primaryColour,
      fuelType: motData.fuelType,
      firstUsedDate: motData.firstUsedDate,
      dvlaId: motData.dvlaId,
      dvlaMake: motData.dvlaMake,
      engineSize: motData.engineSize,
      motTests: tests,
      totalTests: tests.length,
      totalPassed: passed,
      totalFailed: failed,
      latestTestResult: latest?.testResult,
      latestExpiryDate: latest?.expiryDate,
      lastMileage,
    };
  }

  // ─── FREE DVLA check ────────────────────────────────────────────
  async freeCheckCar(userId: string, registrationNumber: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    const dvlaData = await freeDvlaCarCheck(registrationNumber);
    const checkCarData = this.buildCheckCarData(dvlaData);

    const saved = await this.checkCarModel.create({
      ...checkCarData,
      user: user._id,
    });

  private getCo2Rating(value: number): string {
    if (value <= 100) return 'A';
    if (value <= 120) return 'B';
    if (value <= 140) return 'C';
    if (value <= 160) return 'D';
    if (value <= 180) return 'E';
    if (value <= 200) return 'F';
    return 'G';
  }

  // ─── PAID DVLA check ────────────────────────────────────────────
  async paidCheckCar(userId: string, registrationNumber: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    const dvlaData = await paidDvlaCarCheck(registrationNumber);
    const checkCarData = this.buildCheckCarData(dvlaData);

    const saved = await this.checkCarModel.create({
      ...checkCarData,
      user: user._id,
    });

    return saved;
  }

  // ─── MOT History check ──────────────────────────────────────────
  async motHistoryCheck(userId: string, registrationNumber: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    // Also save a CheckCar record (DVLA) alongside MOT
    const dvlaData = await freeDvlaCarCheck(registrationNumber);
    const checkCarData = this.buildCheckCarData(dvlaData);
    const checkCar = await this.checkCarModel.create({
      ...checkCarData,
      user: user._id,
    });

    // Get MOT history
    const motData = await getMotHistory(registrationNumber);
    const motHistoryData = this.buildMotHistoryData(
      motData,
      String(user._id),
      String(checkCar._id),
    );

    const savedMot = await this.motHistoryModel.create(motHistoryData);

    return {
      vehicle: checkCar,
      motHistory: savedMot,
    };
  }

  // ─── Backward compat (existing route এর জন্য) ──────────────────
  async createCheckCar(userId: string, registrationNumber: string) {
    return this.freeCheckCar(userId, registrationNumber);
  }
}
