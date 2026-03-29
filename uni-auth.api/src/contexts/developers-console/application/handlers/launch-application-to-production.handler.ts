import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler as NestCommandHandler } from '@nestjs/cqrs';
import { ICommandHandler } from '../../../../common/cqrs';
import { LaunchApplicationToProductionCommand } from '../commands/launch-application-to-production.command';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';

@CommandHandler(LaunchApplicationToProductionCommand)
export class LaunchApplicationToProductionHandler
  implements
    NestCommandHandler<LaunchApplicationToProductionCommand, { applicationId: string; status: string }>,
    ICommandHandler<LaunchApplicationToProductionCommand, { applicationId: string; status: string }>
{
  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
  ) {}

  async execute(command: LaunchApplicationToProductionCommand): Promise<{ applicationId: string; status: string }> {
    const application = await this.clientApplicationRepository.findById(command.applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.ownerUserId !== command.userId) {
      throw new BadRequestException('Unauthorized to modify this application');
    }

    if (!application.ipIsVerified) {
      throw new BadRequestException('IP must be verified before launching to production');
    }

    if (application.redirectRoute === '') {
      throw new BadRequestException('Redirect route must be configured before launching to production');
    }

    application.launchToProduction();
    await this.clientApplicationRepository.save(application);

    return { applicationId: application.id, status: application.status };
  }
}
