import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class LoginToAuthenticatorCommandOutput implements ICommandOutput {
  constructor(
    public readonly loginAttemptId: string,
    public readonly expiresInSeconds: number,
    public readonly message: string,
  ) {}
}

/**
 * Flow 3, step 1: validates credentials and starts email verification stage for device binding.
 */
export class LoginToAuthenticatorCommand
  implements ICommandInput<LoginToAuthenticatorCommandOutput>
{
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly deviceName: string,
    public readonly deviceFingerprint: string,
  ) {}
}
