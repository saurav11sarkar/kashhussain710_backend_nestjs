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
  @Prop() countryOfOrigin?: string;
  @Prop() numberOfDoors?: number;
  @Prop() numberOfSeats?: number;
  @Prop() numberOfGears?: number;
  @Prop() vehicleClass?: string;
  @Prop() limitedEdition?: string;
  @Prop() doorPlanLiteral?: string;
}

@Schema({ _id: false })
class CarTaxMileageRecord {
  @Prop() date?: string;
  @Prop() unit?: string;
  @Prop() mileage?: number;
  @Prop() change?: string;
}

@Schema({ _id: false })
class CarTaxMileage {
  @Prop() lastMotMileage?: string;
  @Prop() mileageIssues?: string;
  @Prop() averageMileage?: string;
  @Prop() mileageStatus?: string;
  @Prop() estimatedCurrentMileage?: string;
  @Prop({ type: [CarTaxMileageRecord] })
  mileageHistory?: CarTaxMileageRecord[];
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
  @Prop() peakPower?: string;
  @Prop() torqueNm?: string;
  @Prop() torqueFtLb?: string;
  @Prop() peakTorque?: string;
  @Prop() maxSpeedKph?: string;
}

@Schema({ _id: false })
class CarTaxDimensions {
  @Prop() widthMm?: string;
  @Prop() heightMm?: string;
  @Prop() lengthMm?: string;
  @Prop() wheelBaseMm?: string;
  @Prop() kerbWeightKg?: string;
  @Prop() maxAllowedWeightKg?: string;
  @Prop() grossWeightKg?: string;
  @Prop() unladenWeightKg?: string;
  @Prop() fuelTankCapacityLitres?: string;
  @Prop() carLengthMm?: string;
  @Prop() numberOfAxles?: number;
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
class CarTaxStolenCheck {
  @Prop() status?: string;
  @Prop() message?: string;
}

@Schema({ _id: false })
class CarTaxWriteOffReport {
  @Prop() make?: string;
  @Prop() model?: string;
  @Prop() insurerName?: string;
  @Prop() causeOfDamage?: string;
  @Prop() status?: string;
  @Prop() theftIndicator?: string;
  @Prop() theftIndicatorCode?: string;
  @Prop() lossDate?: string;
  @Prop({ type: [String] })
  damageLocations?: string[];
}

@Schema({ _id: false })
class CarTaxFinanceReport {
  @Prop() status?: string;
  @Prop() message?: string;
  @Prop() agreementNumber?: string;
  @Prop() companyName?: string;
  @Prop() agreementType?: string;
  @Prop() agreementDate?: string;
  @Prop() agreementTerm?: string;
}

@Schema({ _id: false })
class CarTaxSalvageHistory {
  @Prop() found?: boolean;
  @Prop() make?: string;
  @Prop() model?: string;
  @Prop() registration?: string;
  @Prop() mileage?: string;
  @Prop() category?: string;
  @Prop() retailValue?: string;
  @Prop() salvageLocation?: string;
  @Prop() saleDate?: string;
  @Prop() description?: string;
}

@Schema({ _id: false })
class CarTaxExTaxiCheck {
  @Prop() status?: string;
  @Prop() message?: string;
}

@Schema({ _id: false })
class CarTaxValuation {
  @Prop() onTheRoad?: string;
  @Prop() dealerForecourt?: string;
  @Prop() tradeRetail?: string;
  @Prop() tradeAverage?: string;
  @Prop() tradePoor?: string;
  @Prop() partExchange?: string;
  @Prop() privateClean?: string;
  @Prop() privateAverage?: string;
  @Prop() auction?: string;
}

@Schema({ _id: false })
class CarTaxLogbookCounts {
  @Prop() total?: number;
  @Prop({ type: [String] })
  certificateIssueDates?: string[];
}

@Schema({ _id: false })
class CarTaxPlateChange {
  @Prop() changedTo?: string;
  @Prop() transferType?: string;
  @Prop() dateOfTransaction?: string;
}

@Schema({ _id: false })
class CarTaxPlateChanges {
  @Prop() totalChanges?: number;
  @Prop({ type: [CarTaxPlateChange] })
  changes?: CarTaxPlateChange[];
}

@Schema({ _id: false })
class CarTaxPreviousKeeper {
  @Prop() dateOfTransaction?: string;
  @Prop() keeperNumber?: number;
  @Prop() dateOfLastKeeperChange?: string;
}

@Schema({ _id: false })
class CarTaxPreviousKeepers {
  @Prop() totalKeepers?: number;
  @Prop() currentKeeperDuration?: string;
  @Prop({ type: [CarTaxPreviousKeeper] })
  keepers?: CarTaxPreviousKeeper[];
}

@Schema({ _id: false })
class CarTaxColourChanges {
  @Prop() status?: string;
  @Prop() message?: string;
}

@Schema({ _id: false })
class CarTaxEngineData {
  @Prop() engineNumber?: string;
  @Prop() fuelSystem?: string;
  @Prop() cylinders?: number;
  @Prop() valvesPerCyl?: number;
  @Prop() stroke?: string;
  @Prop() bore?: string;
  @Prop() arrangement?: string;
  @Prop() camType?: string;
  @Prop() engineLocation?: string;
  @Prop() aspiration?: string;
  @Prop() description?: string;
  @Prop() make?: string;
  @Prop() fuelDelivery?: string;
  @Prop() primaryFuelFlag?: string;
}

@Schema({ _id: false })
class CarTaxSmmtDetails {
  @Prop() smmtMarque?: string;
  @Prop() smmtRange?: string;
  @Prop() modelVariant?: string;
  @Prop() series?: string;
  @Prop() gearbox?: string;
  @Prop() numberOfGears?: number;
  @Prop() countryOfOrigin?: string;
  @Prop() fuel?: string;
  @Prop() engineSize?: string;
  @Prop() body?: string;
  @Prop() numberOfDoors?: number;
  @Prop() modelStartDate?: string;
  @Prop() systemSetupDate?: string;
  @Prop() driveType?: string;
}

@Schema({ _id: false })
class CarTaxRunningCosts {
  @Prop() tax6Months?: string;
  @Prop() tax12Months?: string;
  @Prop() fuelCost12kMiles?: string;
  @Prop() fullTankCost?: string;
  @Prop() motCost?: string;
}

@Schema({ _id: false })
class CarTaxEmissions {
  @Prop() co2Gkm?: string;
  @Prop() emissionBand?: string;
}

@Schema({ _id: false })
class CarTaxVehicleFlags {
  @Prop() exported?: string;
  @Prop() safetyRecalls?: string;
  @Prop() financeRecord?: string;
  @Prop() policeStolen?: string;
  @Prop() salvageHistory?: string;
  @Prop() writeOff?: string;
  @Prop() highRisk?: string;
  @Prop() v5cCount?: string;
  @Prop() totalKeepers?: string;
  @Prop() colourChange?: string;
  @Prop() plateChange?: string;
  @Prop() imported?: string;
  @Prop() scrapped?: string;
  @Prop() internetHistory?: string;
  @Prop() serviceHistory?: string;
  @Prop() exTaxiNhsPolice?: string;
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

  @Prop({ enum: ['free', 'paid'], default: 'free' })
  keyType?: string;

  // Raw DVLA response (enrichment data)
  @Prop({ type: Object })
  dvlaData?: Record<string, any>;

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

  @Prop({ type: CarTaxStolenCheck })
  stolenCheck?: CarTaxStolenCheck;

  @Prop({ type: CarTaxWriteOffReport })
  writeOffReport?: CarTaxWriteOffReport;

  @Prop({ type: CarTaxFinanceReport })
  financeReport?: CarTaxFinanceReport;

  @Prop({ type: CarTaxSalvageHistory })
  salvageHistory?: CarTaxSalvageHistory;

  @Prop({ type: CarTaxExTaxiCheck })
  exTaxiCheck?: CarTaxExTaxiCheck;

  @Prop({ type: CarTaxValuation })
  valuation?: CarTaxValuation;

  @Prop({ type: CarTaxLogbookCounts })
  logbookCounts?: CarTaxLogbookCounts;

  @Prop({ type: CarTaxPlateChanges })
  plateChanges?: CarTaxPlateChanges;

  @Prop({ type: CarTaxPreviousKeepers })
  previousKeepers?: CarTaxPreviousKeepers;

  @Prop({ type: CarTaxColourChanges })
  colourChanges?: CarTaxColourChanges;

  @Prop({ type: CarTaxEngineData })
  engineData?: CarTaxEngineData;

  @Prop({ type: CarTaxSmmtDetails })
  smmtDetails?: CarTaxSmmtDetails;

  @Prop({ type: CarTaxRunningCosts })
  runningCosts?: CarTaxRunningCosts;

  @Prop({ type: CarTaxEmissions })
  emissions?: CarTaxEmissions;

  @Prop({ type: CarTaxVehicleFlags })
  vehicleFlags?: CarTaxVehicleFlags;

  // Full raw API response saved for debugging
  @Prop({ type: Object })
  rawResponse?: Record<string, any>;
}

export const CarTaxSchema = SchemaFactory.createForClass(CarTax);
