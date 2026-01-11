export class RegisterClientCommand {
  constructor(
    public readonly name: string | undefined,
    public readonly redirectUris: string[],
    public readonly scopes?: string[],
    public readonly grantTypes?: string[],
  ) {}
}
