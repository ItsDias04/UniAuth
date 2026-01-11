export class PhoneNumber {
  readonly value: string;

  constructor(raw: string) {
    const cleaned = (raw || '').replace(/[^0-9+]/g, '');
    if (!PhoneNumber.isValid(cleaned)) {
      throw new Error(`Invalid phone number: ${raw}`);
    }
    this.value = cleaned;
  }

  static isValid(v: string) {
    // Very simple check: must be 7..15 digits (optionally starting +)
    const re = /^\+?[0-9]{7,15}$/;
    return re.test(v);
  }

  toString() {
    return this.value;
  }
}
