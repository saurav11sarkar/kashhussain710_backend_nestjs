import { PartialType } from '@nestjs/swagger';
import { CreateCheckCarDto } from './create-check-car.dto';

export class UpdateCheckCarDto extends PartialType(CreateCheckCarDto) {}
