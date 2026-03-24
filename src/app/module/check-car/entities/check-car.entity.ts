import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CheckCarDocument = HydratedDocument<CheckCar>;

@Schema({ _id: false })
class TaxInfo {
  @Prop() expiryDate?: string;
  @Prop() daysLeft?: string;
}

@Schema({ _id: false })
class MotInfo {
  @Prop() expiryDate?: string;
  @Prop() daysLeft?: string;
}

@Schema({ _id: false })
class HeroSection {
  @Prop() registrationNumber?: string;
  @Prop() vehicleName?: string;
  @Prop() subtitle?: string;

  @Prop({ type: TaxInfo })
  tax?: TaxInfo;

  @Prop({ type: MotInfo })
  mot?: MotInfo;
}

@Schema({ _id: false })
class VehicleDetails {
  @Prop() modelVariant?: string;
  @Prop() description?: string;
  @Prop() primaryColour?: string;
  @Prop() fuelType?: string;
  @Prop() transmission?: string;
  @Prop() driveType?: string;
  @Prop() engine?: string;
  @Prop() bodyStyle?: string;
  @Prop() yearOfManufacture?: number;
  @Prop() euroStatus?: string;
  @Prop() ulezCompliant?: string;
  @Prop() vehicleAge?: string;
  @Prop() registrationPlace?: string;
  @Prop() registrationDate?: string;
  @Prop() lastV5CIssuedDate?: string;
  @Prop() wheelPlan?: string;
}

@Schema({ _id: false })
class MileageInformation {
  @Prop() lastMotMileage?: number;
  @Prop() mileageIssues?: string;
  @Prop() average?: number;
  @Prop() status?: string;
}

@Schema({ _id: false })
class MotHistorySummary {
  @Prop() totalTests?: number;
  @Prop() passed?: number;
  @Prop() failed?: number;
}

@Schema({ _id: false })
class Performance {
  @Prop() power?: string;
  @Prop() maxSpeed?: string;
  @Prop() maxTorque?: string;
  @Prop() zeroToSixty?: string;
}

@Schema({ _id: false })
class ImportantVehicleInformation {
  @Prop() exported?: string;
  @Prop() safetyRecalls?: string;
  @Prop() damageHistory?: string;
  @Prop() salvageHistory?: string;
  @Prop() fullServiceHistory?: string;
  @Prop() exTaxiNhsPoliceCheck?: string;
  @Prop() writtenOff?: string;
  @Prop() internetHistory?: string;
  @Prop() onFinance?: string;
  @Prop() keeperPlateChangesImportExportVinLogbookCheck?: string;
  @Prop() stolen?: string;
}

@Schema({ _id: false })
class DimensionsAndWeight {
  @Prop() width?: string;
  @Prop() height?: string;
  @Prop() length?: string;
  @Prop() wheelBase?: string;
  @Prop() kerbWeight?: string;
  @Prop() maxAllowedWeight?: string;
}

@Schema({ _id: false })
class FuelEconomy {
  @Prop() urban?: string;
  @Prop() extraUrban?: string;
  @Prop() combined?: string;
}

@Schema({ _id: false })
class Co2EmissionFigures {
  @Prop() value?: string;
  @Prop() rating?: string;
}

@Schema({ _id: false })
class SafetyRatings {
  @Prop() child?: string;
  @Prop() adult?: string;
  @Prop() pedestrian?: string;
}

@Schema({ _id: false })
class RoadTax {
  @Prop() tax12MonthsCost?: string;
  @Prop() tax6MonthsCost?: string;
}

@Schema({ _id: false })
class PricingPlan {
  @Prop() name?: string;
  @Prop() price?: string;

  @Prop({ type: [String], default: [] })
  features?: string[];

  @Prop({ default: false })
  isPopular?: boolean;
}

@Schema({ timestamps: true })
export class CheckCar {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ uppercase: true, trim: true })
  registrationNumber?: string;

  @Prop({ type: HeroSection })
  heroSection?: HeroSection;

  @Prop({ type: VehicleDetails })
  vehicleDetails?: VehicleDetails;

  @Prop({ type: MileageInformation })
  mileageInformation?: MileageInformation;

  @Prop({ type: MotHistorySummary })
  motHistorySummary?: MotHistorySummary;

  @Prop({ type: Performance })
  performance?: Performance;

  @Prop({ type: ImportantVehicleInformation })
  importantVehicleInformation?: ImportantVehicleInformation;

  @Prop({ type: DimensionsAndWeight })
  dimensionsAndWeight?: DimensionsAndWeight;

  @Prop({ type: FuelEconomy })
  fuelEconomy?: FuelEconomy;

  @Prop({ type: Co2EmissionFigures })
  co2EmissionFigures?: Co2EmissionFigures;

  @Prop({ type: SafetyRatings })
  safetyRatings?: SafetyRatings;

  @Prop({ type: RoadTax })
  roadTax?: RoadTax;

  @Prop({ type: [PricingPlan], default: [] })
  pricingPlans?: PricingPlan[];
}

export const CheckCarSchema = SchemaFactory.createForClass(CheckCar);
