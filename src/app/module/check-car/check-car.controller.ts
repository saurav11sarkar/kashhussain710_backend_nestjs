import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CheckCarService } from './check-car.service';
import { CreateCheckCarDto } from './dto/create-check-car.dto';

@ApiTags('check-car')
@Controller('check-car')
export class CheckCarController {
  constructor(private readonly checkCarService: CheckCarService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create vehicle report data from DVLA registration lookup',
  })
  @ApiBody({
    type: CreateCheckCarDto,
    examples: {
      default: {
        summary: 'Lookup a UK registration number',
        value: {
          registrationNumber: 'AB12 CDE',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Vehicle report created successfully',
    schema: {
      example: {
        statusCode: 201,
        success: true,
        message: 'Vehicle report created successfully',
        data: {
          _id: '67e12ab34567890abc123456',
          registrationNumber: 'AB12CDE',
          heroSection: {
            registrationNumber: 'AB12CDE',
            vehicleName: 'BMW',
            subtitle: 'Taxed tax and Valid MOT',
            tax: {
              expiryDate: '2026-08-01',
              daysLeft: '130 days left',
            },
            mot: {
              expiryDate: '2026-10-01',
              daysLeft: '190 days left',
            },
          },
          vehicleDetails: {
            modelVariant: 'BMW 1995',
            primaryColour: 'BLACK',
            fuelType: 'DIESEL',
            engine: '1995 cc',
            yearOfManufacture: 2018,
            euroStatus: 'EURO 6',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid registration number' })
  @ApiNotFoundResponse({ description: 'Vehicle not found in DVLA' })
  async createCheckCar(@Body() dto: CreateCheckCarDto) {
    const result = await this.checkCarService.createCheckCar(dto);

    return {
      message: 'Vehicle report created successfully',
      data: result,
    };
  }
  
}