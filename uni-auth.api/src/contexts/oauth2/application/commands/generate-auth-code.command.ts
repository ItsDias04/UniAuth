import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class GenerateAuthCodeCommandOutput implements ICommandOutput {
  constructor(
    public readonly authorizationCode: string,
    public readonly expiresInSeconds: number,
  ) {}
}

/**
 * Flow 1 (SSO): creates short-lived AuthorizationCode for external OAuth2 client.
 * Session pre-check is expected to be done by caller/guard before command dispatch.
 */
export class GenerateAuthCodeCommand
  implements ICommandInput<GenerateAuthCodeCommandOutput>
{
  constructor(
    public readonly userId: string,
    public readonly clientId: string,
    public readonly redirectUri: string,
  ) {}
}
