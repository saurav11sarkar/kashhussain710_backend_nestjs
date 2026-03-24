import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckCarDto {
  @ApiProperty({
    example: 'AB12 CDE',
    description: 'UK vehicle registration number',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{2,8}$/, {
    message:
      'registrationNumber must contain only letters and numbers after removing spaces',
  })
  registrationNumber: string;
}

import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TaxInfoDto {
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  daysLeft?: string;
}

class MotInfoDto {
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  daysLeft?: string;
}

class HeroSectionDto {
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  vehicleName?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TaxInfoDto)
  tax?: TaxInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MotInfoDto)
  mot?: MotInfoDto;
}

class VehicleDetailsDto {
  @IsOptional() @IsString() modelVariant?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() primaryColour?: string;
  @IsOptional() @IsString() fuelType?: string;
  @IsOptional() @IsString() transmission?: string;
  @IsOptional() @IsString() driveType?: string;
  @IsOptional() @IsString() engine?: string;
  @IsOptional() @IsString() bodyStyle?: string;
  @IsOptional() @IsNumber() yearOfManufacture?: number;
  @IsOptional() @IsString() euroStatus?: string;
  @IsOptional() @IsString() ulezCompliant?: string;
  @IsOptional() @IsString() vehicleAge?: string;
  @IsOptional() @IsString() registrationPlace?: string;
  @IsOptional() @IsString() registrationDate?: string;
  @IsOptional() @IsString() lastV5CIssuedDate?: string;
  @IsOptional() @IsString() wheelPlan?: string;
}

class MileageInformationDto {
  @IsOptional()
  @IsNumber()
  lastMotMileage?: number;

  @IsOptional()
  @IsString()
  mileageIssues?: string;

  @IsOptional()
  @IsNumber()
  average?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

class MotHistorySummaryDto {
  @IsOptional()
  @IsNumber()
  totalTests?: number;

  @IsOptional()
  @IsNumber()
  passed?: number;

  @IsOptional()
  @IsNumber()
  failed?: number;
}

class PerformanceDto {
  @IsOptional() @IsString() power?: string;
  @IsOptional() @IsString() maxSpeed?: string;
  @IsOptional() @IsString() maxTorque?: string;
  @IsOptional() @IsString() zeroToSixty?: string;
}

class ImportantVehicleInformationDto {
  @IsOptional() @IsString() exported?: string;
  @IsOptional() @IsString() safetyRecalls?: string;
  @IsOptional() @IsString() damageHistory?: string;
  @IsOptional() @IsString() salvageHistory?: string;
  @IsOptional() @IsString() fullServiceHistory?: string;
  @IsOptional() @IsString() exTaxiNhsPoliceCheck?: string;
  @IsOptional() @IsString() writtenOff?: string;
  @IsOptional() @IsString() internetHistory?: string;
  @IsOptional() @IsString() onFinance?: string;
  @IsOptional()
  @IsString()
  keeperPlateChangesImportExportVinLogbookCheck?: string;
  @IsOptional() @IsString() stolen?: string;
}

class DimensionsAndWeightDto {
  @IsOptional() @IsString() width?: string;
  @IsOptional() @IsString() height?: string;
  @IsOptional() @IsString() length?: string;
  @IsOptional() @IsString() wheelBase?: string;
  @IsOptional() @IsString() kerbWeight?: string;
  @IsOptional() @IsString() maxAllowedWeight?: string;
}

class FuelEconomyDto {
  @IsOptional() @IsString() urban?: string;
  @IsOptional() @IsString() extraUrban?: string;
  @IsOptional() @IsString() combined?: string;
}

class Co2EmissionFiguresDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  rating?: string;
}

class SafetyRatingsDto {
  @IsOptional() @IsString() child?: string;
  @IsOptional() @IsString() adult?: string;
  @IsOptional() @IsString() pedestrian?: string;
}

class RoadTaxDto {
  @IsOptional()
  @IsString()
  tax12MonthsCost?: string;

  @IsOptional()
  @IsString()
  tax6MonthsCost?: string;
}

class PricingPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;
}

export class CreateVehicleReportDto {
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => HeroSectionDto)
  heroSection?: HeroSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDetailsDto)
  vehicleDetails?: VehicleDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MileageInformationDto)
  mileageInformation?: MileageInformationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MotHistorySummaryDto)
  motHistorySummary?: MotHistorySummaryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PerformanceDto)
  performance?: PerformanceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImportantVehicleInformationDto)
  importantVehicleInformation?: ImportantVehicleInformationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsAndWeightDto)
  dimensionsAndWeight?: DimensionsAndWeightDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FuelEconomyDto)
  fuelEconomy?: FuelEconomyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => Co2EmissionFiguresDto)
  co2EmissionFigures?: Co2EmissionFiguresDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SafetyRatingsDto)
  safetyRatings?: SafetyRatingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RoadTaxDto)
  roadTax?: RoadTaxDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingPlanDto)
  pricingPlans?: PricingPlanDto[];
}
