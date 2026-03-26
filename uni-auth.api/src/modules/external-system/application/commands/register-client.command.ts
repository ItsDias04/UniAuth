/**
 * Command — регистрация нового OAuth2 клиента.
 */
export class RegisterClientCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly redirectUris: string[],
    public readonly allowedGrantTypes: string[],
    public readonly allowedScopes: string[],
    public readonly ownerId: string,
    public readonly homepageUrl?: string,
    public readonly logoUrl?: string,
  ) {}
}
