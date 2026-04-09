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

// ─── UKVD API (fallback for missing data) ────────────────────────────
const UKVD_BASE = config.carTax.ukvdBaseUrl;
const UKVD_KEY = config.carTax.ukvdApiKey;

export async function callUkvd(vrm: string, dataPackage = 'VehicleDetails'): Promise<any> {
  if (!UKVD_KEY) {
    console.log('[UKVD] No API key configured');
    return null;
  }

  const cleanVrm = vrm.replace(/\s/g, '').toUpperCase();
  const url = new URL(`${UKVD_BASE}/${dataPackage}`);
  url.searchParams.set('v', '2');
  url.searchParams.set('api_nullitems', '1');
  url.searchParams.set('auth_apikey', UKVD_KEY);
  url.searchParams.set('user_tag', '');
  url.searchParams.set('key_VRM', cleanVrm);

  const fullUrl = url.toString();
  console.log(`[UKVD] Calling: ${fullUrl.replace(UKVD_KEY, 'KEY***')}`);

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      let errBody = '';
      try { errBody = await response.text(); } catch { /* ignore */ }
      console.log(`[UKVD] ${dataPackage} returned ${response.status} — body: ${errBody.substring(0, 300)}`);
      return null;
    }
    return response.json();
  } catch (err) {
    console.log(`[UKVD] ${dataPackage} fetch error:`, err);
    return null;
  }
}

export function parseUkvdResponse(raw: any) {
  if (!raw?.Response?.DataItems) return null;
  return parseUkvdData(raw.Response.DataItems);
}

/**
 * Deep merge: fill undefined/null fields in `primary` with values from `fallback`
 */
export function mergeReports(primary: any, fallback: any): any {
  if (!fallback) return primary;
  if (!primary) return fallback;

  const result = { ...primary };
  for (const key of Object.keys(fallback)) {
    if (result[key] === undefined || result[key] === null) {
      result[key] = fallback[key];
    } else if (
      typeof result[key] === 'object' &&
      !Array.isArray(result[key]) &&
      typeof fallback[key] === 'object' &&
      !Array.isArray(fallback[key])
    ) {
      result[key] = mergeReports(result[key], fallback[key]);
    }
  }
  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function val(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  // If it's an object (nested UKVD data), skip it
  if (typeof v === 'object') return undefined;
  const s = String(v).trim();
  if (['No Data', 'Not Available', 'N/A', '', 'undefined', 'null'].includes(s)) {
    return undefined;
  }
  return s;
}

function numVal(v: any): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'object') return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function daysLeft(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Enrich parsed result with DVLA data ─────────────────────────────
export function enrichWithDvla(parsed: any, dvlaData: any): any {
  if (!dvlaData) return parsed;

  const result = { ...parsed };

  // Status enrichment
  if (result.status) {
    result.status = { ...result.status };
    if (!result.status.taxStatus && dvlaData.taxStatus)
      result.status.taxStatus = dvlaData.taxStatus;
    if (!result.status.taxDueDate && dvlaData.taxDueDate) {
      result.status.taxDueDate = dvlaData.taxDueDate;
      result.status.taxDaysLeft = daysLeft(dvlaData.taxDueDate);
    }
    if (!result.status.motStatus && dvlaData.motStatus)
      result.status.motStatus = dvlaData.motStatus;
    if (!result.status.motExpiryDate && dvlaData.motExpiryDate) {
      result.status.motExpiryDate = dvlaData.motExpiryDate;
      result.status.motDaysLeft = daysLeft(dvlaData.motExpiryDate);
    }
  }

  // Vehicle details enrichment
  if (result.vehicleDetails) {
    result.vehicleDetails = { ...result.vehicleDetails };
    if (!result.vehicleDetails.make && dvlaData.make)
      result.vehicleDetails.make = dvlaData.make;
    if (!result.vehicleDetails.colour && dvlaData.colour)
      result.vehicleDetails.colour = dvlaData.colour;
    if (!result.vehicleDetails.fuelType && dvlaData.fuelType)
      result.vehicleDetails.fuelType = dvlaData.fuelType;
    if (!result.vehicleDetails.engineCapacity && dvlaData.engineCapacity)
      result.vehicleDetails.engineCapacity = String(dvlaData.engineCapacity);
    if (!result.vehicleDetails.yearOfManufacture && dvlaData.yearOfManufacture)
      result.vehicleDetails.yearOfManufacture = dvlaData.yearOfManufacture;
    if (!result.vehicleDetails.euroStatus && dvlaData.euroStatus)
      result.vehicleDetails.euroStatus = dvlaData.euroStatus;
    if (!result.vehicleDetails.wheelPlan && dvlaData.wheelplan)
      result.vehicleDetails.wheelPlan = dvlaData.wheelplan;
    if (!result.vehicleDetails.dateFirstRegistered && dvlaData.monthOfFirstRegistration)
      result.vehicleDetails.dateFirstRegistered = dvlaData.monthOfFirstRegistration;
    if (!result.vehicleDetails.lastV5cIssueDate && dvlaData.dateOfLastV5CIssued)
      result.vehicleDetails.lastV5cIssueDate = dvlaData.dateOfLastV5CIssued;
  }

  // CO2 enrichment
  if (dvlaData.co2Emissions) {
    if (result.roadTax) {
      result.roadTax = { ...result.roadTax };
      if (!result.roadTax.co2Emissions)
        result.roadTax.co2Emissions = String(dvlaData.co2Emissions);
    }
    if (result.emissions) {
      result.emissions = { ...result.emissions };
      if (!result.emissions.co2Gkm)
        result.emissions.co2Gkm = String(dvlaData.co2Emissions);
    }
  }

  // Exported flag
  if (result.vehicleFlags) {
    result.vehicleFlags = { ...result.vehicleFlags };
    if (!result.vehicleFlags.exported)
      result.vehicleFlags.exported = dvlaData.markedForExport ? 'Yes' : 'No';
  }

  return result;
}

// ─── Main router: detects RapidAPI vs UKVD response ─────────────────
export function parseCarTaxResponse(raw: any) {
  if (raw?.vehicle) {
    return parseRapidApiResponse(raw);
  }

  // Direct UKVD response
  if (raw?.Response?.DataItems) {
    return parseUkvdData(raw.Response.DataItems);
  }

  return {};
}

// ─── Dedicated UKVD parser ── handles nested objects correctly ───────
function parseUkvdData(dataItems: any) {
  const technicalDetails = dataItems.TechnicalDetails ?? {};
  const dimensions = technicalDetails.Dimensions ?? {};
  const performance = technicalDetails.Performance ?? {};
  const consumption = technicalDetails.Consumption ?? {};
  const vehicleRegistration = dataItems.VehicleRegistration ?? {};
  const smmtDetails = dataItems.SmmtDetails ?? {};
  const dvla = dataItems.DVLA ?? {};
  const engineData = technicalDetails.Engine ?? {};
  const stolenData = dataItems.StolenVehicleData ?? {};
  const financeData = dataItems.FinanceData ?? dataItems.FinanceRecordList ?? {};
  const writeOffData = dataItems.WriteOffData ?? {};
  const salvageData = dataItems.SalvageData ?? {};
  const vehicleHistory = dataItems.VehicleHistory ?? {};
  const valuationData = dataItems.ValuationData ?? dataItems.Valuation ?? {};
  const keepersHistory = dataItems.KeepersHistory ?? {};
  const plateChanges = dataItems.PlateChanges ?? {};
  const v5cHistory = dataItems.V5CHistory ?? {};
  const colourChanges = dataItems.ColourChanges ?? {};
  const recallData = dataItems.RecallData ?? {};

  // UKVD nests: Power → {Bhp, Kw, Rpm}, Torque → {Nm, FtLb, Rpm}, MaxSpeed → {Mph, Kph}
  const powerObj = typeof performance.Power === 'object' ? performance.Power : {};
  const torqueObj = typeof performance.Torque === 'object' ? performance.Torque : {};
  const maxSpeedObj = typeof performance.MaxSpeed === 'object' ? performance.MaxSpeed : {};
  const accelObj = typeof performance.Acceleration === 'object' ? performance.Acceleration : {};

  // UKVD nests: Combined → {Mpg, Lkm}, ExtraUrban → {Mpg}, UrbanCold → {Mpg}
  const combinedCons = typeof consumption.Combined === 'object' ? consumption.Combined : {};
  const extraUrbanCons = typeof consumption.ExtraUrban === 'object' ? consumption.ExtraUrban : {};
  const urbanCons = typeof consumption.UrbanCold === 'object' ? consumption.UrbanCold : {};

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
      countryOfOrigin: val(smmtDetails.CountryOfOrigin),
      numberOfDoors: numVal(smmtDetails.NumberOfDoors),
      numberOfSeats: numVal(smmtDetails.NumberOfSeats),
      numberOfGears: numVal(smmtDetails.NumberOfGears),
      vehicleClass: val(smmtDetails.VehicleClass),
      limitedEdition: val(smmtDetails.LimitedEdition),
      doorPlanLiteral: val(smmtDetails.DoorPlanLiteral),
    },
    mileage: {
      lastMotMileage: val(dvla.MotMileage),
      mileageIssues: undefined,
      averageMileage: undefined,
      mileageStatus: undefined,
      estimatedCurrentMileage: undefined,
      mileageHistory: dataItems.MileageHistory
        ? Array.isArray(dataItems.MileageHistory) ? dataItems.MileageHistory : []
        : undefined,
    },
    motHistory: {
      totalTests: undefined,
      passed: undefined,
      failed: undefined,
      passRate: undefined,
    },
    performance: {
      powerKw: val(powerObj.Kw) ?? val(performance.PowerKW),
      powerBhp: val(powerObj.Bhp) ?? val(performance.PowerBHP),
      maxSpeedMph: val(maxSpeedObj.Mph) ?? val(performance.TopSpeed),
      maxTorqueNm: val(torqueObj.Nm) ?? val(performance.TorqueNm),
      maxTorqueRpm: val(torqueObj.Rpm) ?? val(performance.TorqueRpm),
      zeroTo60Mph: val(accelObj.ZeroTo60Mph) ?? val(accelObj.Mph) ?? val(performance.Acceleration),
      peakPower: val(powerObj.Rpm) ?? val(performance.PeakPower),
      torqueNm: val(torqueObj.Nm) ?? val(performance.TorqueNm),
      torqueFtLb: val(torqueObj.FtLb) ?? val(performance.TorqueFtLb),
      peakTorque: val(torqueObj.Rpm) ?? val(performance.PeakTorque),
      maxSpeedKph: val(maxSpeedObj.Kph) ?? val(performance.MaxSpeedKph),
    },
    dimensions: {
      widthMm: val(dimensions.Width),
      heightMm: val(dimensions.Height),
      lengthMm: val(dimensions.Length),
      wheelBaseMm: val(dimensions.WheelBase),
      kerbWeightKg: val(dimensions.KerbWeight),
      maxAllowedWeightKg: val(dimensions.GrossVehicleWeight),
      grossWeightKg: val(dimensions.GrossWeight),
      unladenWeightKg: val(dimensions.UnladenWeight),
      fuelTankCapacityLitres: val(dimensions.FuelTankCapacity),
      carLengthMm: val(dimensions.CarLength),
      numberOfAxles: numVal(dimensions.NumberOfAxles),
    },
    fuelEconomy: {
      urbanMpg: val(urbanCons.Mpg) ?? val(consumption.UrbanCold),
      extraUrbanMpg: val(extraUrbanCons.Mpg) ?? val(consumption.ExtraUrban),
      combinedMpg: val(combinedCons.Mpg) ?? val(consumption.Combined),
    },
    roadTax: {
      cost12Months: val(dvla.VehicleExciseDutyRate),
      cost6Months: undefined,
      co2Emissions: val(smmtDetails.Co2),
      co2EmissionBand: val(dvla.VehicleExciseDutyBand),
    },
    additionalInfo: {
      fuelTankCapacityLitres: val(smmtDetails.FuelTankCapacity) ?? val(dimensions.FuelTankCapacity),
      engineNumber: val(dvla.EngineNumber),
      vinLast5Digits: val(dvla.VinLast5),
    },
    vehicleFlags: {
      exported: val(dvla.ExportMarker),
      safetyRecalls: val(recallData.OutstandingRecallCount),
      financeRecord: val(vehicleHistory.FinanceRecord),
      policeStolen: val(vehicleHistory.PoliceStolen),
      salvageHistory: val(vehicleHistory.SalvageHistory),
      writeOff: val(vehicleHistory.WriteOff),
      highRisk: val(vehicleHistory.HighRisk),
      v5cCount: val(vehicleHistory.V5CCount),
      totalKeepers: val(vehicleHistory.TotalKeepers),
      colourChange: val(vehicleHistory.ColourChange),
      plateChange: val(vehicleHistory.PlateChange),
      imported: val(vehicleHistory.Imported),
      scrapped: val(vehicleHistory.Scrapped),
      internetHistory: val(vehicleHistory.InternetHistory),
      serviceHistory: val(vehicleHistory.ServiceHistory),
      exTaxiNhsPolice: val(vehicleHistory.ExTaxiNhsPolice),
    },
    stolenCheck: {
      status: val(stolenData.Status),
      message: val(stolenData.Message),
    },
    writeOffReport: {
      make: val(writeOffData.Make),
      model: val(writeOffData.Model),
      insurerName: val(writeOffData.InsurerName),
      causeOfDamage: val(writeOffData.CauseOfDamage),
      status: val(writeOffData.Status),
      theftIndicator: val(writeOffData.TheftIndicator),
      theftIndicatorCode: val(writeOffData.TheftIndicatorCode),
      lossDate: val(writeOffData.LossDate),
      damageLocations: writeOffData.DamageLocations
        ? Array.isArray(writeOffData.DamageLocations) ? writeOffData.DamageLocations : []
        : undefined,
    },
    financeReport: {
      status: val(financeData.Status),
      message: val(financeData.Message),
    },
    salvageHistory: {
      found: salvageData.Found != null ? Boolean(salvageData.Found) : undefined,
      make: val(salvageData.Make),
      model: val(salvageData.Model),
      registration: val(salvageData.Registration),
      mileage: val(salvageData.Mileage),
      category: val(salvageData.Category),
      retailValue: val(salvageData.RetailValue),
      salvageLocation: val(salvageData.SalvageLocation),
      saleDate: val(salvageData.SaleDate),
      description: val(salvageData.Description),
    },
    exTaxiCheck: {
      status: val(vehicleHistory.ExTaxiNhsPolice) === 'No' ? 'All Clear' : val(vehicleHistory.ExTaxiNhsPolice),
      message: val(vehicleHistory.ExTaxiNhsPolice) === 'No' ? 'No taxi history data recorded against this registration.' : undefined,
    },
    valuation: {
      onTheRoad: val(valuationData.OnTheRoad),
      dealerForecourt: val(valuationData.DealerForecourt),
      tradeRetail: val(valuationData.TradeRetail),
      tradeAverage: val(valuationData.TradeAverage),
      tradePoor: val(valuationData.TradePoor),
      partExchange: val(valuationData.PartExchange),
      privateClean: val(valuationData.PrivateClean),
      privateAverage: val(valuationData.PrivateAverage),
      auction: val(valuationData.Auction),
    },
    logbookCounts: {
      total: numVal(v5cHistory.Total),
      certificateIssueDates: v5cHistory.CertificateIssueDates
        ? Array.isArray(v5cHistory.CertificateIssueDates) ? v5cHistory.CertificateIssueDates : []
        : undefined,
    },
    plateChanges: {
      totalChanges: numVal(plateChanges.TotalChanges),
      changes: plateChanges.Changes
        ? Array.isArray(plateChanges.Changes) ? plateChanges.Changes : []
        : undefined,
    },
    previousKeepers: {
      totalKeepers: numVal(keepersHistory.TotalKeepers),
      currentKeeperDuration: val(keepersHistory.CurrentKeeperDuration),
      keepers: keepersHistory.Keepers
        ? Array.isArray(keepersHistory.Keepers) ? keepersHistory.Keepers : []
        : undefined,
    },
    colourChanges: {
      status: val(colourChanges.Status),
      message: val(colourChanges.Message),
    },
    engineData: {
      engineNumber: val(engineData.EngineNumber),
      fuelSystem: val(engineData.FuelSystem),
      cylinders: numVal(engineData.Cylinders),
      valvesPerCyl: numVal(engineData.ValvesPerCyl),
      stroke: val(engineData.Stroke),
      bore: val(engineData.Bore),
      arrangement: val(engineData.Arrangement),
      camType: val(engineData.CamType),
      engineLocation: val(engineData.EngineLocation),
      aspiration: val(engineData.Aspiration),
      description: val(engineData.Description),
      make: val(engineData.Make),
      fuelDelivery: val(engineData.FuelDelivery),
      primaryFuelFlag: val(engineData.PrimaryFuelFlag),
    },
    smmtDetails: {
      smmtMarque: val(smmtDetails.SmmtMarque),
      smmtRange: val(smmtDetails.SmmtRange),
      modelVariant: val(smmtDetails.ModelVariant),
      series: val(smmtDetails.Series),
      gearbox: val(smmtDetails.Gearbox),
      numberOfGears: numVal(smmtDetails.NumberOfGears),
      countryOfOrigin: val(smmtDetails.CountryOfOrigin),
      fuel: val(smmtDetails.Fuel),
      engineSize: val(smmtDetails.EngineSize),
      body: val(smmtDetails.Body),
      numberOfDoors: numVal(smmtDetails.NumberOfDoors),
      modelStartDate: val(smmtDetails.ModelStartDate),
      systemSetupDate: val(smmtDetails.SystemSetupDate),
      driveType: val(smmtDetails.DriveType),
    },
    runningCosts: {
      tax6Months: val(consumption.Tax6Months),
      tax12Months: val(consumption.Tax12Months),
      fuelCost12kMiles: val(consumption.FuelCost12kMiles),
      fullTankCost: val(consumption.FullTankCost),
      motCost: val(consumption.MotCost),
    },
    emissions: {
      co2Gkm: val(smmtDetails.Co2),
      emissionBand: val(dvla.VehicleExciseDutyBand),
    },
  };
}

// ─── RapidAPI parser ─────────────────────────────────────────────────
function parseRapidApiResponse(raw: any) {
  const v = raw?.vehicle ?? {};
  const tax = v.tax ?? {};
  const mot = v.mot ?? {};
  const spec = v.specification ?? {};
  const mpg = v.running_costs?.mpg ?? {};
  const summary = mot.test_summary ?? {};
  const stolenCheck = v.stolen ?? {};
  const writeOffData = v.write_off ?? v.write_off_record ?? {};
  const financeCheck = v.finance ?? {};
  const salvageData = v.salvage ?? {};
  const exTaxi = v.ex_taxi ?? {};
  const valuationData = v.valuation ?? {};
  const v5cData = v.v5c_count ?? {};
  const plateChangeData = v.plate_changes ?? v.plate_change ?? {};
  const keepersData = v.keepers ?? v.previous_keepers ?? {};
  const colourChangeCheck = v.colour_change ?? {};
  const engineData = v.engine ?? v.engine_data ?? {};
  const smmtData = v.smmt ?? {};
  const runningCosts = v.running_costs ?? {};
  const emissionsData = v.emissions ?? v.co2 ?? {};

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
      countryOfOrigin: val(spec.country_of_origin),
      numberOfDoors: numVal(spec.number_of_doors),
      numberOfSeats: numVal(spec.number_of_seats),
      numberOfGears: numVal(spec.number_of_gears),
      vehicleClass: val(spec.vehicle_class),
      limitedEdition: val(spec.limited_edition),
      doorPlanLiteral: val(spec.door_plan_literal),
    },
    mileage: {
      lastMotMileage: val(mot.mileage_last_year),
      mileageIssues:
        v.mileage_status?.status === 'Pass' ? 'No' : val(v.mileage_status?.message),
      averageMileage: val(mot.mileage_average),
      mileageStatus: val(mot.mileage_status),
      estimatedCurrentMileage: val(mot.estimated_current_mileage),
      mileageHistory: mot.tests ? (Array.isArray(mot.tests) ? mot.tests : []) : mot.history ? (Array.isArray(mot.history) ? mot.history : []) : undefined,
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
      powerKw: val(spec.power_kw),
      powerBhp: val(spec.bhp) ?? val(v.bhp),
      maxSpeedMph: val(spec.top_speed),
      maxTorqueNm: val(spec.torque_nm),
      maxTorqueRpm: val(spec.torque_rpm),
      zeroTo60Mph: val(spec.acceleration),
      peakPower: val(spec.peak_power),
      torqueNm: val(spec.torque_nm),
      torqueFtLb: val(spec.torque_ft_lb),
      peakTorque: val(spec.peak_torque),
      maxSpeedKph: val(spec.max_speed_kph),
    },
    dimensions: {
      widthMm: val(spec.width),
      heightMm: val(spec.height),
      lengthMm: val(spec.length),
      wheelBaseMm: val(spec.wheel_base),
      kerbWeightKg: val(spec.kerb_weight),
      maxAllowedWeightKg: val(spec.gross_weight),
      grossWeightKg: val(spec.gross_weight),
      unladenWeightKg: val(spec.unladen_weight),
      fuelTankCapacityLitres: val(spec.fuel_tank_capacity),
      carLengthMm: val(spec.car_length),
      numberOfAxles: numVal(spec.number_of_axles),
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
      financeRecord: val(v.finance_record),
      policeStolen: val(v.police_stolen),
      salvageHistory: val(v.salvage_history),
      writeOff: val(v.write_off_status),
      highRisk: val(v.high_risk),
      v5cCount: val(v.v5c_count_number),
      totalKeepers: val(v.total_keepers),
      colourChange: val(v.colour_change_flag),
      plateChange: val(v.plate_change_flag),
      imported: val(v.imported),
      scrapped: val(v.scrapped),
      internetHistory: val(v.internet_history),
      serviceHistory: val(v.service_history),
      exTaxiNhsPolice: val(v.ex_taxi_nhs_police),
    },
    stolenCheck: {
      status: val(stolenCheck.status),
      message: val(stolenCheck.message),
    },
    writeOffReport: {
      make: val(writeOffData.make),
      model: val(writeOffData.model),
      insurerName: val(writeOffData.insurer_name),
      causeOfDamage: val(writeOffData.cause_of_damage),
      status: val(writeOffData.status),
      theftIndicator: val(writeOffData.theft_indicator),
      theftIndicatorCode: val(writeOffData.theft_indicator_code),
      lossDate: val(writeOffData.loss_date),
      damageLocations: writeOffData.damage_locations ? (Array.isArray(writeOffData.damage_locations) ? writeOffData.damage_locations : []) : undefined,
    },
    financeReport: {
      status: val(financeCheck.status),
      message: val(financeCheck.message),
    },
    salvageHistory: {
      found: salvageData.found != null ? Boolean(salvageData.found) : undefined,
      make: val(salvageData.make),
      model: val(salvageData.model),
      registration: val(salvageData.registration),
      mileage: val(salvageData.mileage),
      category: val(salvageData.category),
      retailValue: val(salvageData.retail_value),
      salvageLocation: val(salvageData.salvage_location),
      saleDate: val(salvageData.sale_date),
      description: val(salvageData.description),
    },
    exTaxiCheck: {
      status: val(exTaxi.status),
      message: val(exTaxi.message),
    },
    valuation: {
      onTheRoad: val(valuationData.on_the_road),
      dealerForecourt: val(valuationData.dealer_forecourt),
      tradeRetail: val(valuationData.trade_retail),
      tradeAverage: val(valuationData.trade_average),
      tradePoor: val(valuationData.trade_poor),
      partExchange: val(valuationData.part_exchange),
      privateClean: val(valuationData.private_clean),
      privateAverage: val(valuationData.private_average),
      auction: val(valuationData.auction),
    },
    logbookCounts: {
      total: numVal(v5cData.total),
      certificateIssueDates: v5cData.certificate_issue_dates ? (Array.isArray(v5cData.certificate_issue_dates) ? v5cData.certificate_issue_dates : []) : undefined,
    },
    plateChanges: {
      totalChanges: numVal(plateChangeData.total_changes),
      changes: plateChangeData.changes ? (Array.isArray(plateChangeData.changes) ? plateChangeData.changes : []) : undefined,
    },
    previousKeepers: {
      totalKeepers: numVal(keepersData.total_keepers),
      currentKeeperDuration: val(keepersData.current_keeper_duration),
      keepers: keepersData.keepers ? (Array.isArray(keepersData.keepers) ? keepersData.keepers : []) : undefined,
    },
    colourChanges: {
      status: val(colourChangeCheck.status),
      message: val(colourChangeCheck.message),
    },
    engineData: {
      engineNumber: val(engineData.engine_number),
      fuelSystem: val(engineData.fuel_system),
      cylinders: numVal(engineData.cylinders),
      valvesPerCyl: numVal(engineData.valves_per_cyl),
      stroke: val(engineData.stroke),
      bore: val(engineData.bore),
      arrangement: val(engineData.arrangement),
      camType: val(engineData.cam_type),
      engineLocation: val(engineData.engine_location),
      aspiration: val(engineData.aspiration),
      description: val(engineData.description),
      make: val(engineData.make),
      fuelDelivery: val(engineData.fuel_delivery),
      primaryFuelFlag: val(engineData.primary_fuel_flag),
    },
    smmtDetails: {
      smmtMarque: val(smmtData.smmt_marque),
      smmtRange: val(smmtData.smmt_range),
      modelVariant: val(smmtData.model_variant),
      series: val(smmtData.series),
      gearbox: val(smmtData.gearbox),
      numberOfGears: numVal(smmtData.number_of_gears),
      countryOfOrigin: val(smmtData.country_of_origin),
      fuel: val(smmtData.fuel),
      engineSize: val(smmtData.engine_size),
      body: val(smmtData.body),
      numberOfDoors: numVal(smmtData.number_of_doors),
      modelStartDate: val(smmtData.model_start_date),
      systemSetupDate: val(smmtData.system_setup_date),
      driveType: val(smmtData.drive_type),
    },
    runningCosts: {
      tax6Months: val(runningCosts.tax_6_months),
      tax12Months: val(runningCosts.tax_12_months),
      fuelCost12kMiles: val(runningCosts.fuel_cost_12k_miles),
      fullTankCost: val(runningCosts.full_tank_cost),
      motCost: val(runningCosts.mot_cost),
    },
    emissions: {
      co2Gkm: val(emissionsData.co2_g_km ?? emissionsData.co2),
      emissionBand: val(emissionsData.emission_band ?? tax.ved_band),
    },
  };
}
