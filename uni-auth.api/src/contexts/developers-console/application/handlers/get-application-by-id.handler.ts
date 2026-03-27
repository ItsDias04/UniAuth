import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import {
  IQueryHandler as NestQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import { IQueryHandler } from '../../../../common/cqrs';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';
import {
  GetApplicationByIdQuery,
  GetApplicationByIdQueryOutput,
} from '../queries/get-application-by-id.query';

@QueryHandler(GetApplicationByIdQuery)
export class GetApplicationByIdHandler
  implements
    NestQueryHandler<GetApplicationByIdQuery, GetApplicationByIdQueryOutput>,
    IQueryHandler<GetApplicationByIdQuery, GetApplicationByIdQueryOutput>
{
  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
  ) {}

  async execute(
    query: GetApplicationByIdQuery,
  ): Promise<GetApplicationByIdQueryOutput> {
    const application = await this.clientApplicationRepository.findById(
      query.applicationId,
    );

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.ownerUserId !== query.ownerUserId) {
      throw new ForbiddenException('You are not allowed to access this application');
    }

    return new GetApplicationByIdQueryOutput(
      application.id,
      application.ownerUserId,
      application.name,
      application.redirectRoute,
      application.status,
      application.verifiedIps,
      application.createdAt,
      application.updatedAt,
    );
  }
}
