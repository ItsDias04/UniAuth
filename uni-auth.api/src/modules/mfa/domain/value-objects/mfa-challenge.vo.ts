/**
 * Value Object — MFA Challenge.
 * Представляет запрос на прохождение второго фактора.
 */
export class MfaChallenge {
  constructor(
    public readonly challengeId: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly verified: boolean = false,
  ) {}

  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  markVerified(): MfaChallenge {
    return new MfaChallenge(
      this.challengeId,
      this.userId,
      this.expiresAt,
      true,
    );
  }
}
