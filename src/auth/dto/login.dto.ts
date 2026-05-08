import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'luiz@example.com',
    description: 'E-mail cadastrado.',
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha cadastrada.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
