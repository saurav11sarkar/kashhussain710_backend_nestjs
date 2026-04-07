import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CarTaxDocument = HydratedDocument<CarTax>;

// ─── Nested schemas ───────────────────────────────────────────────────

@Schema({ _id: false })
class CarTaxStatus {
  @Prop() taxStatus?: string;
  @Prop() taxDueDate?: string;
  @Prop() taxDaysLeft?: number;
  @Prop() motStatus?: string;
  @Prop() motExpiryDate?: string;
  @Prop() motDaysLeft?: number;
}

@Schema({ _id: false })
class CarTaxVehicleDetails {
  @Prop() make?: string;
  @Prop() model?: string;
  @Prop() modelVariant?: string;
  @Prop() description?: string;
  @Prop() colour?: string;
  @Prop() fuelType?: string;
  @Prop() transmission?: string;
  @Prop() driveType?: string;
  @Prop() engineCapacity?: string;
  @Prop() yearOfManufacture?: number;
  @Prop() vehicleAge?: string;
  @Prop() dateFirstRegistered?: string;
  @Prop() registrationPlace?: string;
  @Prop() lastV5cIssueDate?: string;
  @Prop() euroStatus?: string;
  @Prop() ulezCompliant?: string;
  @Prop() typeApproval?: string;
  @Prop() wheelPlan?: string;
  @Prop() bodyStyle?: string;
}

@Schema({ _id: false })
class CarTaxMileage {
  @Prop() lastMotMileage?: string;
  @Prop() mileageIssues?: string;
  @Prop() averageMileage?: string;
  @Prop() mileageStatus?: string;
  @Prop() estimatedCurrentMileage?: string;
}

@Schema({ _id: false })
class CarTaxMotHistory {
  @Prop() totalTests?: number;
  @Prop() passed?: number;
  @Prop() failed?: number;
  @Prop() passRate?: string;
}

@Schema({ _id: false })
class CarTaxPerformance {
  @Prop() powerKw?: string;
  @Prop() powerBhp?: string;
  @Prop() maxSpeedMph?: string;
  @Prop() maxTorqueNm?: string;
  @Prop() maxTorqueRpm?: string;
  @Prop() zeroTo60Mph?: string;
}

@Schema({ _id: false })
class CarTaxDimensions {
  @Prop() widthMm?: string;
  @Prop() heightMm?: string;
  @Prop() lengthMm?: string;
  @Prop() wheelBaseMm?: string;
  @Prop() kerbWeightKg?: string;
  @Prop() maxAllowedWeightKg?: string;
}

@Schema({ _id: false })
class CarTaxFuelEconomy {
  @Prop() urbanMpg?: string;
  @Prop() extraUrbanMpg?: string;
  @Prop() combinedMpg?: string;
}

@Schema({ _id: false })
class CarTaxRoadTax {
  @Prop() cost12Months?: string;
  @Prop() cost6Months?: string;
  @Prop() co2Emissions?: string;
  @Prop() co2EmissionBand?: string;
}

@Schema({ _id: false })
class CarTaxAdditionalInfo {
  @Prop() fuelTankCapacityLitres?: string;
  @Prop() engineNumber?: string;
  @Prop() vinLast5Digits?: string;
}

@Schema({ _id: false })
class CarTaxVehicleFlags {
  @Prop() exported?: string;
  @Prop() safetyRecalls?: string;
}

// ─── Main schema ──────────────────────────────────────────────────────

@Schema({ timestamps: true })
export class CarTax {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  user!: Types.ObjectId;

  @Prop({ uppercase: true, trim: true })
  registrationNumber?: string;

  @Prop({
    type: String,
    enum: ['initial', 'technical', 'specification', 'combined'],
    default: 'initial',
  })
  reportType?: string;

  @Prop({ type: CarTaxStatus })
  status?: CarTaxStatus;

  @Prop({ type: CarTaxVehicleDetails })
  vehicleDetails?: CarTaxVehicleDetails;

  @Prop({ type: CarTaxMileage })
  mileage?: CarTaxMileage;

  @Prop({ type: CarTaxMotHistory })
  motHistory?: CarTaxMotHistory;

  @Prop({ type: CarTaxPerformance })
  performance?: CarTaxPerformance;

  @Prop({ type: CarTaxDimensions })
  dimensions?: CarTaxDimensions;

  @Prop({ type: CarTaxFuelEconomy })
  fuelEconomy?: CarTaxFuelEconomy;

  @Prop({ type: CarTaxRoadTax })
  roadTax?: CarTaxRoadTax;

  @Prop({ type: CarTaxAdditionalInfo })
  additionalInfo?: CarTaxAdditionalInfo;

  @Prop({ type: CarTaxVehicleFlags })
  vehicleFlags?: CarTaxVehicleFlags;

  // Full raw API response saved for debugging
  @Prop({ type: Object })
  rawResponse?: Record<string, any>;
}

export const CarTaxSchema = SchemaFactory.createForClass(CarTax);
