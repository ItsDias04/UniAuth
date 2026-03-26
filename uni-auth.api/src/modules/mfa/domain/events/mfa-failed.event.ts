import { DomainEvent } from '../../../../common/domain';

export class MfaFailedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly challengeId: string,
    public readonly reason: string,
  ) {
    super('mfa.failed');
  }
}
