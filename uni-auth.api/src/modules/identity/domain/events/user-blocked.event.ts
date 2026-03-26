import { DomainEvent } from '../../../../common/domain';

export class UserBlockedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
    public readonly blockedBy: string,
  ) {
    super('user.blocked');
  }
}
