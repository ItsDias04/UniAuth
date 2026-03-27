import { BadRequestException, Inject } from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  CreateClientApplicationCommand,
  CreateClientApplicationCommandOutput,
} from '../commands/create-client-application.command';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';
import { ClientApplication } from '../../domain/entities/client-application.entity';

@CommandHandler(CreateClientApplicationCommand)
export class CreateClientApplicationHandler
  implements
    NestCommandHandler<
      CreateClientApplicationCommand,
      CreateClientApplicationCommandOutput
    >,
    ICommandHandler<CreateClientApplicationCommand, CreateClientApplicationCommandOutput>
{
  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
  ) {}

  async execute(
    command: CreateClientApplicationCommand,
  ): Promise<CreateClientApplicationCommandOutput> {
    if (!command.ownerUserId?.trim()) {
      throw new BadRequestException('ownerUserId is required');
    }

    if (!command.name?.trim() || !command.redirectRoute?.trim()) {
      throw new BadRequestException('name and redirectRoute are required');
    }

    const application = ClientApplication.create({
      id: randomUUID(),
      ownerUserId: command.ownerUserId.trim(),
      name: command.name.trim(),
      redirectRoute: command.redirectRoute.trim(),
    });

    await this.clientApplicationRepository.save(application);

    return new CreateClientApplicationCommandOutput(
      application.id,
      application.ownerUserId,
      application.name,
      application.redirectRoute,
    );
  }
}
