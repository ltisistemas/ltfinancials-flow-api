import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsString, MaxLength, Min } from 'class-validator';
import { TransactionStatus, TransactionType } from '../../transactions/transaction.enums';

export class StructuredTransactionDto {
  @ApiProperty({ example: 'Conta de internet' })
  @IsString()
  @MaxLength(255)
  descricao!: string;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorOriginal!: number;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorFinal!: number;

  @ApiProperty({ example: '2026-05-12T00:00:00.000Z' })
  @IsDateString()
  dataVencimento!: string;

  @ApiProperty({ example: 'servicos' })
  @IsString()
  @MaxLength(120)
  categoria!: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  tipo!: TransactionType;

  @ApiProperty({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;

  @ApiProperty({ example: -120 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  saldoMutation!: number;
}
