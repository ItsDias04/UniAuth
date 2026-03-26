import { ICommandInput, ICommandOutput } from '../../../../../common/cqrs';

export class VerifyRegistrationEmailCommandOutput implements ICommandOutput {
  constructor(
    public readonly tempToken: string,
    public readonly message: string,
  ) {}
}

export class VerifyRegistrationEmailCommand
  implements ICommandInput<VerifyRegistrationEmailCommandOutput>
{
  constructor(
    public readonly registrationId: string,
    public readonly emailCode: string,
  ) {}
}
