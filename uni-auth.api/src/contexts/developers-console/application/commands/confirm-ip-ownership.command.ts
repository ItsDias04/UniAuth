import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class ConfirmIpOwnershipCommandOutput implements ICommandOutput {
  constructor(
    public readonly applicationId: string,
    public readonly verifiedIp: string,
    public readonly message: string,
  ) {}
}

export class ConfirmIpOwnershipCommand
  implements ICommandInput<ConfirmIpOwnershipCommandOutput>
{
  constructor(
    public readonly token: string,
    public readonly requestIp: string,
  ) {}
}
