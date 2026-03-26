/**
 * CQRS Command — блокировка пользователя.
 */
export class BlockUserCommand {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
    public readonly blockedBy: string,
  ) {}
}
