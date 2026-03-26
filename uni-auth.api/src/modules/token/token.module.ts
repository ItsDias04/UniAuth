import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshTokenOrmEntity } from './infrastructure/persistence/refresh-token.orm-entity';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { TOKEN_SERVICE } from './domain/services/token.service.interface';
import { TokenController } from './presentation/token.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokenOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_ACCESS_SECRET',
          'dev_jwt_secret_change_me',
        ),
        signOptions: {
          expiresIn: parseInt(
            configService.get<string>('JWT_ACCESS_TTL', '900'),
            10,
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TokenController],
  providers: [
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [TOKEN_SERVICE, JwtModule],
})
export class TokenModule {}
