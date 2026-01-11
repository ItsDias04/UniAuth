export class RiskScore {
  readonly value: number;

  constructor(value: number) {
    if (value < 0) value = 0;
    if (value > 100) value = 100;
    this.value = value;
  }

  static fromFactors(ipReputation: number, geoMismatch: number, velocityScore: number): RiskScore {
    // Simple weighted calculation — replace with real ML or rules in production.
    const v = Math.round(ipReputation * 0.5 + geoMismatch * 0.3 + velocityScore * 0.2);
    return new RiskScore(v);
  }

  toNumber(): number {
    return this.value;
  }
}
