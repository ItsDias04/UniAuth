import { IQueryInput, IQueryOutput } from '../../../../common/cqrs';
import { ClientApplicationStatus } from '../../domain/entities/client-application.entity';

export class DeveloperApplicationItem implements IQueryOutput {
  constructor(
    public readonly applicationId: string,
    public readonly ownerUserId: string,
    public readonly name: string,
    public readonly redirectRoute: string,
    public readonly status: ClientApplicationStatus,
    public readonly ip: string | null,
    public readonly ipIsVerified: boolean,
    public readonly createdAt: Date,
  ) {}
}

export class GetOwnerApplicationsQueryOutput implements IQueryOutput {
  constructor(public readonly items: DeveloperApplicationItem[]) {}
}

export class GetOwnerApplicationsQuery
  implements IQueryInput<GetOwnerApplicationsQueryOutput>
{
  constructor(public readonly ownerUserId: string) {}
}
