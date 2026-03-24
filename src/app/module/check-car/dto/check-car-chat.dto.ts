import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CheckCarChatDto {
  @ApiProperty({
    example: 'Summarize the vehicle report for me',
    description: 'User question about the checked vehicle',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;
}
