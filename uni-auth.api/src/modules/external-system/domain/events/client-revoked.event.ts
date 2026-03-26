import { DomainEvent } from '../../../../common/domain/domain-event';

/**
 * Доменное событие — OAuth2 клиент отозван / деактивирован.
 */
export class ClientRevokedEvent extends DomainEvent {
  constructor(
    public readonly clientDbId: string,
    public readonly clientId: string,
    public readonly revokedByUserId: string,
    public readonly reason: string,
  ) {
    super('client_revoked');
  }
}
