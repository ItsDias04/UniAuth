import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class CreateClientApplicationCommandOutput implements ICommandOutput {
  constructor(
    public readonly applicationId: string,
    public readonly ownerUserId: string,
    public readonly name: string,
    public readonly redirectRoute: string,
  ) {}
}

export class CreateClientApplicationCommand
  implements ICommandInput<CreateClientApplicationCommandOutput>
{
  constructor(
    public readonly ownerUserId: string,
    public readonly name: string,
    public readonly redirectRoute: string,
  ) {}
}
