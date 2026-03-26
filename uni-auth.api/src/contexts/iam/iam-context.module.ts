import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from './registration/presentation/registration.controller';
import { UserAccountOrmEntity } from './registration/infrastructure/persistence/user-account.orm-entity';
import {
  REGISTRATION_CACHE_REPOSITORY,
} from './registration/domain/repositories/registration-cache.repository.interface';
import {
  USER_ACCOUNT_REPOSITORY,
} from './registration/domain/repositories/user-account.repository.interface';
import { RegistrationCacheRedisRepository } from './registration/infrastructure/redis/registration-cache.redis-repository';
import { UserAccountRepository } from './registration/infrastructure/persistence/user-account.repository';
import {
  EMAIL_SENDER,
} from './registration/application/services/email-sender.interface';
import {
  WHATSAPP_SENDER,
} from './registration/application/services/whatsapp-sender.interface';
import { SmtpEmailSender } from './registration/infrastructure/notifications/smtp-email.sender';
import { WhatsAppStubSender } from './registration/infrastructure/notifications/whatsapp-stub.sender';
import { InitiateRegistrationHandler } from './registration/application/handlers/initiate-registration.handler';
import { VerifyRegistrationEmailHandler } from './registration/application/handlers/verify-registration-email.handler';
import { VerifyWhatsAppAndCompleteRegistrationHandler } from './registration/application/handlers/verify-whatsapp-and-complete-registration.handler';
import { RegistrationInitiatedHandler } from './registration/application/event-handlers/registration-initiated.handler';
import { EmailVerifiedHandler } from './registration/application/event-handlers/email-verified.handler';

const CommandHandlers = [
  InitiateRegistrationHandler,
  VerifyRegistrationEmailHandler,
  VerifyWhatsAppAndCompleteRegistrationHandler,
];

const DomainEventHandlers = [
  RegistrationInitiatedHandler,
  EmailVerifiedHandler,
];

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    TypeOrmModule.forFeature([UserAccountOrmEntity]),
  ],
  controllers: [RegistrationController],
  providers: [
    {
      provide: REGISTRATION_CACHE_REPOSITORY,
      useClass: RegistrationCacheRedisRepository,
    },
    {
      provide: USER_ACCOUNT_REPOSITORY,
      useClass: UserAccountRepository,
    },
    {
      provide: EMAIL_SENDER,
      useClass: SmtpEmailSender,
    },
    {
      provide: WHATSAPP_SENDER,
      useClass: WhatsAppStubSender,
    },
    ...CommandHandlers,
    ...DomainEventHandlers,
  ],
  exports: [USER_ACCOUNT_REPOSITORY],
})
export class IamContextModule {}
