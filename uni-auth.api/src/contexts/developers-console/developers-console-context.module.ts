import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CLIENT_APPLICATION_REPOSITORY,
} from './domain/repositories/client-application.repository.interface';
import { ClientApplicationRepository } from './infrastructure/persistence/client-application.repository';
import { ClientApplicationOrmEntity } from './infrastructure/persistence/client-application.orm-entity';
import {
  DEVELOPERS_CONSOLE_REDIS_REPOSITORY,
} from './domain/repositories/developers-console-redis.repository.interface';
import { DevelopersConsoleRedisRepository } from './infrastructure/redis/developers-console.redis.repository';
import { CreateClientApplicationHandler } from './application/handlers/create-client-application.handler';
import { RequestIpOwnershipVerificationHandler } from './application/handlers/request-ip-ownership-verification.handler';
import { ConfirmIpOwnershipHandler } from './application/handlers/confirm-ip-ownership.handler';
import { IssueExternalRedirectTokenHandler } from './application/handlers/issue-external-redirect-token.handler';
import { ConsumeExternalRedirectTokenHandler } from './application/handlers/consume-external-redirect-token.handler';
import { GetOwnerApplicationsHandler } from './application/handlers/get-owner-applications.handler';
import { GetApplicationByIdHandler } from './application/handlers/get-application-by-id.handler';
import { UpdateClientApplicationSettingsHandler } from './application/handlers/update-client-application-settings.handler';
import { DevelopersConsoleController } from './presentation/developers-console.controller';

const CommandHandlers = [
  CreateClientApplicationHandler,
  UpdateClientApplicationSettingsHandler,
  RequestIpOwnershipVerificationHandler,
  ConfirmIpOwnershipHandler,
  IssueExternalRedirectTokenHandler,
];

const QueryHandlers = [
  ConsumeExternalRedirectTokenHandler,
  GetOwnerApplicationsHandler,
  GetApplicationByIdHandler,
];

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    TypeOrmModule.forFeature([ClientApplicationOrmEntity]),
  ],
  controllers: [DevelopersConsoleController],
  providers: [
    {
      provide: CLIENT_APPLICATION_REPOSITORY,
      useClass: ClientApplicationRepository,
    },
    {
      provide: DEVELOPERS_CONSOLE_REDIS_REPOSITORY,
      useClass: DevelopersConsoleRedisRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [CLIENT_APPLICATION_REPOSITORY],
})
export class DevelopersConsoleContextModule {}
