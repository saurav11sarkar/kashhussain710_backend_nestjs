/**
 * CheckCarDetails API Integration
 * Docs: https://api.checkcardetails.co.uk
 * Endpoint: /vehicledata/{DataPoint}?apikey={KEY}&vrm={VRM}
 *
 * Data Points:
 *   vehicleregistration  — DVLA registration details
 *   ukvehicledata        — Full vehicle data (all details)
 *   Vehiclespecs         — Full specification data (performance, dimensions, fuel economy)
 *   carhistorycheck      — Full history check (stolen, finance, write-off, salvage, etc.)
 *   mot                  — MOT status + full history
 *   mileage              — Full mileage history
 *   vehiclevaluation     — Valuation data
 *   vehicleImage         — Vehicle image
 */

import config from '../config';

const CCD_BASE = 'https://api.checkcardetails.co.uk';

function getCcdKey(): string {
  // Use live key if available, otherwise test key
  return config.checkCarDetails?.liveApiKey || config.checkCarDetails?.testApiKey || '';
}

// ─── Generic fetch for any data point ────────────────────────────────
async function callCcd(vrm: string, dataPoint: string): Promise<any> {
  const apiKey = getCcdKey();
  if (!apiKey) {
    console.log('[CCD] No API key configured');
    return null;
  }

  const cleanVrm = vrm.replace(/\s/g, '').toUpperCase();
  const url = `${CCD_BASE}/vehicledata/${dataPoint}?apikey=${apiKey}&vrm=${cleanVrm}`;
  console.log(`[CCD] Calling: ${dataPoint} for ${cleanVrm}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.log(`[CCD] ${dataPoint} returned ${response.status}: ${errBody.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.log(`[CCD] ${dataPoint} fetch error:`, err);
    return null;
  }
}

// ─── Fetch all data points in parallel ───────────────────────────────
export async function fetchAllCcdData(vrm: string) {
  const [registration, vehicleData, specs, history, mot, mileageData, valuation] =
    await Promise.all([
      callCcd(vrm, 'vehicleregistration'),
      callCcd(vrm, 'ukvehicledata'),
      callCcd(vrm, 'Vehiclespecs'),
      callCcd(vrm, 'carhistorycheck'),
      callCcd(vrm, 'mot'),
      callCcd(vrm, 'mileage'),
      callCcd(vrm, 'vehiclevaluation'),
    ]);

  return { registration, vehicleData, specs, history, mot, mileage: mileageData, valuation };
}

// ─── Helpers ─────────────────────────────────────────────────────────
function val(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'object') return undefined;
  const s = String(v).trim();
  if (['No Data', 'Not Available', 'N/A', '', 'undefined', 'null', '0', 'false'].includes(s)) {
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

// ─── Parse all CCD data into our unified schema ─────────────────────
export function parseCcdResponse(ccdData: any): any {
  const reg = ccdData.registration ?? {};
  const vd = ccdData.vehicleData ?? {};
  const specs = ccdData.specs ?? {};
  const history = ccdData.history ?? {};
  const mot = ccdData.mot ?? {};
  const mil = ccdData.mileage ?? {};
  const valData = ccdData.valuation ?? {};

  // Try to extract from nested structures — CCD may wrap data differently
  // Common patterns: data directly at root, or under .data, .vehicle, .Response, etc.
  const r = reg.data ?? reg.vehicle ?? reg.Response ?? reg;
  const v = vd.data ?? vd.vehicle ?? vd.Response ?? vd;
  const sp = specs.data ?? specs.vehicle ?? specs.specification ?? specs.Response ?? specs;
  const h = history.data ?? history.vehicle ?? history.Response ?? history;
  const m = mot.data ?? mot.vehicle ?? mot.Response ?? mot;
  const mi = mil.data ?? mil.vehicle ?? mil.Response ?? mil;
  const va = valData.data ?? valData.vehicle ?? valData.Response ?? valData;

  // ─── Extract specs — try multiple common field name patterns ────
  const performance = sp.performance ?? sp.Performance ?? sp;
  const dimensions = sp.dimensions ?? sp.Dimensions ?? sp;
  const fuelEcon = sp.fuel_economy ?? sp.fuelEconomy ?? sp.FuelEconomy ?? sp.consumption ?? sp;
  const engine = sp.engine ?? sp.Engine ?? sp;
  const smmtData = v.smmt ?? v.SmmtDetails ?? sp.smmt ?? {};

  // Tax/MOT status
  const taxDueDate = val(r.taxDueDate) ?? val(v.taxDueDate) ?? val(v.tax_due_date);
  const motExpiry = val(r.motExpiryDate) ?? val(v.motExpiryDate) ?? val(m.motExpiryDate) ?? val(v.mot_expiry_date);

  // MOT summary
  const motTests = m.motTests ?? m.mot_tests ?? m.tests ?? m.motHistory ?? [];
  const motArray = Array.isArray(motTests) ? motTests : [];
  const totalTests = motArray.length;
  const passedTests = motArray.filter((t: any) =>
    t.testResult === 'PASSED' || t.test_result === 'PASSED' || t.result === 'PASSED' || t.result === 'Pass'
  ).length;
  const failedTests = totalTests - passedTests;

  return {
    status: {
      taxStatus: val(r.taxStatus) ?? val(v.taxStatus) ?? val(v.tax_status),
      taxDueDate,
      taxDaysLeft: daysLeft(taxDueDate),
      motStatus: val(r.motStatus) ?? val(v.motStatus) ?? val(m.motStatus) ?? val(v.mot_status),
      motExpiryDate: motExpiry,
      motDaysLeft: daysLeft(motExpiry),
    },
    vehicleDetails: {
      make: val(r.make) ?? val(v.make),
      model: val(r.model) ?? val(v.model),
      modelVariant: val(v.modelVariant) ?? val(v.model_variant) ?? val(sp.model_variant),
      description: val(v.description) ?? val(v.derivative) ?? val(sp.derivative),
      colour: val(r.colour) ?? val(v.colour) ?? val(v.color),
      fuelType: val(r.fuelType) ?? val(v.fuelType) ?? val(v.fuel_type),
      transmission: val(v.transmission) ?? val(sp.transmission),
      driveType: val(v.driveType) ?? val(v.drive_type) ?? val(sp.drive_type),
      engineCapacity: val(r.engineCapacity) ?? val(v.engineCapacity) ?? val(v.engine_size),
      yearOfManufacture: numVal(r.yearOfManufacture) ?? numVal(v.yearOfManufacture) ?? numVal(v.year),
      vehicleAge: val(v.vehicleAge) ?? val(v.vehicle_age) ?? val(v.age),
      dateFirstRegistered: val(r.monthOfFirstRegistration) ?? val(v.dateFirstRegistered) ?? val(v.registered),
      registrationPlace: val(v.registrationPlace) ?? val(v.registered_location),
      lastV5cIssueDate: val(r.dateOfLastV5CIssued) ?? val(v.dateOfLastV5CIssued) ?? val(v.v5c_issue_date),
      euroStatus: val(r.euroStatus) ?? val(v.euroStatus) ?? val(sp.euro_status),
      ulezCompliant: val(v.ulezCompliant) ?? val(v.ulez_compliant),
      typeApproval: val(r.typeApproval) ?? val(v.typeApproval) ?? val(v.type_approval),
      wheelPlan: val(r.wheelplan) ?? val(v.wheelplan) ?? val(v.wheel_plan),
      bodyStyle: val(v.bodyStyle) ?? val(v.body_type) ?? val(sp.body_type),
      countryOfOrigin: val(v.countryOfOrigin) ?? val(sp.country_of_origin),
      numberOfDoors: numVal(v.numberOfDoors) ?? numVal(sp.number_of_doors) ?? numVal(sp.doors),
      numberOfSeats: numVal(v.numberOfSeats) ?? numVal(sp.number_of_seats) ?? numVal(sp.seats),
      numberOfGears: numVal(v.numberOfGears) ?? numVal(sp.number_of_gears) ?? numVal(sp.gears),
      vehicleClass: val(v.vehicleClass) ?? val(sp.vehicle_class),
      limitedEdition: val(sp.limited_edition),
      doorPlanLiteral: val(sp.door_plan_literal),
    },
    mileage: {
      lastMotMileage: val(mi.lastMotMileage) ?? val(mi.last_mot_mileage) ?? val(m.lastMileage),
      mileageIssues: val(mi.mileageIssues) ?? val(mi.mileage_issues),
      averageMileage: val(mi.averageMileage) ?? val(mi.average_mileage),
      mileageStatus: val(mi.mileageStatus) ?? val(mi.mileage_status) ?? val(mi.status),
      estimatedCurrentMileage: val(mi.estimatedCurrentMileage) ?? val(mi.estimated_current_mileage),
      mileageHistory: mi.mileageHistory ?? mi.mileage_history ?? mi.history ?? undefined,
    },
    motHistory: {
      totalTests: totalTests || undefined,
      passed: passedTests || undefined,
      failed: failedTests || undefined,
      passRate: totalTests > 0 ? `${Math.round((passedTests / totalTests) * 100)}%` : undefined,
    },
    performance: {
      powerKw: val(performance.powerKw) ?? val(performance.power_kw) ?? val(performance.kw) ?? val(sp.power_kw),
      powerBhp: val(performance.powerBhp) ?? val(performance.power_bhp) ?? val(performance.bhp) ?? val(sp.bhp) ?? val(sp.power_bhp),
      maxSpeedMph: val(performance.maxSpeedMph) ?? val(performance.max_speed_mph) ?? val(performance.top_speed) ?? val(sp.top_speed),
      maxTorqueNm: val(performance.torqueNm) ?? val(performance.torque_nm) ?? val(performance.max_torque_nm) ?? val(sp.torque_nm),
      maxTorqueRpm: val(performance.torqueRpm) ?? val(performance.torque_rpm) ?? val(sp.torque_rpm),
      zeroTo60Mph: val(performance.zeroTo60) ?? val(performance.zero_to_60) ?? val(performance.acceleration) ?? val(sp.acceleration) ?? val(sp.zero_to_60),
      peakPower: val(performance.peakPower) ?? val(performance.peak_power),
      torqueNm: val(performance.torqueNm) ?? val(performance.torque_nm) ?? val(sp.torque_nm),
      torqueFtLb: val(performance.torqueFtLb) ?? val(performance.torque_ft_lb) ?? val(sp.torque_ft_lb),
      peakTorque: val(performance.peakTorque) ?? val(performance.peak_torque),
      maxSpeedKph: val(performance.maxSpeedKph) ?? val(performance.max_speed_kph) ?? val(sp.max_speed_kph),
    },
    dimensions: {
      widthMm: val(dimensions.widthMm) ?? val(dimensions.width) ?? val(sp.width),
      heightMm: val(dimensions.heightMm) ?? val(dimensions.height) ?? val(sp.height),
      lengthMm: val(dimensions.lengthMm) ?? val(dimensions.length) ?? val(sp.length),
      wheelBaseMm: val(dimensions.wheelBaseMm) ?? val(dimensions.wheel_base) ?? val(sp.wheel_base),
      kerbWeightKg: val(dimensions.kerbWeightKg) ?? val(dimensions.kerb_weight) ?? val(sp.kerb_weight),
      maxAllowedWeightKg: val(dimensions.maxAllowedWeightKg) ?? val(dimensions.gross_weight) ?? val(sp.gross_weight),
      grossWeightKg: val(dimensions.grossWeight) ?? val(sp.gross_weight),
      unladenWeightKg: val(dimensions.unladenWeight) ?? val(sp.unladen_weight),
      fuelTankCapacityLitres: val(dimensions.fuelTankCapacity) ?? val(sp.fuel_tank_capacity),
      carLengthMm: val(dimensions.carLength) ?? val(sp.car_length),
      numberOfAxles: numVal(dimensions.numberOfAxles) ?? numVal(sp.number_of_axles),
    },
    fuelEconomy: {
      urbanMpg: val(fuelEcon.urbanMpg) ?? val(fuelEcon.urban_mpg) ?? val(fuelEcon.urban) ?? val(sp.urban_mpg),
      extraUrbanMpg: val(fuelEcon.extraUrbanMpg) ?? val(fuelEcon.extra_urban_mpg) ?? val(fuelEcon.extra_urban) ?? val(sp.extra_urban_mpg),
      combinedMpg: val(fuelEcon.combinedMpg) ?? val(fuelEcon.combined_mpg) ?? val(fuelEcon.combined) ?? val(sp.combined_mpg),
    },
    roadTax: {
      cost12Months: val(v.taxCost12Months) ?? val(v.tax_cost_12_months) ?? val(r.taxCost12Months),
      cost6Months: val(v.taxCost6Months) ?? val(v.tax_cost_6_months),
      co2Emissions: val(r.co2Emissions) ?? val(v.co2Emissions) ?? val(v.co2_emissions) ?? val(sp.co2),
      co2EmissionBand: val(v.co2EmissionBand) ?? val(v.ved_band),
    },
    additionalInfo: {
      fuelTankCapacityLitres: val(sp.fuel_tank_capacity) ?? val(v.fuel_tank_capacity),
      engineNumber: val(v.engineNumber) ?? val(v.engine_number),
      vinLast5Digits: val(v.vinLast5) ?? val(v.vin_last_5),
    },
    vehicleFlags: {
      exported: val(v.exported) ?? val(h.exported) ?? (r.markedForExport === true ? 'Yes' : r.markedForExport === false ? 'No' : undefined),
      safetyRecalls: val(h.safetyRecalls) ?? val(h.safety_recalls) ?? val(h.recalls),
      financeRecord: val(h.financeRecord) ?? val(h.finance_record) ?? val(h.finance),
      policeStolen: val(h.policeStolen) ?? val(h.police_stolen) ?? val(h.stolen),
      salvageHistory: val(h.salvageHistory) ?? val(h.salvage_history) ?? val(h.salvage),
      writeOff: val(h.writeOff) ?? val(h.write_off),
      highRisk: val(h.highRisk) ?? val(h.high_risk),
      v5cCount: val(h.v5cCount) ?? val(h.v5c_count) ?? val(v.v5cCount),
      totalKeepers: val(h.totalKeepers) ?? val(h.total_keepers) ?? val(v.totalKeepers),
      colourChange: val(h.colourChange) ?? val(h.colour_change),
      plateChange: val(h.plateChange) ?? val(h.plate_change),
      imported: val(h.imported),
      scrapped: val(h.scrapped),
      internetHistory: val(h.internetHistory) ?? val(h.internet_history),
      serviceHistory: val(h.serviceHistory) ?? val(h.service_history),
      exTaxiNhsPolice: val(h.exTaxiNhsPolice) ?? val(h.ex_taxi),
    },
    stolenCheck: {
      status: val(h.stolenStatus) ?? val(h.stolen_status),
      message: val(h.stolenMessage) ?? val(h.stolen_message),
    },
    writeOffReport: {
      status: val(h.writeOffStatus) ?? val(h.write_off_status),
      insurerName: val(h.writeOffInsurer) ?? val(h.write_off_insurer),
      causeOfDamage: val(h.writeOffCause) ?? val(h.write_off_cause),
    },
    financeReport: {
      status: val(h.financeStatus) ?? val(h.finance_status),
      message: val(h.financeMessage) ?? val(h.finance_message),
    },
    salvageHistory: {
      found: h.salvageFound != null ? Boolean(h.salvageFound) : undefined,
      category: val(h.salvageCategory) ?? val(h.salvage_category),
    },
    exTaxiCheck: {
      status: val(h.exTaxiStatus) ?? val(h.ex_taxi_status),
      message: val(h.exTaxiMessage) ?? val(h.ex_taxi_message),
    },
    valuation: {
      onTheRoad: val(va.onTheRoad) ?? val(va.on_the_road) ?? val(va.otr),
      dealerForecourt: val(va.dealerForecourt) ?? val(va.dealer_forecourt),
      tradeRetail: val(va.tradeRetail) ?? val(va.trade_retail),
      tradeAverage: val(va.tradeAverage) ?? val(va.trade_average),
      tradePoor: val(va.tradePoor) ?? val(va.trade_poor),
      partExchange: val(va.partExchange) ?? val(va.part_exchange),
      privateClean: val(va.privateClean) ?? val(va.private_clean),
      privateAverage: val(va.privateAverage) ?? val(va.private_average),
      auction: val(va.auction),
    },
    previousKeepers: {
      totalKeepers: numVal(h.totalKeepers) ?? numVal(v.totalKeepers),
    },
    engineData: {
      cylinders: numVal(engine.cylinders) ?? numVal(sp.cylinders),
      fuelSystem: val(engine.fuelSystem) ?? val(engine.fuel_system) ?? val(sp.fuel_system),
      aspiration: val(engine.aspiration) ?? val(sp.aspiration),
      arrangement: val(engine.arrangement) ?? val(sp.arrangement),
      camType: val(engine.camType) ?? val(engine.cam_type) ?? val(sp.cam_type),
      valvesPerCyl: numVal(engine.valvesPerCyl) ?? numVal(sp.valves_per_cyl),
      engineLocation: val(engine.engineLocation) ?? val(sp.engine_location),
    },
    smmtDetails: {
      smmtMarque: val(smmtData.smmtMarque) ?? val(smmtData.smmt_marque),
      smmtRange: val(smmtData.smmtRange) ?? val(smmtData.smmt_range),
      modelVariant: val(smmtData.modelVariant) ?? val(smmtData.model_variant),
      countryOfOrigin: val(smmtData.countryOfOrigin) ?? val(smmtData.country_of_origin),
      driveType: val(smmtData.driveType) ?? val(smmtData.drive_type),
    },
    emissions: {
      co2Gkm: val(r.co2Emissions) ?? val(v.co2Emissions) ?? val(sp.co2) ?? val(sp.co2_emissions),
      emissionBand: val(v.co2EmissionBand) ?? val(v.ved_band) ?? val(sp.emission_band),
    },
  };
}
