import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class IssueExternalRedirectTokenCommandOutput implements ICommandOutput {
  constructor(
    public readonly token: string,
    public readonly expiresInSeconds: number,
  ) {}
}

export class IssueExternalRedirectTokenCommand implements ICommandInput<IssueExternalRedirectTokenCommandOutput> {
  constructor(
    public readonly actorUserId: string,
    public readonly applicationId: string,
  ) {}
}
