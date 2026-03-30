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
import { createHash, randomBytes } from 'crypto';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  GenerateApplicationApiTokenCommand,
  GenerateApplicationApiTokenCommandOutput,
} from '../commands/generate-application-api-token.command';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';

@CommandHandler(GenerateApplicationApiTokenCommand)
export class GenerateApplicationApiTokenHandler
  implements
    NestCommandHandler<
      GenerateApplicationApiTokenCommand,
      GenerateApplicationApiTokenCommandOutput
    >,
    ICommandHandler<
      GenerateApplicationApiTokenCommand,
      GenerateApplicationApiTokenCommandOutput
    >
{
  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
  ) {}

  async execute(
    command: GenerateApplicationApiTokenCommand,
  ): Promise<GenerateApplicationApiTokenCommandOutput> {
    if (!command.actorUserId?.trim() || !command.applicationId?.trim()) {
      throw new BadRequestException(
        'actorUserId and applicationId are required',
      );
    }

    const application = await this.clientApplicationRepository.findById(
      command.applicationId,
    );

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.ownerUserId !== command.actorUserId) {
      throw new ForbiddenException(
        'You are not allowed to generate API token for this application',
      );
    }

    if (application.status !== 'production') {
      throw new BadRequestException(
        'API token can be generated only for production applications',
      );
    }

    const apiToken = `ua_app_${randomBytes(40).toString('hex')}`;
    const apiTokenHash = createHash('sha256').update(apiToken).digest('hex');

    application.setApiTokenHash(apiTokenHash);
    await this.clientApplicationRepository.save(application);

    return new GenerateApplicationApiTokenCommandOutput(
      application.id,
      apiToken,
    );
  }
}
