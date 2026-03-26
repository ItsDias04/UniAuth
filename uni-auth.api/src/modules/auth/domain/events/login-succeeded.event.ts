import { DomainEvent } from '../../../../common/domain';

export class LoginSucceededEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ip: string,
    public readonly userAgent: string,
  ) {
    super('auth.login.succeeded');
  }
}
