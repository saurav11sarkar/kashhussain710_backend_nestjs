import { PartialType } from '@nestjs/swagger';
import { CreateMotHistoryDto } from './create-mot-history.dto';

export class UpdateMotHistoryDto extends PartialType(CreateMotHistoryDto) {}
