import { DomainEvent } from '../../../../common/domain';

export class MfaVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly challengeId: string,
  ) {
    super('mfa.verified');
  }
}
