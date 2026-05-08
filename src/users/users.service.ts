import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { serializeUser } from '../common/utils/serialization.util';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUser(currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async getMe(currentUser: AuthenticatedUser) {
    const user = await this.ensureUser(currentUser);
    return serializeUser(user);
  }

  async updateMe(currentUser: AuthenticatedUser, payload: UpdateMeDto) {
    await this.ensureUser(currentUser);

    const user = await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.salario_mensal !== undefined
          ? {
              salario_mensal: new Prisma.Decimal(payload.salario_mensal),
            }
          : {}),
      },
    });

    return serializeUser(user);
  }
}
