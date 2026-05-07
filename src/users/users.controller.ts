import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado' })
  @ApiOkResponse({
    description: 'Perfil do usuário retornado com sucesso.',
    schema: {
      example: {
        id: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
        email: 'luiz@example.com',
        name: 'Luiz Felipe',
        saldo_atual: 1250.5,
        salario_mensal: 8500,
        createdAt: '2026-05-07T10:00:00.000Z',
        updatedAt: '2026-05-07T10:00:00.000Z',
      },
    },
  })
  getMe(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.getMe(currentUser);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualiza os dados do usuário autenticado' })
  @ApiOkResponse({
    description: 'Perfil atualizado com sucesso.',
    schema: {
      example: {
        id: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
        email: 'luiz@example.com',
        name: 'Luiz atualizado',
        saldo_atual: 1250.5,
        salario_mensal: 9000,
        createdAt: '2026-05-07T10:00:00.000Z',
        updatedAt: '2026-05-07T11:00:00.000Z',
      },
    },
  })
  updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() payload: UpdateMeDto,
  ) {
    return this.usersService.updateMe(currentUser, payload);
  }
}
