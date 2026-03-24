import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckCarPaymentDto {
  @ApiProperty({
    example: 'buyer@example.com',
    description: 'Customer email for receiving the report',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'gold',
    enum: ['basic', 'gold', 'premium'],
    description: 'Selected pricing package from the payment page',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['basic', 'gold', 'premium'])
  packageType: 'basic' | 'gold' | 'premium';

  @ApiProperty({
    example: 'stripe',
    required: false,
    description: 'Selected payment provider',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
