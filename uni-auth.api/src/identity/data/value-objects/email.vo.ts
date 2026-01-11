export class Email {
  readonly value: string;

  constructor(email: string) {
    const normalized = (email || '').trim().toLowerCase();
    if (!Email.isValid(normalized)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    this.value = normalized;
  }

  static isValid(email: string) {
    // Simple RFC-like validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  toString() {
    return this.value;
  }
}
