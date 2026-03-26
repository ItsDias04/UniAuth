import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegisterClientCommand } from './register-client.command';
import {
  EXTERNAL_CLIENT_REPOSITORY,
  IExternalClientRepository,
} from '../../domain/repositories/external-client.repository.interface';
import { ExternalClient } from '../../domain/entities/external-client.entity';

@CommandHandler(RegisterClientCommand)
export class RegisterClientHandler implements ICommandHandler<RegisterClientCommand> {
  constructor(
    @Inject(EXTERNAL_CLIENT_REPOSITORY)
    private readonly clientRepository: IExternalClientRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterClientCommand): Promise<{
    id: string;
    clientId: string;
    clientSecret: string;
  }> {
    const { client, plainSecret } = ExternalClient.register({
      id: randomUUID(),
      name: command.name,
      description: command.description,
      redirectUris: command.redirectUris,
      allowedGrantTypes: command.allowedGrantTypes,
      allowedScopes: command.allowedScopes,
      ownerId: command.ownerId,
      homepageUrl: command.homepageUrl,
      logoUrl: command.logoUrl,
    });

    await this.clientRepository.save(client);

    // Публикация доменных событий
    const events = client.domainEvents;
    client.clearDomainEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }

    return {
      id: client.id,
      clientId: client.clientId,
      clientSecret: plainSecret,
    };
  }
}
