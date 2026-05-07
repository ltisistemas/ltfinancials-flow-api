import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './authenticated-user.interface';
import { SupabaseJwtPayload } from './supabase-jwt-payload.interface';

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('SUPABASE_JWT_SECRET'),
    });
  }

  validate(payload: SupabaseJwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email ?? '',
      role: payload.role,
      name: payload.user_metadata?.name,
    };
  }
}
