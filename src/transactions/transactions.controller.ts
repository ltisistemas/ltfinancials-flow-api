import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionStatus, TransactionType } from './transaction.enums';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth('bearer')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista transações do usuário autenticado' })
  @ApiQuery({ name: 'tipo', required: false, enum: TransactionType })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'categoria', required: false, type: String })
  @ApiQuery({ name: 'de', required: false, type: String })
  @ApiQuery({ name: 'ate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    description: 'Lista paginada de transações.',
    schema: {
      example: {
        data: [
          {
            id: '3275ef8f-2efa-4553-a0d8-0c363e67b364',
            userId: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
            descricao: 'Conta de energia',
            valorOriginal: 220.9,
            valorFinal: 220.9,
            dataVencimento: '2026-05-10T00:00:00.000Z',
            categoria: 'moradia',
            tipo: 'saida',
            status: 'pendente',
            saldoMutation: -220.9,
            createdAt: '2026-05-07T10:00:00.000Z',
            updatedAt: '2026-05-07T10:00:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    },
  })
  list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.transactionsService.list(currentUser, query);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova transação' })
  @ApiCreatedResponse({
    description: 'Transação criada com sucesso.',
    schema: {
      example: {
        id: '3275ef8f-2efa-4553-a0d8-0c363e67b364',
        userId: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
        descricao: 'Conta de energia',
        valorOriginal: 220.9,
        valorFinal: 220.9,
        dataVencimento: '2026-05-10T00:00:00.000Z',
        categoria: 'moradia',
        tipo: 'saida',
        status: 'pendente',
        saldoMutation: -220.9,
        createdAt: '2026-05-07T10:00:00.000Z',
        updatedAt: '2026-05-07T10:00:00.000Z',
      },
    },
  })
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() payload: CreateTransactionDto,
  ) {
    return this.transactionsService.create(currentUser, payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma transação do usuário autenticado' })
  @ApiOkResponse({
    description: 'Transação atualizada com sucesso.',
  })
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) transactionId: string,
    @Body() payload: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(currentUser, transactionId, payload);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove uma transação do usuário autenticado' })
  @ApiNoContentResponse({ description: 'Transação removida com sucesso.' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) transactionId: string,
  ) {
    await this.transactionsService.remove(currentUser, transactionId);
  }

  @Get('stats/resumo')
  @ApiOperation({ summary: 'Retorna o resumo financeiro do usuário' })
  @ApiOkResponse({
    description: 'Resumo financeiro retornado com sucesso.',
    schema: {
      example: {
        totalEntradasPagas: 10000,
        totalSaidas: 4200.35,
        saldoAtual: 5799.65,
      },
    },
  })
  getResumo(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.transactionsService.getResumo(currentUser);
  }
}
