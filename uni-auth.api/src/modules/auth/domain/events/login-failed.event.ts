import { DomainEvent } from '../../../../common/domain';

export class LoginFailedEvent extends DomainEvent {
  constructor(
    public readonly email: string,
    public readonly ip: string,
    public readonly reason: string,
  ) {
    super('auth.login.failed');
  }
}
