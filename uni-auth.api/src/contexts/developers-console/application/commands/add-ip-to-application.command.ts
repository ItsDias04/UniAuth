import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class AddIpToApplicationCommandOutput implements ICommandOutput {
  constructor(
    public readonly applicationId: string,
    public readonly ipAddress: string,
  ) {}
}

export class AddIpToApplicationCommand
  implements ICommandInput<AddIpToApplicationCommandOutput>
{
  constructor(
    public readonly actorUserId: string,
    public readonly applicationId: string,
    public readonly ipAddress: string,
  ) {}
}