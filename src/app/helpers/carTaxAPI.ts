import {
  BadGatewayException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

const CARTAX_HOST = 'uk-vehicle-data1.p.rapidapi.com';
const BASE_URL = `https://${CARTAX_HOST}/cartax.api.v1.Public`;

// ─── Generic fetch helper ─────────────────────────────────────────────
async function callCarTax(endpoint: string, vrm: string, apiKey: string): Promise<any> {
  if (!apiKey) throw new InternalServerErrorException('CarTax API key missing');

  const cleanVrm = vrm.replace(/\s/g, '').toUpperCase();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': CARTAX_HOST,
        'x-rapidapi-key': apiKey,
      },
      body: JSON.stringify({ vrm: cleanVrm }),
    });
  } catch {
    throw new ServiceUnavailableException('Unable to connect to CarTax API');
  }

  if (!response.ok) {
    let errorMessage = `CarTax API failed: ${response.status}`;
    try {
      const err = await response.json();
      errorMessage = err?.message ?? errorMessage;
    } catch { /* ignore */ }
    if (response.status === 400) throw new BadRequestException(errorMessage);
    if (response.status === 404) throw new NotFoundException(errorMessage);
    if (response.status === 401 || response.status === 403)
      throw new BadGatewayException('CarTax API authentication failed');
    throw new BadGatewayException(errorMessage);
  }

  return response.json();
}

// ─── Only GetInitialReport is available on this RapidAPI plan ─────────
// GetTechnicalDetails & GetVehicleSpecification do NOT exist on this plan
export const getInitialReport = (vrm: string, apiKey: string) =>
  callCarTax('GetInitialReport', vrm, apiKey);

// ─── Helpers ──────────────────────────────────────────────────────────
function val(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (['No Data', 'Not Available', 'N/A', '', 'undefined', 'null'].includes(s))
    return undefined;
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

// ─── Parse GetInitialReport response ─────────────────────────────────
// API response shape: { vehicle: { tax, mot, specification, running_costs, ... } }
export function parseCarTaxResponse(raw: any) {
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
      motStatus: mot.valid === true ? 'Valid' : mot.valid === false ? 'Invalid' : val(mot.status),
      motExpiryDate: motExpiry,
      motDaysLeft: daysLeft(motExpiry),
    },
    vehicleDetails: {
      make: val(v.make),
      model: val(v.model),
      modelVariant: val(v.model),
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
      ulezCompliant: v.ulez_compliance?.status === 'Pass' ? 'Yes' : val(v.ulez_compliance?.status),
      typeApproval: val(v.type_approval),
      wheelPlan: val(v.wheelplan),
      bodyStyle: val(v.body_type),
    },
    mileage: {
      lastMotMileage: val(mot.mileage_last_year),
      mileageIssues: v.mileage_status?.status === 'Pass' ? 'No' : val(v.mileage_status?.message),
      averageMileage: val(mot.mileage_average),
      mileageStatus: val(mot.mileage_status),
      estimatedCurrentMileage: val(mot.estimated_current_mileage),
    },
    motHistory: {
      totalTests: numVal(summary.test_count),
      passed: summary.pass_count != null
        ? (numVal(summary.pass_count) ?? 0) + (numVal(summary.pass_with_advisory_count) ?? 0)
        : undefined,
      failed: numVal(summary.fail_count),
      passRate: val(summary.pass_rate),
    },
    performance: {
      powerBhp: val(spec.bhp) ?? val(v.bhp),
      maxSpeedMph: val(spec.top_speed),
      zeroTo60Mph: val(spec.acceleration),
    },
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