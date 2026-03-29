import { Inject } from '@nestjs/common';
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
  DeveloperApplicationItem,
  GetOwnerApplicationsQuery,
  GetOwnerApplicationsQueryOutput,
} from '../queries/get-owner-applications.query';

@QueryHandler(GetOwnerApplicationsQuery)
export class GetOwnerApplicationsHandler
  implements
    NestQueryHandler<GetOwnerApplicationsQuery, GetOwnerApplicationsQueryOutput>,
    IQueryHandler<GetOwnerApplicationsQuery, GetOwnerApplicationsQueryOutput>
{
  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
  ) {}

  async execute(
    query: GetOwnerApplicationsQuery,
  ): Promise<GetOwnerApplicationsQueryOutput> {
    const applications = await this.clientApplicationRepository.findByOwner(
      query.ownerUserId,
    );

    return new GetOwnerApplicationsQueryOutput(
      applications.map(
        (app) =>
          new DeveloperApplicationItem(
            app.id,
            app.ownerUserId,
            app.name,
            app.redirectRoute,
            app.status,
            app.ip,
            app.ipIsVerified,
            app.createdAt,
          ),
      ),
    );
  }
}
