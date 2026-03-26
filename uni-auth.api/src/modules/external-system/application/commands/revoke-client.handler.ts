import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RevokeClientCommand } from './revoke-client.command';
import {
  EXTERNAL_CLIENT_REPOSITORY,
  IExternalClientRepository,
} from '../../domain/repositories/external-client.repository.interface';

@CommandHandler(RevokeClientCommand)
export class RevokeClientHandler implements ICommandHandler<RevokeClientCommand> {
  constructor(
    @Inject(EXTERNAL_CLIENT_REPOSITORY)
    private readonly clientRepository: IExternalClientRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RevokeClientCommand): Promise<void> {
    const client = await this.clientRepository.findById(command.clientDbId);
    if (!client) {
      throw new NotFoundException('OAuth2 клиент не найден');
    }

    client.revoke(command.revokedByUserId, command.reason);
    await this.clientRepository.save(client);

    const events = client.domainEvents;
    client.clearDomainEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }
  }
}
