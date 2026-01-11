import { randomBytes, pbkdf2Sync } from 'crypto';

export class PasswordHash {
  readonly hash: string;
  readonly salt: string;
  readonly iterations: number;
  readonly digest: string;

  private constructor(hash: string, salt: string, iterations = 310000, digest = 'sha512') {
    this.hash = hash;
    this.salt = salt;
    this.iterations = iterations;
    this.digest = digest;
  }

  static createFromPlain(plain: string): PasswordHash {
    const salt = randomBytes(16).toString('hex');
    const iterations = 310000;
    const digest = 'sha512';
    const derived = pbkdf2Sync(plain, salt, iterations, 64, digest).toString('hex');
    return new PasswordHash(derived, salt, iterations, digest);
  }

  static createFromStored(hash: string, salt: string, iterations = 310000, digest = 'sha512') {
    return new PasswordHash(hash, salt, iterations, digest);
  }

  verify(plain: string): boolean {
    const derived = pbkdf2Sync(plain, this.salt, this.iterations, 64, this.digest).toString('hex');
    return derived === this.hash;
  }

  toString() {
    return this.hash;
  }
}
