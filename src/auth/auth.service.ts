import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const scrypt = promisify(scryptCallback);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterDto) {
    const email = payload.email.trim().toLowerCase();
    const passwordHash = await this.hashPassword(payload.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: payload.name.trim(),
          email,
          password_hash: passwordHash,
          saldo_atual: new Prisma.Decimal(0),
          salario_mensal: new Prisma.Decimal(0),
        },
      });

      return this.buildAuthResponse(user.id, user.email, user.name);
    } catch (error: unknown) {
      const isDuplicateEmail =
        error instanceof Prisma.PrismaClientKnownRequestError
          ? error.code === 'P2002'
          : Boolean(
              error &&
              typeof error === 'object' &&
              'code' in error &&
              (error as { code?: string }).code === 'P2002',
            );

      if (isDuplicateEmail) {
        throw new ConflictException('Email already registered');
      }

      throw error;
    }
  }

  async login(payload: LoginDto) {
    const email = payload.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const isPasswordValid = user?.password_hash
      ? await this.verifyPassword(payload.password, user.password_hash)
      : false;

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user.id, user.email, user.name);
  }

  private buildAuthResponse(userId: string, email: string, name: string) {
    const accessToken = this.jwtService.sign({
      sub: userId,
      email,
      name,
      role: 'authenticated',
    });

    return {
      accessToken,
      user: {
        id: userId,
        email,
        name,
      },
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${hash.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    storedPasswordHash: string,
  ): Promise<boolean> {
    const [salt, hashHex] = storedPasswordHash.split(':');
    if (!salt || !hashHex) {
      return false;
    }

    const computedHash = (await scrypt(password, salt, 64)) as Buffer;
    const storedHash = Buffer.from(hashHex, 'hex');

    if (computedHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(computedHash, storedHash);
  }
}
