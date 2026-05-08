import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cria conta com nome, email e senha' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'Usuário cadastrado com sucesso.',
    schema: {
      example: {
        accessToken: '<jwt>',
        user: {
          id: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
          email: 'luiz@example.com',
          name: 'Luiz Felipe',
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'Email already registered' })
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica com email e senha' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login efetuado com sucesso.',
    schema: {
      example: {
        accessToken: '<jwt>',
        user: {
          id: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
          email: 'luiz@example.com',
          name: 'Luiz Felipe',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }
}
