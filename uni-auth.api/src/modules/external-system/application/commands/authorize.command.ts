/**
 * Command — запрос кода авторизации OAuth2
 * (Authorization Code Grant, шаг 1).
 */
export class AuthorizeCommand {
  constructor(
    public readonly clientId: string,
    public readonly redirectUri: string,
    public readonly responseType: string,
    public readonly scopes: string[],
    public readonly state: string,
    public readonly userId: string,
    public readonly codeChallenge?: string,
    public readonly codeChallengeMethod?: string,
  ) {}
}
