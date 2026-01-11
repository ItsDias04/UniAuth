import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { MediatorService } from './mediator.service';
import { COMMAND_HANDLER_METADATA, QUERY_HANDLER_METADATA } from './constants';

@Injectable()
export class MediatorExplorer implements OnModuleInit {
  private readonly logger = new Logger(MediatorExplorer.name);

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly mediator: MediatorService,
  ) {}

  onModuleInit() {
    const providers = this.discovery.getProviders();
    for (const provider of providers) {
      const { metatype, instance } = provider;
      if (!metatype || !instance) continue;

      const cmdName = this.reflector.get<string | undefined>(COMMAND_HANDLER_METADATA, metatype);
      if (cmdName) {
        // register command handler instance
        this.mediator.registerCommand(cmdName, instance as any);
        this.logger.debug(`Registered command handler for ${cmdName}`);
      }

      const queryName = this.reflector.get<string | undefined>(QUERY_HANDLER_METADATA, metatype);
      if (queryName) {
        this.mediator.registerQuery(queryName, instance as any);
        this.logger.debug(`Registered query handler for ${queryName}`);
      }
    }
  }
}
