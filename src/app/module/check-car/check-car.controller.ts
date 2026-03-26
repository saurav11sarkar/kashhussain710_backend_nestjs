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
@Controller('check-car')
export class CheckCarController {
  constructor(private readonly checkCarService: CheckCarService) {}

  @Post()
  @ApiOperation({
    summary: 'check car is create',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  @HttpCode(HttpStatus.OK)
  async createCheckCar(
    @Req() req: Request,
    @Body() createCheckNumber: CheckCarRouteDto,
  ) {
    const result = await this.checkCarService.createCheckCar(
      req.user!.id,
      createCheckNumber.registrationNumber,
    );

    return {
      message: 'create check car successfully',
      data: result,
    };
  }
  
}
