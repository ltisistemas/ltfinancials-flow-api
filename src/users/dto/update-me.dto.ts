import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({
    example: 'Luiz Felipe',
    description: 'Nome exibido no perfil do usuário.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 8500,
    description: 'Salário mensal do usuário.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salario_mensal?: number;
}
