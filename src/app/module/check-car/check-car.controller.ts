import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckCarService } from './check-car.service';
import { CheckCarRouteDto } from './dto/check-car-route.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';

@ApiTags('check-car')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('user'))
@Controller('check-car')
export class CheckCarController {
  constructor(private readonly checkCarService: CheckCarService) {}

  // POST /check-car/free
  @Post('free')
  @ApiOperation({ summary: 'Free DVLA car check' })
  @HttpCode(HttpStatus.OK)
  async freeCheck(@Req() req: Request, @Body() body: CheckCarRouteDto) {
    const result = await this.checkCarService.freeCheckCar(
      req.user!.id,
      body.registrationNumber,
    );
    return { message: 'Free car check successful', data: result };
  }

  // POST /check-car/paid
  @Post('paid')
  @ApiOperation({ summary: 'Paid DVLA car check (more detailed)' })
  @HttpCode(HttpStatus.OK)
  async paidCheck(@Req() req: Request, @Body() body: CheckCarRouteDto) {
    const result = await this.checkCarService.paidCheckCar(
      req.user!.id,
      body.registrationNumber,
    );
    return { message: 'Paid car check successful', data: result };
  }

  // POST /check-car/mot-history
  @Post('mot-history')
  @ApiOperation({ summary: 'Full MOT history check (DVSA)' })
  @HttpCode(HttpStatus.OK)
  async motHistory(@Req() req: Request, @Body() body: CheckCarRouteDto) {
    const result = await this.checkCarService.motHistoryCheck(
      req.user!.id,
      body.registrationNumber,
    );
    return { message: 'MOT history fetched successfully', data: result };
  }
}
