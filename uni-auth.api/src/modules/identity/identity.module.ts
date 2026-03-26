import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { RoleOrmEntity } from './infrastructure/persistence/role.orm-entity';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';

import { RegisterUserHandler } from './application/commands/register-user.handler';
import { BlockUserHandler } from './application/commands/block-user.handler';
import { GetUserHandler } from './application/queries/get-user.handler';
import { UserController } from './presentation/user.controller';

const CommandHandlers = [RegisterUserHandler, BlockUserHandler];
const QueryHandlers = [GetUserHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserOrmEntity, RoleOrmEntity]),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [USER_REPOSITORY],
})
export class IdentityModule {}
