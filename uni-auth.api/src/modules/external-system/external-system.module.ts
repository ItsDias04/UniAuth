import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExternalClientOrmEntity } from './infrastructure/persistence/external-client.orm-entity';
import { AuthorizationCodeOrmEntity } from './infrastructure/persistence/authorization-code.orm-entity';
import { ExternalClientRepository } from './infrastructure/persistence/external-client.repository';
import { AuthorizationCodeRepository } from './infrastructure/persistence/authorization-code.repository';
import { EXTERNAL_CLIENT_REPOSITORY } from './domain/repositories/external-client.repository.interface';
import { AUTHORIZATION_CODE_REPOSITORY } from './domain/repositories/authorization-code.repository.interface';

import { RegisterClientHandler } from './application/commands/register-client.handler';
import { RevokeClientHandler } from './application/commands/revoke-client.handler';
import { AuthorizeHandler } from './application/commands/authorize.handler';
import { ExchangeTokenHandler } from './application/commands/exchange-token.handler';
import { GetClientsByOwnerHandler } from './application/queries/get-clients-by-owner.handler';
import { GetAllClientsHandler } from './application/queries/get-all-clients.handler';

import { ExternalClientController } from './presentation/external-client.controller';
import { OAuth2Controller } from './presentation/oauth2.controller';

import { TokenModule } from '../token/token.module';

const CommandHandlers = [
  RegisterClientHandler,
  RevokeClientHandler,
  AuthorizeHandler,
  ExchangeTokenHandler,
];

const QueryHandlers = [
  GetClientsByOwnerHandler,
  GetAllClientsHandler,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ExternalClientOrmEntity, AuthorizationCodeOrmEntity]),
    TokenModule,
  ],
  controllers: [ExternalClientController, OAuth2Controller],
  providers: [
    {
      provide: EXTERNAL_CLIENT_REPOSITORY,
      useClass: ExternalClientRepository,
    },
    {
      provide: AUTHORIZATION_CODE_REPOSITORY,
      useClass: AuthorizationCodeRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [EXTERNAL_CLIENT_REPOSITORY],
})
export class ExternalSystemModule {}
