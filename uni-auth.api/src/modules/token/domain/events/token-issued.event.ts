import { DomainEvent } from '../../../../common/domain';

export class TokenIssuedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly tokenType: string,
  ) {
    super('token.issued');
  }
}
