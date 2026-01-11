import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { IdentityService } from './application/services/identity.service/identity.service';
import { User } from './data/entities/user.entity';
import { Credential } from './data/entities/credential.entity';
import { IdentityProfile } from './data/entities/identity-profile.entity';
import { AuthService } from './application/services/auth.service/auth.service';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CreateUserHandler } from './application/handlers/create-user.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Credential, IdentityProfile]),
    CqrsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'changeme',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [IdentityService, AuthService, JwtStrategy, CreateUserHandler],
  exports: [IdentityService, AuthService],
})
export class IdentityModule {}
