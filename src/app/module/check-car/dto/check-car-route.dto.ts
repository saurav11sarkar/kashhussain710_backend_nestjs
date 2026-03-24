import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckCarRouteDto {
  @ApiProperty({
    example: 'AB12CDE',
    description: 'UK vehicle registration number from route params',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{2,8}$/, {
    message:
      'registrationNumber must contain only letters and numbers after removing spaces',
  })
  registrationNumber: string;
}
