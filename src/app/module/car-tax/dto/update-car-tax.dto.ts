import { PartialType } from '@nestjs/swagger';
import { CarTaxDto } from './create-car-tax.dto';

export class UpdateCarTaxDto extends PartialType(CarTaxDto) {}
