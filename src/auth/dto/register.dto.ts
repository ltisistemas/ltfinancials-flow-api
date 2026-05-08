import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Luiz Felipe',
    description: 'Nome completo do usuário.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: 'luiz@example.com',
    description: 'E-mail único para autenticação.',
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha de acesso (mínimo de 8 caracteres).',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
