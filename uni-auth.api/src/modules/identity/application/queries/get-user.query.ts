/**
 * CQRS Query — получение пользователя по ID.
 */
export class GetUserQuery {
  constructor(public readonly userId: string) {}
}
