import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class VerifyMfaAndLoginCommandOutput implements ICommandOutput {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly message: string,
  ) {}
}

export class VerifyMfaAndLoginCommand
  implements ICommandInput<VerifyMfaAndLoginCommandOutput>
{
  constructor(
    public readonly mfaToken: string,
    public readonly code: string,
  ) {}
}
