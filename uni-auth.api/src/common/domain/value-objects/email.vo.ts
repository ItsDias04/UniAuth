/**
 * Value Object — Email address.
 * Immutable, validated upon creation.
 */
export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email.toLowerCase().trim();
  }

  static create(email: string): Email {
    if (!email || !Email.isValid(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }
    return new Email(email);
  }

  static isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
