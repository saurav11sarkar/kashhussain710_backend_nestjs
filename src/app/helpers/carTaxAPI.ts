import {
  BadGatewayException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import config from '../config';

const BASE_URL = config.carTax.apiUrl;
const CARTAX_HOST = config.carTax.apiHost;
const CARTAX_PROVIDER = config.carTax.provider;

async function callCarTax(vrm: string, apiKey: string): Promise<any> {
  if (!apiKey) throw new InternalServerErrorException('CarTax API key missing');

  const cleanVrm = vrm.replace(/\s/g, '').toUpperCase();

  let response: Response;
  try {
    if (CARTAX_PROVIDER === 'rapidapi') {
      response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-rapidapi-host': CARTAX_HOST,
          'x-rapidapi-key': apiKey,
        },
        body: JSON.stringify({ vrm: cleanVrm }),
      });
    } else {
      const url = new URL(BASE_URL);
      url.searchParams.set('v', '2');
      url.searchParams.set('api_nullitems', '1');
      url.searchParams.set('auth_apikey', apiKey);
      url.searchParams.set('user_tag', '');
      url.searchParams.set('key_VRM', cleanVrm);

      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    }
  } catch {
    throw new ServiceUnavailableException('Unable to connect to CarTax API');
  }

  if (!response.ok) {
    let errorMessage = `CarTax API failed: ${response.status}`;
    try {
      const err = await response.json();
      errorMessage =
        err?.message ??
        err?.Response?.StatusMessage ??
        err?.Response?.Errors?.[0]?.Message ??
        errorMessage;
    } catch {
      // ignore JSON parsing errors on non-JSON responses
    }

    if (response.status === 400) throw new BadRequestException(errorMessage);
    if (response.status === 404) throw new NotFoundException(errorMessage);
    if (response.status === 401 || response.status === 403) {
      throw new BadGatewayException(
        `CarTax API authentication failed for provider "${CARTAX_PROVIDER}"`,
      );
    }
    throw new BadGatewayException(errorMessage);
  }

  return response.json();
}

export const getInitialReport = (vrm: string, apiKey: string) =>
  callCarTax(vrm, apiKey);

function val(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (['No Data', 'Not Available', 'N/A', '', 'undefined', 'null'].includes(s)) {
    return undefined;
  }
  return s;
}

function numVal(v: any): number | undefined {
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function daysLeft(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function parseCarTaxResponse(raw: any) {
  if (raw?.vehicle) {
    return parseRapidApiResponse(raw);
  }

  const dataItems = raw?.Response?.DataItems ?? {};
  const technicalDetails = dataItems.TechnicalDetails ?? {};
  const dimensions = technicalDetails.Dimensions ?? {};
  const performance = technicalDetails.Performance ?? {};
  const consumption = technicalDetails.Consumption ?? {};
  const vehicleRegistration = dataItems.VehicleRegistration ?? {};
  const smmtDetails = dataItems.SmmtDetails ?? {};
  const dvla = dataItems.DVLA ?? {};
  const recallData = dataItems.RecallData ?? {};

  const taxDueDate = val(dvla.TaxDueDate);
  const motExpiryDate = val(dvla.MotExpiryDate);

  return {
    status: {
      taxStatus: val(dvla.VehicleStatus),
      taxDueDate,
      taxDaysLeft: daysLeft(taxDueDate),
      motStatus: val(dvla.MotStatus),
      motExpiryDate,
      motDaysLeft: daysLeft(motExpiryDate),
    },
    vehicleDetails: {
      make: val(vehicleRegistration.Make) ?? val(smmtDetails.Make),
      model: val(vehicleRegistration.Model) ?? val(smmtDetails.ModelVariant),
      modelVariant: val(smmtDetails.ModelVariant),
      description: val(smmtDetails.SeriesDescription),
      colour: val(vehicleRegistration.Colour),
      fuelType: val(vehicleRegistration.FuelType),
      transmission: val(smmtDetails.Transmission),
      driveType: val(smmtDetails.DriveType),
      engineCapacity: val(vehicleRegistration.EngineCapacity),
      yearOfManufacture: numVal(vehicleRegistration.YearOfManufacture),
      vehicleAge: undefined,
      dateFirstRegistered: val(vehicleRegistration.DateFirstRegistered),
      registrationPlace: undefined,
      lastV5cIssueDate: val(dvla.DateOfLastV5CIssued),
      euroStatus: val(smmtDetails.EuroStatus),
      ulezCompliant: undefined,
      typeApproval: val(smmtDetails.TypeApprovalCategory),
      wheelPlan: val(smmtDetails.NumberOfAxles),
      bodyStyle: val(smmtDetails.BodyStyle),
    },
    mileage: {
      lastMotMileage: val(dvla.MotMileage),
      mileageIssues: undefined,
      averageMileage: undefined,
      mileageStatus: undefined,
      estimatedCurrentMileage: undefined,
    },
    motHistory: {
      totalTests: undefined,
      passed: undefined,
      failed: undefined,
      passRate: undefined,
    },
    performance: {
      powerBhp: val(performance.Power),
      maxSpeedMph: val(performance.TopSpeed),
      zeroTo60Mph: val(performance.Acceleration),
    },
    dimensions: {
      widthMm: val(dimensions.Width),
      heightMm: val(dimensions.Height),
      lengthMm: val(dimensions.Length),
      wheelBaseMm: val(dimensions.WheelBase),
      kerbWeightKg: val(dimensions.KerbWeight),
      maxAllowedWeightKg: val(dimensions.GrossVehicleWeight),
    },
    fuelEconomy: {
      urbanMpg: val(consumption.UrbanCold),
      extraUrbanMpg: val(consumption.ExtraUrban),
      combinedMpg: val(consumption.Combined),
    },
    roadTax: {
      cost12Months: val(dvla.VehicleExciseDutyRate),
      cost6Months: undefined,
      co2Emissions: val(smmtDetails.Co2),
      co2EmissionBand: val(dvla.VehicleExciseDutyBand),
    },
    additionalInfo: {
      fuelTankCapacityLitres: val(smmtDetails.FuelTankCapacity),
      engineNumber: val(dvla.EngineNumber),
      vinLast5Digits: val(dvla.VinLast5),
    },
    vehicleFlags: {
      exported: val(dvla.ExportMarker),
      safetyRecalls: val(recallData.OutstandingRecallCount),
    },
  };
}

function parseRapidApiResponse(raw: any) {
  const v = raw?.vehicle ?? {};
  const tax = v.tax ?? {};
  const mot = v.mot ?? {};
  const spec = v.specification ?? {};
  const mpg = v.running_costs?.mpg ?? {};
  const summary = mot.test_summary ?? {};

  const taxExpiry = val(tax.expires);
  const motExpiry = val(mot.expires);

  return {
    status: {
      taxStatus: tax.valid === true ? 'Taxed' : tax.sorn ? 'SORN' : val(tax.status),
      taxDueDate: taxExpiry,
      taxDaysLeft: daysLeft(taxExpiry),
      motStatus:
        mot.valid === true ? 'Valid' : mot.valid === false ? 'Invalid' : val(mot.status),
      motExpiryDate: motExpiry,
      motDaysLeft: daysLeft(motExpiry),
    },
    vehicleDetails: {
      make: val(v.make),
      model: val(v.model),
      modelVariant: val(v.model),
      description: val(v.derivative),
      colour: val(v.colour),
      fuelType: val(v.fuel),
      transmission: val(v.transmission),
      driveType: val(v.drive_type),
      engineCapacity: val(v.engine_size),
      yearOfManufacture: numVal(v.year),
      vehicleAge: val(v.age),
      dateFirstRegistered: val(v.registered),
      registrationPlace: val(v.registered_location),
      lastV5cIssueDate: val(v.v5c_issue_date),
      euroStatus: val(spec.euro_status),
      ulezCompliant:
        v.ulez_compliance?.status === 'Pass' ? 'Yes' : val(v.ulez_compliance?.status),
      typeApproval: val(v.type_approval),
      wheelPlan: val(v.wheelplan),
      bodyStyle: val(v.body_type),
    },
    mileage: {
      lastMotMileage: val(mot.mileage_last_year),
      mileageIssues:
        v.mileage_status?.status === 'Pass' ? 'No' : val(v.mileage_status?.message),
      averageMileage: val(mot.mileage_average),
      mileageStatus: val(mot.mileage_status),
      estimatedCurrentMileage: val(mot.estimated_current_mileage),
    },
    motHistory: {
      totalTests: numVal(summary.test_count),
      passed:
        summary.pass_count != null
          ? (numVal(summary.pass_count) ?? 0) +
            (numVal(summary.pass_with_advisory_count) ?? 0)
          : undefined,
      failed: numVal(summary.fail_count),
      passRate: val(summary.pass_rate),
    },
    performance: {
      powerBhp: val(spec.bhp) ?? val(v.bhp),
      maxSpeedMph: val(spec.top_speed),
      zeroTo60Mph: val(spec.acceleration),
    },
    dimensions: undefined,
    fuelEconomy: {
      urbanMpg: val(mpg.urban),
      extraUrbanMpg: val(mpg.extra_urban),
      combinedMpg: val(mpg.combined),
    },
    roadTax: {
      cost12Months: val(tax.cost_per_twelve_months),
      cost6Months: val(tax.cost_per_six_months),
      co2Emissions: val(v.emissions),
      co2EmissionBand: val(tax.ved_band),
    },
    additionalInfo: {
      fuelTankCapacityLitres: val(v.fuel_tank_capacity),
      engineNumber: val(v.engine_number),
      vinLast5Digits: val(v.vin_last_5),
    },
    vehicleFlags: {
      exported: v.exported?.status === 'Pass' ? 'No' : val(v.exported?.message),
      safetyRecalls: val(v.recalls?.message),
    },
  };
}
