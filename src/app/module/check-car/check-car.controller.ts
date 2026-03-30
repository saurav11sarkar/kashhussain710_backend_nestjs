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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckCarService } from './check-car.service';
import { CheckCarRouteDto } from './dto/check-car-route.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';

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
  async freeDVLACheck(@Req() req: Request, @Body() body: CheckCarRouteDto) {
    const data = await this.checkCarService.freeDVLACheck(
      req.user!.id,
      body.registrationNumber,
    );
    return { message: 'Free DVLA check successful', data };
  }

  // POST /check-car/paid
  @Post('paid')
  @ApiOperation({ summary: 'Paid DVLA car check' })
  @HttpCode(HttpStatus.OK)
  async paidDVLACheck(@Req() req: Request, @Body() body: CheckCarRouteDto) {
    const data = await this.checkCarService.paidDVLACheck(
      req.user!.id,
      body.registrationNumber,
    );
    return { message: 'Paid DVLA check successful', data };
  }

  // POST /check-car/mot-history
  @Post('mot-history')
  @ApiOperation({ summary: 'Full MOT history (DVSA + DVLA)' })
  @HttpCode(HttpStatus.OK)
  async motHistory(@Req() req: Request, @Body() body: CheckCarRouteDto) {
    const data = await this.checkCarService.motHistoryCheck(
      req.user!.id,
      body.registrationNumber,
    );
    return { message: 'MOT history fetched successfully', data };
  }

  @Get('my-checkcar')
  @ApiOperation({ summary: 'My car checkr fetched successfully' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  @HttpCode(HttpStatus.OK)
  async checkMyCar(@Req() req: Request) {
    const options = pick(req.query, [
      'limit',
      'page',
      'skip',
      'sortBy',
      'sortOrder',
    ]);
    const result = await this.checkCarService.checkMyCar(req.user!.id, options);
    return { message: 'Your Car Checks', meta: result.meta, data: result.data };
  }

  @Get('single/:id')
  @ApiOperation({ summary: 'Car checker fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async checkMyCarById(@Param('id') id: string) {
    const data = await this.checkCarService.getSingleCheckCar(id);
    return { message: 'Your Car Check', data };
  }

  @Delete('single/:id')
  @ApiOperation({ summary: 'Car checker delete successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteCarCheck(@Param('id') id: string) {
    const data = await this.checkCarService.deleteCarCheck(id);
    return { message: 'Your Car Check', data };
  }
}
