import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CarTaxService } from './car-tax.service';
import { CarTaxDto } from './dto/create-car-tax.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request, Response } from 'express';
import pick from 'src/app/helpers/pick';
import { generateVehicleReportPdf } from 'src/app/helpers/pdfReport';

@ApiTags('car-tax')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('user'))
@Controller('car-tax')
export class CarTaxController {
  constructor(private readonly carTaxService: CarTaxService) {}

  /**
   * POST /car-tax/check
   * Body: { "vrm": "K5HHV" }
   * ← FREE endpoint — returns full JSON data for all users
   */
  @Post('check')
  @ApiOperation({
    summary: 'Vehicle car check — returns full JSON report (free)',
    description: 'Enter UK registration number (VRM). Returns all available data as JSON.',
  })
  @ApiBody({ type: CarTaxDto })
  @HttpCode(HttpStatus.OK)
  async carCheck(@Req() req: Request, @Body() body: CarTaxDto) {
    const data = await this.carTaxService.carCheck(req.user!.id, body.vrm);
    return { message: 'Car check completed successfully', data };
  }

  /**
   * POST /car-tax/check-pdf
   * Body: { "vrm": "K5HHV" }
   * ← PAID endpoint — runs full check + returns downloadable PDF
   */
  @Post('check-pdf')
  @ApiOperation({
    summary: 'Full vehicle history PDF report (paid/subscribed users)',
    description: 'Enter UK VRM. Runs full check and returns a downloadable PDF report.',
  })
  @ApiBody({ type: CarTaxDto })
  async carCheckPdf(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: CarTaxDto,
  ) {
    // Run the full check (saves to DB too)
    const report = await this.carTaxService.carCheck(req.user!.id, body.vrm);

    // Check subscription — only paid users can download PDF
    const isPaid = report.keyType === 'paid';
    if (!isPaid) {
      throw new HttpException(
        'PDF reports are only available for subscribed users. Please subscribe to download full reports.',
        HttpStatus.FORBIDDEN,
      );
    }

    // Generate PDF
    const pdfBuffer = await generateVehicleReportPdf(report.toObject());

    const vrm = (report.registrationNumber ?? 'report').replace(/\s/g, '');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Vehicle_Report_${vrm}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.end(pdfBuffer);
  }

  /**
   * GET /car-tax/report-pdf/:id
   * ← Download PDF for an existing saved report (paid users only)
   */
  @Get('report-pdf/:id')
  @ApiOperation({ summary: 'Download PDF for an existing report (paid users only)' })
  @ApiParam({ name: 'id', description: 'MongoDB _id of the saved report' })
  async downloadReportPdf(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const report = await this.carTaxService.getSingleReport(id);

    if (report.keyType !== 'paid') {
      throw new HttpException(
        'PDF reports are only available for subscribed users.',
        HttpStatus.FORBIDDEN,
      );
    }

    const pdfBuffer = await generateVehicleReportPdf(report.toObject());

    const vrm = (report.registrationNumber ?? 'report').replace(/\s/g, '');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Vehicle_Report_${vrm}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.end(pdfBuffer);
  }

  /**
   * GET /car-tax/my-reports?page=1&limit=10
   */
  @Get('my-reports')
  @ApiOperation({ summary: 'Get all my saved car reports (paginated)' })
  @HttpCode(HttpStatus.OK)
  async getMyReports(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'skip', 'sortBy', 'sortOrder']);
    const result = await this.carTaxService.getMyReports(req.user!.id, options);
    return { message: 'Your CarTax Reports', meta: result.meta, data: result.data };
  }

  /**
   * GET /car-tax/single/:id
   */
  @Get('single/:id')
  @ApiOperation({ summary: 'Get a single report by MongoDB ID' })
  @ApiParam({ name: 'id', description: 'MongoDB _id of the report' })
  @HttpCode(HttpStatus.OK)
  async getSingleReport(@Param('id') id: string) {
    const data = await this.carTaxService.getSingleReport(id);
    return { message: 'CarTax Report', data };
  }

  /**
   * DELETE /car-tax/single/:id
   */
  @Delete('single/:id')
  @ApiOperation({ summary: 'Delete a report by MongoDB ID' })
  @ApiParam({ name: 'id', description: 'MongoDB _id of the report' })
  @HttpCode(HttpStatus.OK)
  async deleteReport(@Param('id') id: string) {
    const data = await this.carTaxService.deleteReport(id);
    return { message: 'Report deleted successfully', data };
  }
}
