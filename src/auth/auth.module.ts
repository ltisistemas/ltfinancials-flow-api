import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [SupabaseJwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
