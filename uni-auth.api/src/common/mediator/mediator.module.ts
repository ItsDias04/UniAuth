import { Module } from '@nestjs/common';
import { MediatorService } from './mediator.service';
import { DiscoveryModule } from '@nestjs/core';
import { MediatorExplorer } from './mediator.explorer';

@Module({
  imports: [DiscoveryModule],
  providers: [MediatorService, MediatorExplorer],
  exports: [MediatorService],
})
export class MediatorModule {}
