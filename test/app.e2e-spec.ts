import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppModule (e2e)', () => {
  let app: INestApplication;
  let accessToken = '';

  const state = {
    users: [] as Array<Record<string, unknown>>,
    transactions: [] as Array<Record<string, unknown>>,
  };

  const prismaMock = {
    $transaction: async (
      input:
        | Array<Promise<unknown>>
        | ((tx: typeof prismaMock) => Promise<unknown>),
    ) => {
      if (typeof input === 'function') {
        return input(prismaMock);
      }

      return Promise.all(input);
    },
    user: {
      create: jest.fn(async ({ data }) => {
        const normalizedEmail = String(data.email).toLowerCase();
        const existing = state.users.find(
          (user) => String(user.email).toLowerCase() === normalizedEmail,
        );

        if (existing) {
          const duplicateError = {
            code: 'P2002',
          } as Error & { code: string };
          throw duplicateError;
        }

        const created = {
          id: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
          ...data,
          email: normalizedEmail,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.users.push(created);
        return created;
      }),
      findUnique: jest.fn(async ({ where }) => {
        if (where.id) {
          return state.users.find((entry) => entry.id === where.id) ?? null;
        }

        if (where.email) {
          const normalizedEmail = String(where.email).toLowerCase();
          return (
            state.users.find(
              (entry) => String(entry.email).toLowerCase() === normalizedEmail,
            ) ?? null
          );
        }

        return null;
      }),
      update: jest.fn(async ({ where, data }) => {
        const user = state.users.find((entry) => entry.id === where.id);
        if (!user) {
          throw new Error('User not found');
        }

        if (data.name !== undefined) {
          user.name = data.name;
        }

        if (data.salario_mensal !== undefined) {
          user.salario_mensal = data.salario_mensal;
        }

        if (data.saldo_atual?.increment !== undefined) {
          const currentBalance = new Prisma.Decimal(
            String(user.saldo_atual ?? 0),
          );
          user.saldo_atual = currentBalance.add(data.saldo_atual.increment);
        }

        user.updatedAt = new Date();
        return user;
      }),
      findUniqueOrThrow: jest.fn(async ({ where }) => {
        const user = state.users.find((entry) => entry.id === where.id);
        if (!user) {
          throw new Error('User not found');
        }

        return user;
      }),
    },
    transaction: {
      findMany: jest.fn(async ({ where, skip = 0, take = 20 }) => {
        return state.transactions
          .filter((transaction) => matchTransaction(transaction, where))
          .sort((left, right) => {
            const leftDate = new Date(String(left.dataVencimento)).getTime();
            const rightDate = new Date(String(right.dataVencimento)).getTime();
            return leftDate - rightDate;
          })
          .slice(skip, skip + take);
      }),
      count: jest.fn(async ({ where }) => {
        return state.transactions.filter((transaction) =>
          matchTransaction(transaction, where),
        ).length;
      }),
      create: jest.fn(async ({ data }) => {
        const created = {
          id: '3275ef8f-2efa-4553-a0d8-0c363e67b364',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.transactions.push(created);
        return created;
      }),
      findFirst: jest.fn(async ({ where }) => {
        return (
          state.transactions.find((transaction) =>
            matchTransaction(transaction, where),
          ) ?? null
        );
      }),
      update: jest.fn(async ({ where, data }) => {
        const transaction = state.transactions.find(
          (entry) => entry.id === where.id,
        );
        if (!transaction) {
          throw new Error('Transaction not found');
        }

        Object.assign(transaction, data, { updatedAt: new Date() });
        return transaction;
      }),
      delete: jest.fn(async ({ where }) => {
        const index = state.transactions.findIndex(
          (entry) => entry.id === where.id,
        );
        if (index === -1) {
          throw new Error('Transaction not found');
        }

        const [removed] = state.transactions.splice(index, 1);
        return removed;
      }),
      aggregate: jest.fn(async ({ where }) => {
        const total = state.transactions
          .filter((transaction) => matchTransaction(transaction, where))
          .reduce(
            (sum, transaction) =>
              sum.add(new Prisma.Decimal(String(transaction.valorFinal))),
            new Prisma.Decimal(0),
          );

        return {
          _sum: {
            valorFinal: total,
          },
        };
      }),
    },
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://local/test';
    process.env.DIRECT_URL = 'postgresql://local/test';
    process.env.SUPABASE_JWT_SECRET = 'test-secret';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.CORS_ORIGIN = 'http://localhost:3000';

    const { AppModule } =
      require('../src/app.module') as typeof import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /health returns 200', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
  });

  it('GET /users/me without token returns 401', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('POST /auth/register creates user and returns token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Luiz Felipe',
        email: 'luiz@example.com',
        password: 'Senha@123',
      })
      .expect(201);

    expect(response.body.user).toMatchObject({
      email: 'luiz@example.com',
      name: 'Luiz Felipe',
    });
    expect(response.body.user.password_hash).toBeUndefined();
    expect(typeof response.body.accessToken).toBe('string');

    accessToken = response.body.accessToken as string;
  });

  it('POST /auth/register rejects duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Outro Nome',
        email: 'luiz@example.com',
        password: 'Senha@123',
      })
      .expect(409);
  });

  it('POST /auth/register rejects extra fields', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Novo Usuário',
        email: 'novo@example.com',
        password: 'Senha@123',
        role: 'admin',
      })
      .expect(400);
  });

  it('POST /auth/login authenticates with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'luiz@example.com',
        password: 'Senha@123',
      })
      .expect(200);

    expect(response.body.user).toMatchObject({
      email: 'luiz@example.com',
      name: 'Luiz Felipe',
    });
    expect(typeof response.body.accessToken).toBe('string');
  });

  it('POST /auth/login rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'luiz@example.com',
        password: 'SenhaErrada',
      })
      .expect(401);
  });

  it('creates and lists transactions with a valid auth token', async () => {
    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        descricao: 'Conta de energia',
        valorOriginal: 220.9,
        valorFinal: 220.9,
        dataVencimento: '2026-05-10T00:00:00.000Z',
        categoria: 'moradia',
        tipo: 'saida',
        status: 'pendente',
        saldoMutation: -220.9,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      descricao: 'Conta de energia',
      saldoMutation: -220.9,
    });
  });
});

function matchTransaction(
  transaction: Record<string, unknown>,
  where: Record<string, unknown> | undefined,
): boolean {
  if (!where) {
    return true;
  }

  if (where.id && transaction.id !== where.id) {
    return false;
  }

  if (where.userId && transaction.userId !== where.userId) {
    return false;
  }

  if (where.tipo && transaction.tipo !== where.tipo) {
    return false;
  }

  if (where.status && transaction.status !== where.status) {
    return false;
  }

  if (where.categoria) {
    const categoryFilter = where.categoria as { contains?: string };
    const categoryValue = String(transaction.categoria ?? '').toLowerCase();
    const containsValue = String(categoryFilter.contains ?? '').toLowerCase();

    if (containsValue && !categoryValue.includes(containsValue)) {
      return false;
    }
  }

  if (where.dataVencimento) {
    const dueDate = new Date(String(transaction.dataVencimento)).getTime();
    const filter = where.dataVencimento as { gte?: Date; lte?: Date };

    if (filter.gte && dueDate < filter.gte.getTime()) {
      return false;
    }

    if (filter.lte && dueDate > filter.lte.getTime()) {
      return false;
    }
  }

  return true;
}
