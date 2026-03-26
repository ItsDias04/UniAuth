import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionOrmEntity } from './infrastructure/persistence/session.orm-entity';
import { SessionRepository } from './infrastructure/persistence/session.repository';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository.interface';
import { SessionController } from './presentation/session.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SessionOrmEntity])],
  controllers: [SessionController],
  providers: [
    {
      provide: SESSION_REPOSITORY,
      useClass: SessionRepository,
    },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionModule {}
