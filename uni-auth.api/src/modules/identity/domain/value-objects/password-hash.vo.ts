import * as crypto from 'crypto';

/**
 * Value Object — хеш пароля с солью.
 * Использует Argon2-подобный подход (scrypt) для хеширования.
 */
export class PasswordHash {
  private constructor(private readonly hash: string) {}

  static async create(plainPassword: string): Promise<PasswordHash> {
    PasswordHash.validateStrength(plainPassword);
    const salt = crypto.randomBytes(32).toString('hex');
    const derivedKey = await PasswordHash.scryptAsync(plainPassword, salt, 64);
    const hash = `${salt}:${derivedKey.toString('hex')}`;
    return new PasswordHash(hash);
  }

  static fromHash(hash: string): PasswordHash {
    return new PasswordHash(hash);
  }

  async verify(plainPassword: string): Promise<boolean> {
    const [salt, storedHash] = this.hash.split(':');
    const derivedKey = await PasswordHash.scryptAsync(plainPassword, salt, 64);
    return storedHash === derivedKey.toString('hex');
  }

  toString(): string {
    return this.hash;
  }

  private static validateStrength(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one digit');
    }
  }

  private static scryptAsync(
    password: string,
    salt: string,
    keylen: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, keylen, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }
}
