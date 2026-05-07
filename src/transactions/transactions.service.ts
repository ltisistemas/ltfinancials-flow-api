import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import {
  serializeDecimalValue,
  serializeTransaction,
} from '../common/utils/serialization.util';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionStatus, TransactionType } from './transaction.enums';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async list(currentUser: AuthenticatedUser, query: ListTransactionsQueryDto) {
    await this.usersService.ensureUser(currentUser);

    const where: Prisma.TransactionWhereInput = {
      userId: currentUser.id,
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoria
        ? {
            categoria: {
              contains: query.categoria,
              mode: 'insensitive',
            },
          }
        : {}),
      ...this.buildDateFilter(query.de, query.ate),
    };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: [{ dataVencimento: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: items.map(serializeTransaction),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async create(currentUser: AuthenticatedUser, payload: CreateTransactionDto) {
    await this.usersService.ensureUser(currentUser);

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: this.mapCreatePayload(currentUser.id, payload),
      });

      if (payload.saldoMutation !== 0) {
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            saldo_atual: {
              increment: new Prisma.Decimal(payload.saldoMutation),
            },
          },
        });
      }

      return created;
    });

    return serializeTransaction(transaction);
  }

  async update(
    currentUser: AuthenticatedUser,
    transactionId: string,
    payload: UpdateTransactionDto,
  ) {
    await this.usersService.ensureUser(currentUser);

    const existing = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: currentUser.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Transaction not found');
    }

    const oldMutation = serializeDecimalValue(existing.saldoMutation);
    const newMutation = payload.saldoMutation ?? oldMutation;
    const mutationDelta = newMutation - oldMutation;

    const transaction = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: this.mapUpdatePayload(payload),
      });

      if (mutationDelta !== 0) {
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            saldo_atual: {
              increment: new Prisma.Decimal(mutationDelta),
            },
          },
        });
      }

      return updated;
    });

    return serializeTransaction(transaction);
  }

  async remove(currentUser: AuthenticatedUser, transactionId: string) {
    await this.usersService.ensureUser(currentUser);

    const existing = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: currentUser.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.delete({
        where: { id: transactionId },
      });

      const mutation = serializeDecimalValue(existing.saldoMutation);
      if (mutation !== 0) {
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            saldo_atual: {
              increment: new Prisma.Decimal(-mutation),
            },
          },
        });
      }
    });
  }

  async getResumo(currentUser: AuthenticatedUser) {
    await this.usersService.ensureUser(currentUser);

    const [totalEntradasPagas, totalSaidas, user] =
      await this.prisma.$transaction([
        this.prisma.transaction.aggregate({
          where: {
            userId: currentUser.id,
            tipo: TransactionType.ENTRADA,
            status: TransactionStatus.PAGO,
          },
          _sum: {
            valorFinal: true,
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId: currentUser.id,
            tipo: TransactionType.SAIDA,
          },
          _sum: {
            valorFinal: true,
          },
        }),
        this.prisma.user.findUniqueOrThrow({
          where: { id: currentUser.id },
        }),
      ]);

    return {
      totalEntradasPagas: serializeDecimalValue(
        totalEntradasPagas._sum.valorFinal,
      ),
      totalSaidas: serializeDecimalValue(totalSaidas._sum.valorFinal),
      saldoAtual: serializeDecimalValue(user.saldo_atual),
    };
  }

  private buildDateFilter(
    de?: string,
    ate?: string,
  ): Pick<Prisma.TransactionWhereInput, 'dataVencimento'> | {} {
    if (!de && !ate) {
      return {};
    }

    return {
      dataVencimento: {
        ...(de ? { gte: new Date(de) } : {}),
        ...(ate ? { lte: new Date(ate) } : {}),
      },
    };
  }

  private mapCreatePayload(
    userId: string,
    payload: CreateTransactionDto,
  ): Prisma.TransactionUncheckedCreateInput {
    return {
      descricao: payload.descricao,
      valorOriginal: new Prisma.Decimal(payload.valorOriginal),
      valorFinal: new Prisma.Decimal(payload.valorFinal),
      dataVencimento: new Date(payload.dataVencimento),
      categoria: payload.categoria,
      tipo: payload.tipo,
      status: payload.status,
      saldoMutation: new Prisma.Decimal(payload.saldoMutation),
      userId,
    };
  }

  private mapUpdatePayload(
    payload: UpdateTransactionDto,
  ): Prisma.TransactionUncheckedUpdateInput {
    return {
      ...(payload.descricao !== undefined
        ? { descricao: payload.descricao }
        : {}),
      ...(payload.valorOriginal !== undefined
        ? { valorOriginal: new Prisma.Decimal(payload.valorOriginal) }
        : {}),
      ...(payload.valorFinal !== undefined
        ? { valorFinal: new Prisma.Decimal(payload.valorFinal) }
        : {}),
      ...(payload.dataVencimento !== undefined
        ? { dataVencimento: new Date(payload.dataVencimento) }
        : {}),
      ...(payload.categoria !== undefined
        ? { categoria: payload.categoria }
        : {}),
      ...(payload.tipo !== undefined ? { tipo: payload.tipo } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.saldoMutation !== undefined
        ? { saldoMutation: new Prisma.Decimal(payload.saldoMutation) }
        : {}),
    };
  }
}
