import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TransactionStatus, TransactionType } from '../transaction.enums';

export class CreateTransactionDto {
  @ApiProperty({ example: 'Conta de energia', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  descricao!: string;

  @ApiProperty({ example: 220.9 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorOriginal!: number;

  @ApiProperty({ example: 220.9 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorFinal!: number;

  @ApiProperty({ example: '2026-05-10T00:00:00.000Z' })
  @IsDateString()
  dataVencimento!: string;

  @ApiProperty({ example: 'moradia', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  categoria!: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.SAIDA })
  @IsEnum(TransactionType)
  tipo!: TransactionType;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.PENDENTE })
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;

  @ApiProperty({
    example: -220.9,
    description:
      'Mutação aplicada ao saldo atual do usuário ao persistir a transação.',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  saldoMutation!: number;
}
