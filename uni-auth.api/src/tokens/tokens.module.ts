import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from './application/services/token.service';
import { Session } from './data/entities/session.entity';
import { RefreshToken } from './data/entities/refresh-token.entity';
import { TokensController } from './infrastructure/controllers/tokens.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'changeme',
        signOptions: { expiresIn: '1h' },
      }),
    }),
    IdentityModule,
  ],
  providers: [TokenService],
  controllers: [TokensController],
  exports: [TokenService],
})
export class TokensModule {}
