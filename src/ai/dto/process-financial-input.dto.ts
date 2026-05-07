import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ProcessFinancialInputDto {
  @ApiProperty({
    example: 'Paguei R$ 120 da internet dia 12 e recebi R$ 500 de um freela para o dia 15.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  input!: string;
}
