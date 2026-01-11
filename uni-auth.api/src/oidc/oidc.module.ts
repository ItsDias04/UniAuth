import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationCode } from './data/entities/authorization-code.entity';
import { AuthorizationRequest } from './data/entities/authorization-request.entity';
import { OidcService } from './application/services/oidc.service';
import { OidcController } from './infrastructure/controllers/oidc.controller';
import { IdentityModule } from '../identity/identity.module';
import { ClientsModule } from '../clients/clients.module';
import { MfaModule } from '../mfa/mfa.module';
import { SecurityModule } from '../security/security.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthorizationCode, AuthorizationRequest]),
    IdentityModule,
    ClientsModule,
    MfaModule,
    SecurityModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'changeme',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [OidcController],
  providers: [OidcService],
  exports: [OidcService],
})
export class OidcModule {}
