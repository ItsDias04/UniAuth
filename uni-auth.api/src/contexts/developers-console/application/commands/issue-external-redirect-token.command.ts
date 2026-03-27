import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class IssueExternalRedirectTokenCommandOutput implements ICommandOutput {
  constructor(
    public readonly token: string,
    public readonly expiresInSeconds: number,
    public readonly redirectUrl: string,
  ) {}
}

export class IssueExternalRedirectTokenCommand
  implements ICommandInput<IssueExternalRedirectTokenCommandOutput>
{
  constructor(public readonly applicationId: string) {}
}
