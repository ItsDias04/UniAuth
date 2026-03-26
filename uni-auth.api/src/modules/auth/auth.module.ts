import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { LoginAttemptOrmEntity } from './infrastructure/persistence/login-attempt.orm-entity';
import { LoginAttemptRepository } from './infrastructure/persistence/login-attempt.repository';
import { LOGIN_ATTEMPT_REPOSITORY } from './domain/repositories/login-attempt.repository.interface';

import { LoginHandler } from './application/commands/login.handler';
import { LogoutHandler } from './application/commands/logout.handler';
import { JwtStrategy } from './application/strategies/jwt.strategy';
import { AuthController } from './presentation/auth.controller';
import { IdentityModule } from '../identity/identity.module';
import { TokenModule } from '../token/token.module';

const CommandHandlers = [LoginHandler, LogoutHandler];

@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([LoginAttemptOrmEntity]),
    IdentityModule,
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: LOGIN_ATTEMPT_REPOSITORY,
      useClass: LoginAttemptRepository,
    },
    JwtStrategy,
    ...CommandHandlers,
  ],
  exports: [LOGIN_ATTEMPT_REPOSITORY],
})
export class AuthModule {}
