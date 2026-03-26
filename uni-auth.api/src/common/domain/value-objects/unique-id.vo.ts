import { randomUUID } from 'crypto';

/**
 * Value Object — типизированный UUID-идентификатор.
 * Используется для строгой типизации ID в разных bounded contexts.
 */
export class UniqueId {
  private readonly value: string;

  private constructor(id: string) {
    this.value = id;
  }

  static create(): UniqueId {
    return new UniqueId(randomUUID());
  }

  static from(id: string): UniqueId {
    if (!id || id.trim().length === 0) {
      throw new Error('UniqueId cannot be empty');
    }
    return new UniqueId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: UniqueId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
