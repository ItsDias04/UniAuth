import { ICommandInput, ICommandOutput } from '../../../../../common/cqrs';

export class InitiateRegistrationCommandOutput implements ICommandOutput {
  constructor(
    public readonly registrationId: string,
    public readonly expiresInSeconds: number,
    public readonly message: string,
  ) {}
}

export class InitiateRegistrationCommand
  implements ICommandInput<InitiateRegistrationCommandOutput>
{
  constructor(
    public readonly login: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string,
    public readonly email: string,
  ) {}
}
