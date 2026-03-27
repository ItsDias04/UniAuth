import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class RequestIpOwnershipVerificationCommandOutput
  implements ICommandOutput
{
  constructor(
    public readonly token: string,
    public readonly expiresInSeconds: number,
    public readonly confirmationHint: string,
  ) {}
}

export class RequestIpOwnershipVerificationCommand
  implements ICommandInput<RequestIpOwnershipVerificationCommandOutput>
{
  constructor(
    public readonly actorUserId: string,
    public readonly applicationId: string,
  ) {}
}
