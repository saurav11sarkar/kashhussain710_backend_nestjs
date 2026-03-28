import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CheckCar, CheckCarDocument } from './entities/check-car.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import {
  MotHistory,
  MotHistoryDocument,
} from '../mot-history/entities/mot-history.entity';
import {
  freeDVLACarCheck,
  paidDVLACarCheck,
  VehicleResponse,
} from 'src/app/helpers/davlaAPI';
import { getMOTHistory, MotVehicleResponse } from 'src/app/helpers/motAPI';

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

  // ─── DVLA response → CheckCar schema format ───────────────────────
  private buildCheckCarPayload(data: VehicleResponse) {
    const calcDays = (dateStr?: string) => {
      if (!dateStr) return undefined;
      const days = Math.ceil(
        (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return `${days} days`;
    };

    return {
      registrationNumber: data.registrationNumber,
      heroSection: {
        registrationNumber: data.registrationNumber,
        vehicleName: data.make,
        tax: {
          expiryDate: data.taxDueDate,
          daysLeft: calcDays(data.taxDueDate),
        },
        mot: {
          expiryDate: data.motExpiryDate,
          daysLeft: calcDays(data.motExpiryDate),
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

  // ─── MOT response → MotHistory schema format ──────────────────────
  private buildMotHistoryPayload(
    motData: MotVehicleResponse,
    userId: string,
    checkCarId: string,
  ) {
    const tests = motData.motTests ?? [];
    const latest = tests[0]; // API newest first

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
      totalPassed: tests.filter((t) => t.testResult === 'PASSED').length,
      totalFailed: tests.filter((t) => t.testResult === 'FAILED').length,
      latestTestResult: latest?.testResult,
      latestExpiryDate: latest?.expiryDate,
      lastMileage: latest?.odometerValue
        ? parseInt(latest.odometerValue, 10)
        : undefined,
    };
  }

  // ─── 1. FREE DVLA ─────────────────────────────────────────────────
  async freeDVLACheck(userId: string, registrationNumber: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    const dvlaData = await freeDVLACarCheck(registrationNumber);
    const payload = this.buildCheckCarPayload(dvlaData);

    return this.checkCarModel.create({ ...payload, user: user._id });
  }

  // ─── 2. PAID DVLA ─────────────────────────────────────────────────
  async paidDVLACheck(userId: string, registrationNumber: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    const dvlaData = await paidDVLACarCheck(registrationNumber);
    const payload = this.buildCheckCarPayload(dvlaData);

    return this.checkCarModel.create({ ...payload, user: user._id });
  }

  // ─── 3. MOT History ───────────────────────────────────────────────
  async motHistoryCheck(userId: string, registrationNumber: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    // DVLA + MOT parallel call
    const [dvlaData, motData] = await Promise.all([
      freeDVLACarCheck(registrationNumber),
      getMOTHistory(registrationNumber),
    ]);

    // Save CheckCar
    const checkCar = await this.checkCarModel.create({
      ...this.buildCheckCarPayload(dvlaData),
      user: user._id,
    });

    // Save MotHistory (linked to CheckCar)
    const motHistory = await this.motHistoryModel.create(
      this.buildMotHistoryPayload(
        motData,
        String(user._id),
        String(checkCar._id),
      ),
    );

    return { vehicle: checkCar, motHistory };
  }

  // ─── backward compat ──────────────────────────────────────────────
  async createCheckCar(userId: string, registrationNumber: string) {
    return this.freeDVLACheck(userId, registrationNumber);
  }
}
