import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CheckCarService } from './check-car.service';
import { CreateCheckCarDto } from './dto/create-check-car.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';

@ApiTags('check-car')
@Controller('check-car')
export class CheckCarController {
  constructor(private readonly checkCarService: CheckCarService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create vehicle report data from DVLA registration lookup',
  })
  @ApiBody({ type: CreateCheckCarDto })
  @ApiCreatedResponse({ description: 'Vehicle report created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid registration number' })
  @ApiNotFoundResponse({ description: 'Vehicle not found in DVLA' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  async createCheckCar(@Req() req: Request, @Body() dto: CreateCheckCarDto) {
    const result = await this.checkCarService.createCheckCar(req.user!.id, dto);
    return {
      statusCode: 201,
      success: true,
      message: 'Vehicle report created successfully',
      data: result,
    };
  }

  @Get('history/:registration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full MOT history for a vehicle' })
  @ApiParam({
    name: 'registration',
    example: 'AB12CDE',
    description: 'UK vehicle registration number (no spaces)',
  })
  @ApiOkResponse({
    description: 'Full MOT history returned successfully',
    schema: {
      example: {
        statusCode: 200,
        success: true,
        message: 'MOT history fetched successfully',
        data: {
          registration: 'AB12CDE',
          make: 'BMW',
          model: '3 SERIES',
          firstUsedDate: '2018-05-01',
          fuelType: 'Petrol',
          primaryColour: 'Black',
          hasOutstandingRecall: 'No',
          summary: { totalTests: 4, passed: 4, failed: 0 },
          mileage: {
            lastMotMileage: 40080,
            average: 5010,
            mileageIssues: 'No issues detected',
            status: 'LOW',
          },
          motTests: [
            {
              completedDate: '2024-05-10',
              testResult: 'PASSED',
              expiryDate: '2025-05-09',
              odometerValue: 40080,
              odometerUnit: 'mi',
              motTestNumber: '123456789',
              defects: [],
              advisories: [],
              minorDefects: [],
              majorDefects: [],
              dangerousDefects: [],
              prsFails: [],
            },
          ],
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Vehicle not found in DVLA' })
  async getMotHistory(@Param('registration') registration: string) {
    const result = await this.checkCarService.getMotHistory(registration);
    return {
      statusCode: 200,
      success: true,
      message: 'MOT history fetched successfully',
      data: result,
    };
  }
}
