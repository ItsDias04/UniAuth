/**
 * Query — получение списка клиентов владельца.
 */
export class GetClientsByOwnerQuery {
  constructor(public readonly ownerId: string) {}
}
