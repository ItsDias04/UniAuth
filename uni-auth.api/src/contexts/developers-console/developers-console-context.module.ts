import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import {
  CLIENT_APPLICATION_REPOSITORY,
} from './domain/repositories/client-application.repository.interface';
import { InMemoryClientApplicationRepository } from './infrastructure/persistence/in-memory-client-application.repository';
import {
  DEVELOPERS_CONSOLE_REDIS_REPOSITORY,
} from './domain/repositories/developers-console-redis.repository.interface';
import { DevelopersConsoleRedisRepository } from './infrastructure/redis/developers-console.redis.repository';
import { CreateClientApplicationHandler } from './application/handlers/create-client-application.handler';
import { RequestIpOwnershipVerificationHandler } from './application/handlers/request-ip-ownership-verification.handler';
import { ConfirmIpOwnershipHandler } from './application/handlers/confirm-ip-ownership.handler';
import { IssueExternalRedirectTokenHandler } from './application/handlers/issue-external-redirect-token.handler';
import { ConsumeExternalRedirectTokenHandler } from './application/handlers/consume-external-redirect-token.handler';
import { DevelopersConsoleController } from './presentation/developers-console.controller';

const CommandHandlers = [
  CreateClientApplicationHandler,
  RequestIpOwnershipVerificationHandler,
  ConfirmIpOwnershipHandler,
  IssueExternalRedirectTokenHandler,
];

const QueryHandlers = [ConsumeExternalRedirectTokenHandler];

@Module({
  imports: [ConfigModule, CqrsModule],
  controllers: [DevelopersConsoleController],
  providers: [
    {
      provide: CLIENT_APPLICATION_REPOSITORY,
      useClass: InMemoryClientApplicationRepository,
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
