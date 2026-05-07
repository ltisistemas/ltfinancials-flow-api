import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { TransactionStatus, TransactionType } from './transaction.enums';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  const currentUser: AuthenticatedUser = {
    id: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
    email: 'luiz@example.com',
  };

  const usersService = {
    ensureUser: jest.fn(),
  } as unknown as UsersService;

  const prisma = {
    $transaction: jest.fn(),
    transaction: {
      findFirst: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      findUniqueOrThrow: jest.fn(),
    },
  };

  let service: TransactionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TransactionsService(prisma as never, usersService);
  });

  it('creates a transaction and updates the current balance when saldoMutation is not zero', async () => {
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback({
          transaction: {
            create: jest.fn().mockResolvedValue({
              id: '3275ef8f-2efa-4553-a0d8-0c363e67b364',
              userId: currentUser.id,
              descricao: 'Conta de energia',
              valorOriginal: new Prisma.Decimal(220.9),
              valorFinal: new Prisma.Decimal(220.9),
              dataVencimento: new Date('2026-05-10T00:00:00.000Z'),
              categoria: 'moradia',
              tipo: TransactionType.SAIDA,
              status: TransactionStatus.PENDENTE,
              saldoMutation: new Prisma.Decimal(-220.9),
              createdAt: new Date('2026-05-07T10:00:00.000Z'),
              updatedAt: new Date('2026-05-07T10:00:00.000Z'),
            }),
          },
          user: {
            update: jest.fn().mockResolvedValue(undefined),
          },
        }),
    );

    const created = await service.create(currentUser, {
      descricao: 'Conta de energia',
      valorOriginal: 220.9,
      valorFinal: 220.9,
      dataVencimento: '2026-05-10T00:00:00.000Z',
      categoria: 'moradia',
      tipo: TransactionType.SAIDA,
      status: TransactionStatus.PENDENTE,
      saldoMutation: -220.9,
    });

    expect(usersService.ensureUser).toHaveBeenCalledWith(currentUser);
    expect(created.saldoMutation).toBe(-220.9);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('returns financial stats using transaction aggregates and current user balance', async () => {
    prisma.$transaction.mockResolvedValue([
      { _sum: { valorFinal: new Prisma.Decimal(10000) } },
      { _sum: { valorFinal: new Prisma.Decimal(4200.35) } },
      { saldo_atual: new Prisma.Decimal(5799.65) },
    ]);
    prisma.transaction.aggregate
      .mockResolvedValueOnce({
        _sum: { valorFinal: new Prisma.Decimal(10000) },
      })
      .mockResolvedValueOnce({
        _sum: { valorFinal: new Prisma.Decimal(4200.35) },
      });
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      saldo_atual: new Prisma.Decimal(5799.65),
    });

    const resumo = await service.getResumo(currentUser);

    expect(resumo).toEqual({
      totalEntradasPagas: 10000,
      totalSaidas: 4200.35,
      saldoAtual: 5799.65,
    });
  });

  it('throws when trying to update a transaction that does not belong to the current user', async () => {
    prisma.transaction.findFirst.mockResolvedValue(null);

    await expect(
      service.update(currentUser, '3275ef8f-2efa-4553-a0d8-0c363e67b364', {
        descricao: 'Nova descrição',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
