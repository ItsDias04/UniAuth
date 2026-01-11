import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './application/services/clients.service';
import { Client } from './data/entities/client.entity';
import { RedirectUri } from './data/entities/redirect-uri.entity';
import { Scope } from './data/entities/scope.entity';
import { ClientsController } from './infrastructure/controllers/clients.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { RegisterClientHandler } from './application/handlers/register-client.handler';

@Module({
  imports: [TypeOrmModule.forFeature([Client, RedirectUri, Scope]), CqrsModule],
  providers: [ClientsService, RegisterClientHandler],
  controllers: [ClientsController],
  exports: [ClientsService],
})
export class ClientsModule {}
