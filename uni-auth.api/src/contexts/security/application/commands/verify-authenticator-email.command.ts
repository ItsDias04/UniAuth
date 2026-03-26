import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class VerifyAuthenticatorEmailCommandOutput implements ICommandOutput {
  constructor(
    public readonly trustedDeviceId: string,
    public readonly secret: string,
    public readonly message: string,
  ) {}
}

/**
 * Flow 3, step 2: verifies email code and finalizes trusted device binding.
 */
export class VerifyAuthenticatorEmailCommand
  implements ICommandInput<VerifyAuthenticatorEmailCommandOutput>
{
  constructor(
    public readonly loginAttemptId: string,
    public readonly emailCode: string,
  ) {}
}
