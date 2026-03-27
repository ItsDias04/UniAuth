import { IQueryInput, IQueryOutput } from '../../../../common/cqrs';
import { ClientApplicationStatus } from '../../domain/entities/client-application.entity';

export class GetApplicationByIdQueryOutput implements IQueryOutput {
  constructor(
    public readonly applicationId: string,
    public readonly ownerUserId: string,
    public readonly name: string,
    public readonly redirectRoute: string,
    public readonly status: ClientApplicationStatus,
    public readonly verifiedIps: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class GetApplicationByIdQuery
  implements IQueryInput<GetApplicationByIdQueryOutput>
{
  constructor(
    public readonly ownerUserId: string,
    public readonly applicationId: string,
  ) {}
}
