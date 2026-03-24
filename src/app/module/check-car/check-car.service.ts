import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { freeDvlaApi, VehicleResponse } from 'src/app/helpers/davlaAPI';
import { CheckCar, CheckCarDocument } from './entities/check-car.entity';
import { CreateCheckCarDto } from './dto/create-check-car.dto';

@Injectable()
export class CheckCarService {
  constructor(
    @InjectModel(CheckCar.name)
    private readonly checkCarModel: Model<CheckCarDocument>,
  ) {}

  async createCheckCar(dto: CreateCheckCarDto) {
    const vehicle = await freeDvlaApi(dto.registrationNumber);
    const payload = this.mapVehicleToCheckCarPayload(vehicle);

    return this.checkCarModel.findOneAndUpdate(
      { registrationNumber: vehicle.registrationNumber },
      {
        $set: payload,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  private mapVehicleToCheckCarPayload(vehicle: VehicleResponse) {
    return {
      registrationNumber: vehicle.registrationNumber,
      heroSection: {
        registrationNumber: vehicle.registrationNumber,
        vehicleName: vehicle.make,
        subtitle: `${vehicle.taxStatus} tax and ${vehicle.motStatus} MOT`,
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
        engine: vehicle.engineCapacity ? `${vehicle.engineCapacity} cc` : 'N/A',
        bodyStyle: 'N/A',
        yearOfManufacture: vehicle.yearOfManufacture,
        euroStatus: vehicle.euroStatus || 'Unknown',
        ulezCompliant:
          vehicle.euroStatus?.toLowerCase().includes('euro') ? 'Yes' : 'Unknown',
        vehicleAge: `${new Date().getFullYear() - vehicle.yearOfManufacture} years`,
        registrationPlace: 'UK',
        registrationDate: vehicle.monthOfFirstRegistration,
        lastV5CIssuedDate: vehicle.dateOfLastV5CIssued,
        wheelPlan: 'N/A',
      },
      mileageInformation: {
        lastMotMileage: 0,
        mileageIssues: 'Need DVSA MOT API for real mileage history',
        average: 0,
        status: 'Estimated data not connected yet',
      },
      motHistorySummary: {
        totalTests: 0,
        passed: vehicle.motStatus.toLowerCase() === 'valid' ? 1 : 0,
        failed: vehicle.motStatus.toLowerCase() === 'valid' ? 0 : 1,
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

  private getDaysLeft(date?: string) {
    if (!date) return 'N/A';

    const targetDate = new Date(date);
    if (Number.isNaN(targetDate.getTime())) {
      return 'N/A';
    }

    const diffInMs = targetDate.getTime() - Date.now();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    return `${Math.max(diffInDays, 0)} days left`;
  }

  private getCo2Rating(value: number) {
    if (value <= 100) return 'A';
    if (value <= 120) return 'B';
    if (value <= 140) return 'C';
    if (value <= 160) return 'D';
    if (value <= 180) return 'E';
    if (value <= 200) return 'F';
    return 'G';
  }
}
