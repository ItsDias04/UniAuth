import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler as NestCommandHandler } from '@nestjs/cqrs';
import { ICommandHandler } from '../../../../common/cqrs';
import { ToggleApplicationStatusCommand } from '../commands/toggle-application-status.command';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';

@CommandHandler(ToggleApplicationStatusCommand)
export class ToggleApplicationStatusHandler
  implements
    NestCommandHandler<ToggleApplicationStatusCommand, { applicationId: string; status: string }>,
    ICommandHandler<ToggleApplicationStatusCommand, { applicationId: string; status: string }>
{
  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
  ) {}

  async execute(command: ToggleApplicationStatusCommand): Promise<{ applicationId: string; status: string }> {
    const application = await this.clientApplicationRepository.findById(command.applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.ownerUserId !== command.userId) {
      throw new BadRequestException('Unauthorized to modify this application');
    }

    application.toggleStatus();
    await this.clientApplicationRepository.save(application);

    return { applicationId: application.id, status: application.status };
  }
}
