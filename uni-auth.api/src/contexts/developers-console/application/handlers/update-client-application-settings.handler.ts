import {
  BadRequestException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';
import {
  UpdateClientApplicationSettingsCommand,
  UpdateClientApplicationSettingsCommandOutput,
} from '../commands/update-client-application-settings.command';

@CommandHandler(UpdateClientApplicationSettingsCommand)
export class UpdateClientApplicationSettingsHandler
  implements
    NestCommandHandler<
      UpdateClientApplicationSettingsCommand,
      UpdateClientApplicationSettingsCommandOutput
    >,
    ICommandHandler<
      UpdateClientApplicationSettingsCommand,
      UpdateClientApplicationSettingsCommandOutput
    >
{
  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
  ) {}

  async execute(
    command: UpdateClientApplicationSettingsCommand,
  ): Promise<UpdateClientApplicationSettingsCommandOutput> {
    if (!command.actorUserId?.trim()) {
      throw new BadRequestException('Authenticated user is required');
    }

    const application = await this.clientApplicationRepository.findById(
      command.applicationId,
    );

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.ownerUserId !== command.actorUserId) {
      throw new ForbiddenException('You are not allowed to update this application');
    }

    application.updateSettings({
      redirectRoute: command.redirectRoute?.trim() || undefined,
    });

    await this.clientApplicationRepository.save(application);

    return new UpdateClientApplicationSettingsCommandOutput(
      application.id,
      application.name,
      application.redirectRoute,
      application.status,
    );
  }
}
