import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MotHistoryService } from './mot-history.service';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';

@ApiTags('mot-history')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('user'))
@Controller('mot-history')
export class MotHistoryController {
  constructor(private readonly motHistoryService: MotHistoryService) {}

  // GET /mot-history/my — login user এর সব history
  @Get('my')
  @ApiOperation({ summary: 'Get my MOT history list' })
  @HttpCode(HttpStatus.OK)
  async myHistory(@Req() req: Request) {
    const data = await this.motHistoryService.findByUser(req.user!.id);
    return { message: 'MOT history fetched successfully', data };
  }

  // GET /mot-history/registration/:reg — registration দিয়ে
  @Get('registration/:registrationNumber')
  @ApiOperation({ summary: 'Get MOT history by registration number' })
  @HttpCode(HttpStatus.OK)
  async byRegistration(@Param('registrationNumber') reg: string) {
    const data = await this.motHistoryService.findByRegistration(reg);
    return { message: 'MOT history fetched successfully', data };
  }

  // GET /mot-history/check-car/:checkCarId — CheckCar ID দিয়ে
  @Get('check-car/:checkCarId')
  @ApiOperation({ summary: 'Get MOT history by CheckCar ID' })
  @HttpCode(HttpStatus.OK)
  async byCheckCar(@Param('checkCarId') checkCarId: string) {
    const data = await this.motHistoryService.findByCheckCar(checkCarId);
    return { message: 'MOT history fetched successfully', data };
  }

  // GET /mot-history/:id — single record
  @Get(':id')
  @ApiOperation({ summary: 'Get MOT history by ID' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const data = await this.motHistoryService.findById(id);
    return { message: 'MOT history fetched successfully', data };
  }

  // DELETE /mot-history/:id
  @Delete(':id')
  @ApiOperation({ summary: 'Delete MOT history by ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.motHistoryService.remove(id);
  }
}
