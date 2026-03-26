import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class InitiateLoginCommandOutput implements ICommandOutput {
  constructor(
    public readonly mfaRequired: boolean,
    public readonly message: string,
    public readonly mfaToken?: string,
    public readonly expiresInSeconds?: number,
    public readonly accessToken?: string,
    public readonly refreshToken?: string,
  ) {}
}

export class InitiateLoginCommand
  implements ICommandInput<InitiateLoginCommandOutput>
{
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
