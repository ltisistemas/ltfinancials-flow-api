import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { scryptSync } from 'crypto';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const jwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  } as unknown as JwtService;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as never, jwtService);
  });

  it('register creates user with hashed password and returns token', async () => {
    prisma.user.create.mockResolvedValue({
      id: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
      email: 'luiz@example.com',
      name: 'Luiz Felipe',
    });

    const result = await service.register({
      name: 'Luiz Felipe',
      email: 'Luiz@Example.com',
      password: 'Senha@123',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'luiz@example.com',
          password_hash: expect.any(String),
        }),
      }),
    );
    expect(result).toEqual({
      accessToken: 'mock-token',
      user: {
        id: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
        email: 'luiz@example.com',
        name: 'Luiz Felipe',
      },
    });
  });

  it('register throws conflict when email already exists', async () => {
    prisma.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.register({
        name: 'Luiz Felipe',
        email: 'luiz@example.com',
        password: 'Senha@123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login returns token for valid credentials', async () => {
    const salt = 'fixed-salt';
    const hash = `${salt}:${scryptSync('Senha@123', salt, 64).toString('hex')}`;
    prisma.user.findUnique.mockResolvedValue({
      id: '7d9152b3-7a49-4b28-9f42-1be3574b9ec2',
      email: 'luiz@example.com',
      name: 'Luiz Felipe',
      password_hash: hash,
    });

    const result = await service.login({
      email: 'luiz@example.com',
      password: 'Senha@123',
    });

    expect(result.accessToken).toBe('mock-token');
    expect(result.user.email).toBe('luiz@example.com');
  });

  it('login throws unauthorized for invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'luiz@example.com',
        password: 'Senha@123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
