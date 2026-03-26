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
import { CreateCheckCarDto } from './dto/create-check-car.dto';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class CheckCarService {
  constructor(
    @InjectModel(CheckCar.name)
    private readonly checkCarModel: Model<CheckCarDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ─── Create Vehicle Report ─────────────────────────────────

  async createCheckCar(userId: string, dto: CreateCheckCarDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const [vehicleResult, motResult] = await Promise.allSettled([
      freeDvlaApi(dto.registrationNumber),
      getDvsaMotHistory(dto.registrationNumber),
    ]);

    if (vehicleResult.status === 'rejected') {
      throw vehicleResult.reason;
    }

    const vehicle = vehicleResult.value;
    const motData =
      motResult.status === 'fulfilled' ? motResult.value : null;

    const mileageInfo = extractMileageInfo(motData);
    const motSummary = extractMotSummary(motData);
    const payload = this.mapVehicleToCheckCarPayload(
      vehicle,
      mileageInfo,
      motSummary,
    );

    return this.checkCarModel.findOneAndUpdate(
      { registrationNumber: vehicle.registrationNumber },
      { $set: { ...payload, user: user._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  // ─── Get Full MOT History ──────────────────────────────────

  async getMotHistory(registration: string) {
    const cleanReg = registration.replace(/\s+/g, '').toUpperCase();

    const [vehicleResult, motResult] = await Promise.allSettled([
      freeDvlaApi(cleanReg),
      getDvsaMotHistory(cleanReg),
    ]);

    if (vehicleResult.status === 'rejected') {
      throw vehicleResult.reason;
    }

    const vehicle = vehicleResult.value;
    const motData: DvsaMotResponse | null =
      motResult.status === 'fulfilled' ? motResult.value : null;

    const mileageInfo = extractMileageInfo(motData);
    const motSummary = extractMotSummary(motData);

    const formattedTests = (motData?.motTests || [])
      .sort(
        (a, b) =>
          new Date(b.completedDate).getTime() -
          new Date(a.completedDate).getTime(),
      )
      .map((test) => ({
        completedDate: test.completedDate,
        testResult: test.testResult,
        expiryDate: test.expiryDate || null,
        odometerValue: Number(test.odometerValue) || 0,
        odometerUnit: test.odometerUnit || 'mi',
        odometerResultType: test.odometerResultType || 'READ',
        motTestNumber: test.motTestNumber || null,
        defects: (test.defects || []).map((d) => ({
          type: d.type,
          text: d.text,
          dangerous: d.dangerous ?? false,
        })),
        advisories: (test.defects || []).filter((d) => d.type === 'ADVISORY'),
        minorDefects: (test.defects || []).filter((d) => d.type === 'MINOR'),
        majorDefects: (test.defects || []).filter((d) => d.type === 'MAJOR'),
        dangerousDefects: (test.defects || []).filter(
          (d) => d.type === 'DANGEROUS',
        ),
        prsFails: (test.defects || []).filter((d) => d.type === 'PRS'),
      }));

    const dvsaUnavailable = !motData;

    return {
      registration: vehicle.registrationNumber,
      make: motData?.make || vehicle.make,
      model: motData?.model || null,
      firstUsedDate:
        motData?.firstUsedDate || vehicle.monthOfFirstRegistration || null,
      fuelType: motData?.fuelType || vehicle.fuelType || null,
      primaryColour: motData?.primaryColour || vehicle.colour || null,
      engineSize:
        motData?.engineSize ||
        (vehicle.engineCapacity ? `${vehicle.engineCapacity}` : null),
      hasOutstandingRecall: motData?.hasOutstandingRecall || 'Unknown',
      summary: motSummary,
      mileage: mileageInfo,
      motTests: formattedTests,
      ...(dvsaUnavailable && {
        warning:
          'Full MOT history unavailable — DVSA credentials needed. Showing DVLA data only.',
      }),
    };
  }

  // ─── Map Payload ───────────────────────────────────────────

  private mapVehicleToCheckCarPayload(
    vehicle: VehicleResponse,
    mileageInfo: ReturnType<typeof extractMileageInfo>,
    motSummary: ReturnType<typeof extractMotSummary>,
  ) {
    return {
      registrationNumber: vehicle.registrationNumber,
      heroSection: {
        registrationNumber: vehicle.registrationNumber,
        vehicleName: vehicle.make,
        tax: {
          expiryDate: vehicle.taxDueDate,
          daysLeft: this.getDaysLeft(vehicle.taxDueDate),
        },
        mot: {
          expiryDate: vehicle.motExpiryDate,
          daysLeft: this.getDaysLeft(vehicle.motExpiryDate),
        },
      },
      vehicleDetails: {
        modelVariant: `${vehicle.make} ${vehicle.engineCapacity || ''}`.trim(),
        description: `${vehicle.make} ${vehicle.fuelType}`,
        primaryColour: vehicle.colour,
        fuelType: vehicle.fuelType,
        transmission: 'N/A',
        driveType: 'N/A',
        engine: vehicle.engineCapacity
          ? `${vehicle.engineCapacity} cc`
          : 'N/A',
        bodyStyle: 'N/A',
        yearOfManufacture: vehicle.yearOfManufacture,
        euroStatus: vehicle.euroStatus || 'Unknown',
        ulezCompliant: vehicle.euroStatus?.toLowerCase().includes('euro')
          ? 'Yes'
          : 'Unknown',
        vehicleAge: `${new Date().getFullYear() - vehicle.yearOfManufacture} years`,
        registrationPlace: 'UK',
        registrationDate: vehicle.monthOfFirstRegistration,
        lastV5CIssuedDate: vehicle.dateOfLastV5CIssued,
        wheelPlan: vehicle.wheelplan || 'N/A',
      },
      mileageInformation: {
        lastMotMileage: mileageInfo.lastMotMileage,
        mileageIssues: mileageInfo.mileageIssues,
        average: mileageInfo.average,
        status: mileageInfo.status,
      },
      motHistorySummary: {
        totalTests: motSummary.totalTests,
        passed: motSummary.passed,
        failed: motSummary.failed,
      },
      performance: {
        power: vehicle.engineCapacity
          ? `${Math.round(vehicle.engineCapacity * 0.11)} BHP`
          : 'N/A',
        maxSpeed: 'N/A',
        maxTorque: 'N/A',
        zeroToSixty: 'N/A',
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

  // ─── Utilities ─────────────────────────────────────────────

  private getDaysLeft(date?: string): string {
    if (!date) return 'N/A';
    const targetDate = new Date(date);
    if (Number.isNaN(targetDate.getTime())) return 'N/A';
    const diffInDays = Math.ceil(
      (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return `${Math.max(diffInDays, 0)} days left`;
  }

  private getCo2Rating(value: number): string {
    if (value <= 100) return 'A';
    if (value <= 120) return 'B';
    if (value <= 140) return 'C';
    if (value <= 160) return 'D';
    if (value <= 180) return 'E';
    if (value <= 200) return 'F';
    return 'G';
  }
}