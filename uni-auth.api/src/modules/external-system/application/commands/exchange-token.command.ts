/**
 * Command — обмен кода авторизации на токены (Token Exchange).
 * Authorization Code Grant, шаг 2.
 */
export class ExchangeTokenCommand {
  constructor(
    public readonly grantType: string,
    public readonly code: string,
    public readonly redirectUri: string,
    public readonly clientId: string,
    public readonly clientSecret: string,
    public readonly codeVerifier?: string,
  ) {}
}
