import { DomainEvent } from '../../../../common/domain/domain-event';

/**
 * Доменное событие — пользователь авторизовал внешнюю систему.
 */
export class AuthorizationGrantedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly clientDbId: string,
    public readonly scopes: string[],
  ) {
    super('authorization_granted');
  }
}
