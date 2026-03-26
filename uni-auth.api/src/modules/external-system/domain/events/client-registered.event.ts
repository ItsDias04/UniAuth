import { DomainEvent } from '../../../../common/domain/domain-event';

/**
 * Доменное событие — внешний OAuth2 клиент зарегистрирован.
 */
export class ClientRegisteredEvent extends DomainEvent {
  constructor(
    public readonly clientId: string,
    public readonly clientDbId: string,
    public readonly name: string,
    public readonly registeredByUserId: string,
  ) {
    super('client_registered');
  }
}
