import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CarTaxService } from './car-tax.service';
import { CarTaxDto } from './dto/create-car-tax.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';

@ApiTags('car-tax')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('user'))
@Controller('car-tax')
export class CarTaxController {
  constructor(private readonly carTaxService: CarTaxService) {}

  /**
   * POST /car-tax/check
   * Body: { "vrm": "K5HHV" }
   * ← MAIN endpoint — use this in frontend
   */
  @Post('check')
  @ApiOperation({
    summary: 'Vehicle car check — TAX, MOT, mileage, road tax, CO2, flags',
    description: 'Enter UK registration number (VRM). Returns all available data.',
  })
  @ApiBody({ type: CarTaxDto })
  @HttpCode(HttpStatus.OK)
  async carCheck(@Req() req: Request, @Body() body: CarTaxDto) {
    const data = await this.carTaxService.carCheck(req.user!.id, body.vrm);
    return { message: 'Car check completed successfully', data };
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