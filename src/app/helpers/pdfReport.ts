import PDFDocument from 'pdfkit';

/**
 * Generates a full vehicle history PDF report (like checkcardetails.co.uk)
 * Returns a Buffer containing the PDF data
 */
export async function generateVehicleReportPdf(report: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const vrm = report.registrationNumber ?? 'N/A';
      const vd = report.vehicleDetails ?? {};
      const status = report.status ?? {};
      const mileage = report.mileage ?? {};
      const motHistory = report.motHistory ?? {};
      const perf = report.performance ?? {};
      const dims = report.dimensions ?? {};
      const fuel = report.fuelEconomy ?? {};
      const tax = report.roadTax ?? {};
      const info = report.additionalInfo ?? {};
      const flags = report.vehicleFlags ?? {};
      const stolen = report.stolenCheck ?? {};
      const writeOff = report.writeOffReport ?? {};
      const finance = report.financeReport ?? {};
      const salvage = report.salvageHistory ?? {};
      const exTaxi = report.exTaxiCheck ?? {};
      const val = report.valuation ?? {};
      const keepers = report.previousKeepers ?? {};
      const engineD = report.engineData ?? {};
      const smmt = report.smmtDetails ?? {};
      const running = report.runningCosts ?? {};
      const emissions = report.emissions ?? {};
      const logbook = report.logbookCounts ?? {};
      const plates = report.plateChanges ?? {};
      const colour = report.colourChanges ?? {};

      const PAGE_WIDTH = 495; // A4 width minus margins

      // ─── Header ───────────────────────────────────────────────
      doc.rect(50, 30, PAGE_WIDTH, 70).fill('#1a237e');
      doc.fontSize(28).fillColor('#ffffff').text(vrm, 50, 45, {
        width: PAGE_WIDTH,
        align: 'center',
      });
      doc.fontSize(14).text(
        `${vd.make ?? ''} ${vd.model ?? ''}`.trim() || 'Vehicle Report',
        50, 72, { width: PAGE_WIDTH, align: 'center' },
      );
      doc.fillColor('#000000');
      doc.moveDown(2);

      // ─── Helper: section header ────────────────────────────────
      const sectionHeader = (title: string) => {
        const y = doc.y;
        if (y > 700) doc.addPage();
        doc.moveDown(0.5);
        doc.rect(50, doc.y, PAGE_WIDTH, 24).fill('#e3f2fd');
        doc.fontSize(13).fillColor('#1a237e').text(title, 60, doc.y + 5);
        doc.fillColor('#000000');
        doc.moveDown(1.5);
      };

      // ─── Helper: key-value row ─────────────────────────────────
      const row = (key: string, value: any) => {
        if (value === undefined || value === null || value === '') return;
        if (doc.y > 740) doc.addPage();
        const y = doc.y;
        doc.fontSize(9).fillColor('#555555').text(key, 60, y, { width: 200 });
        doc.fontSize(9).fillColor('#000000').text(String(value), 270, y, { width: 275 });
        doc.moveDown(0.4);
      };

      // ─── 1. TAX & MOT Status ──────────────────────────────────
      sectionHeader('TAX & MOT Status');
      row('Tax Status', status.taxStatus);
      row('Tax Due Date', status.taxDueDate);
      row('Tax Days Left', status.taxDaysLeft != null ? `${status.taxDaysLeft} days` : undefined);
      row('MOT Status', status.motStatus);
      row('MOT Expiry', status.motExpiryDate);
      row('MOT Days Left', status.motDaysLeft != null ? `${status.motDaysLeft} days` : undefined);

      // ─── 2. Vehicle Details ────────────────────────────────────
      sectionHeader('Vehicle Details');
      row('Make', vd.make);
      row('Model', vd.model);
      row('Model Variant', vd.modelVariant);
      row('Description', vd.description);
      row('Primary Colour', vd.colour);
      row('Fuel Type', vd.fuelType);
      row('Transmission', vd.transmission);
      row('Drive Type', vd.driveType);
      row('Engine Capacity', vd.engineCapacity ? `${vd.engineCapacity} cc` : undefined);
      row('Body Style', vd.bodyStyle);
      row('Year Manufacture', vd.yearOfManufacture);
      row('Vehicle Age', vd.vehicleAge);
      row('Registration Date', vd.dateFirstRegistered);
      row('Registration Place', vd.registrationPlace);
      row('Euro Status', vd.euroStatus);
      row('ULEZ Compliant', vd.ulezCompliant);
      row('Type Approval', vd.typeApproval);
      row('Wheel Plan', vd.wheelPlan);
      row('Last V5C Issue Date', vd.lastV5cIssueDate);
      row('Doors', vd.numberOfDoors);
      row('Seats', vd.numberOfSeats);
      row('Gears', vd.numberOfGears);
      row('Country of Origin', vd.countryOfOrigin);

      // ─── 3. Mileage Information ────────────────────────────────
      sectionHeader('Mileage Information');
      row('Last MOT Mileage', mileage.lastMotMileage);
      row('Mileage Issues', mileage.mileageIssues);
      row('Average Mileage', mileage.averageMileage);
      row('Status', mileage.mileageStatus);
      row('Estimated Current', mileage.estimatedCurrentMileage);

      // ─── 4. MOT History Summary ────────────────────────────────
      sectionHeader('MOT History Summary');
      row('Total Tests', motHistory.totalTests);
      row('Passed', motHistory.passed);
      row('Failed', motHistory.failed);
      row('Pass Rate', motHistory.passRate);

      // ─── 5. Performance ────────────────────────────────────────
      sectionHeader('Performance');
      const powerStr = [perf.powerKw ? `${perf.powerKw} KW` : null, perf.powerBhp ? `${perf.powerBhp} BHP` : null].filter(Boolean).join(' / ');
      row('Power', powerStr || undefined);
      row('Max Speed', perf.maxSpeedMph ? `${perf.maxSpeedMph} MPH` : undefined);
      const torqueStr = [perf.maxTorqueNm ? `${perf.maxTorqueNm} Nm` : perf.torqueNm ? `${perf.torqueNm} Nm` : null, perf.maxTorqueRpm ? `at ${perf.maxTorqueRpm} rpm` : null].filter(Boolean).join(' ');
      row('Max Torque', torqueStr || undefined);
      row('0 to 60 MPH', perf.zeroTo60Mph ? `${perf.zeroTo60Mph} Seconds` : undefined);

      // ─── 6. Fuel Economy ───────────────────────────────────────
      sectionHeader('Fuel Economy');
      row('Urban', fuel.urbanMpg ? `${fuel.urbanMpg} MPG` : undefined);
      row('Extra Urban', fuel.extraUrbanMpg ? `${fuel.extraUrbanMpg} MPG` : undefined);
      row('Combined', fuel.combinedMpg ? `${fuel.combinedMpg} MPG` : undefined);

      // ─── 7. Dimensions & Weight ────────────────────────────────
      sectionHeader('Dimensions & Weight');
      row('Width', dims.widthMm ? `${dims.widthMm} mm` : undefined);
      row('Height', dims.heightMm ? `${dims.heightMm} mm` : undefined);
      row('Length', dims.lengthMm ? `${dims.lengthMm} mm` : undefined);
      row('Wheel Base', dims.wheelBaseMm ? `${dims.wheelBaseMm} mm` : undefined);
      row('Kerb Weight', dims.kerbWeightKg ? `${dims.kerbWeightKg} kg` : undefined);
      row('Max Allowed Weight', dims.maxAllowedWeightKg ? `${dims.maxAllowedWeightKg} kg` : undefined);
      row('Fuel Tank', dims.fuelTankCapacityLitres ? `${dims.fuelTankCapacityLitres} litres` : undefined);

      // ─── 8. Road Tax ───────────────────────────────────────────
      sectionHeader('Road Tax');
      row('12 Months Cost', tax.cost12Months ? `£${tax.cost12Months}` : undefined);
      row('6 Months Cost', tax.cost6Months ? `£${tax.cost6Months}` : undefined);
      row('CO2 Emissions', tax.co2Emissions ? `${tax.co2Emissions} g/km` : undefined);
      row('Emission Band', tax.co2EmissionBand);

      // ─── 9. CO2 Emissions ──────────────────────────────────────
      sectionHeader('CO2 Emission Figures');
      row('CO2 (g/km)', emissions.co2Gkm ? `${emissions.co2Gkm} g/km` : undefined);
      row('Emission Band', emissions.emissionBand);

      // ─── 10. Important Vehicle Information (Flags) ─────────────
      sectionHeader('Important Vehicle Information');
      row('Exported', flags.exported);
      row('Safety Recalls', flags.safetyRecalls);
      row('Finance Record', flags.financeRecord);
      row('Police Stolen', flags.policeStolen);
      row('Salvage History', flags.salvageHistory);
      row('Write Off', flags.writeOff);
      row('High Risk', flags.highRisk);
      row('Imported', flags.imported);
      row('Scrapped', flags.scrapped);
      row('Colour Change', flags.colourChange);
      row('Plate Change', flags.plateChange);
      row('V5C Count', flags.v5cCount);
      row('Total Keepers', flags.totalKeepers);
      row('Internet History', flags.internetHistory);
      row('Service History', flags.serviceHistory);
      row('Ex Taxi/NHS/Police', flags.exTaxiNhsPolice);

      // ─── 11. Stolen Check ──────────────────────────────────────
      sectionHeader('Stolen Vehicle Check');
      row('Status', stolen.status);
      row('Message', stolen.message);

      // ─── 12. Write-Off Report ──────────────────────────────────
      sectionHeader('Write-Off / Damage Report');
      row('Status', writeOff.status);
      row('Insurer', writeOff.insurerName);
      row('Cause of Damage', writeOff.causeOfDamage);
      row('Theft Indicator', writeOff.theftIndicator);
      row('Loss Date', writeOff.lossDate);

      // ─── 13. Finance Report ────────────────────────────────────
      sectionHeader('Finance Check');
      row('Status', finance.status);
      row('Message', finance.message);

      // ─── 14. Salvage History ───────────────────────────────────
      sectionHeader('Salvage History');
      row('Found', salvage.found != null ? (salvage.found ? 'Yes' : 'No') : undefined);
      row('Category', salvage.category);
      row('Mileage', salvage.mileage);
      row('Retail Value', salvage.retailValue);
      row('Location', salvage.salvageLocation);
      row('Sale Date', salvage.saleDate);

      // ─── 15. Ex-Taxi Check ─────────────────────────────────────
      sectionHeader('Ex-Taxi / NHS / Police Check');
      row('Status', exTaxi.status);
      row('Message', exTaxi.message);

      // ─── 16. Valuation ─────────────────────────────────────────
      sectionHeader('Vehicle Valuation');
      row('On The Road', val.onTheRoad ? `£${val.onTheRoad}` : undefined);
      row('Dealer Forecourt', val.dealerForecourt ? `£${val.dealerForecourt}` : undefined);
      row('Trade Retail', val.tradeRetail ? `£${val.tradeRetail}` : undefined);
      row('Trade Average', val.tradeAverage ? `£${val.tradeAverage}` : undefined);
      row('Trade Poor', val.tradePoor ? `£${val.tradePoor}` : undefined);
      row('Part Exchange', val.partExchange ? `£${val.partExchange}` : undefined);
      row('Private Clean', val.privateClean ? `£${val.privateClean}` : undefined);
      row('Private Average', val.privateAverage ? `£${val.privateAverage}` : undefined);
      row('Auction', val.auction ? `£${val.auction}` : undefined);

      // ─── 17. Keepers / V5C ─────────────────────────────────────
      sectionHeader('Previous Keepers & V5C');
      row('Total Keepers', keepers.totalKeepers);
      row('Current Keeper Duration', keepers.currentKeeperDuration);
      row('V5C Logbook Count', logbook.total);

      // ─── 18. Plate Changes ─────────────────────────────────────
      sectionHeader('Plate Changes');
      row('Total Changes', plates.totalChanges);

      // ─── 19. Colour Changes ────────────────────────────────────
      sectionHeader('Colour Changes');
      row('Status', colour.status);
      row('Message', colour.message);

      // ─── 20. Engine Data ───────────────────────────────────────
      sectionHeader('Engine Data');
      row('Engine Number', engineD.engineNumber);
      row('Fuel System', engineD.fuelSystem);
      row('Cylinders', engineD.cylinders);
      row('Valves per Cylinder', engineD.valvesPerCyl);
      row('Arrangement', engineD.arrangement);
      row('Aspiration', engineD.aspiration);
      row('Cam Type', engineD.camType);
      row('Engine Location', engineD.engineLocation);
      row('Fuel Delivery', engineD.fuelDelivery);

      // ─── 21. SMMT Details ──────────────────────────────────────
      sectionHeader('SMMT Details');
      row('Marque', smmt.smmtMarque);
      row('Range', smmt.smmtRange);
      row('Model Variant', smmt.modelVariant);
      row('Series', smmt.series);
      row('Gearbox', smmt.gearbox);
      row('Country of Origin', smmt.countryOfOrigin);
      row('Body', smmt.body);
      row('Drive Type', smmt.driveType);

      // ─── 22. Running Costs ─────────────────────────────────────
      sectionHeader('Running Costs');
      row('Tax 12 Months', running.tax12Months ? `£${running.tax12Months}` : undefined);
      row('Tax 6 Months', running.tax6Months ? `£${running.tax6Months}` : undefined);
      row('Fuel Cost 12k Miles', running.fuelCost12kMiles ? `£${running.fuelCost12kMiles}` : undefined);
      row('Full Tank Cost', running.fullTankCost ? `£${running.fullTankCost}` : undefined);
      row('MOT Cost', running.motCost ? `£${running.motCost}` : undefined);

      // ─── Additional Info ───────────────────────────────────────
      sectionHeader('Additional Information');
      row('Fuel Tank Capacity', info.fuelTankCapacityLitres ? `${info.fuelTankCapacityLitres} litres` : undefined);
      row('Engine Number', info.engineNumber);
      row('VIN Last 5 Digits', info.vinLast5Digits);

      // ─── Footer ────────────────────────────────────────────────
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#999999').text(
        `Report generated on ${new Date().toISOString().split('T')[0]} | Full Vehicle History Report`,
        50, doc.y, { width: PAGE_WIDTH, align: 'center' },
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
