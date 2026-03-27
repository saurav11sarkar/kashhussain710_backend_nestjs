import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
        registrationNumber: data.registrationNumber,
        vehicleName: data.make,
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
        exported: data.markedForExport ? 'Yes' : 'No',
      },
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

    return saved;
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
