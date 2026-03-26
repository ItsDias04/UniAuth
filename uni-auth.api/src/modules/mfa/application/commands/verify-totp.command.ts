export class VerifyTotpCommand {
  constructor(
    public readonly userId: string,
    public readonly code: string,
  ) {}
}
