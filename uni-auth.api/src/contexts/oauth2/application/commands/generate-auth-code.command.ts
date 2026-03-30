import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class GenerateAuthCodeCommandOutput implements ICommandOutput {
  constructor(
    public readonly token3: string,
    public readonly expiresInSeconds: number,
    public readonly redirectUrl: string,
  ) {}
}

/**
 * Step 3-4: verify Token 1 with authenticated user and issue one-time Token 3.
 */
export class GenerateAuthCodeCommand implements ICommandInput<GenerateAuthCodeCommandOutput> {
  constructor(
    public readonly userId: string,
    public readonly token1: string,
  ) {}
}
