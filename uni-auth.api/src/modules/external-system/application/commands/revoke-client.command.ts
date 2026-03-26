/**
 * Command — отзыв OAuth2 клиента.
 */
export class RevokeClientCommand {
  constructor(
    public readonly clientDbId: string,
    public readonly revokedByUserId: string,
    public readonly reason: string,
  ) {}
}
