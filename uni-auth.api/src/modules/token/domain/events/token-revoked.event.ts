import { DomainEvent } from '../../../../common/domain';

export class TokenRevokedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
  ) {
    super('token.revoked');
  }
}
