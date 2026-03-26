import { DomainEvent } from '../../../../common/domain';

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ip: string,
  ) {
    super('user.registered');
  }
}
