import { DomainEvent } from './domain-event';

/**
 * Base Entity — все доменные сущности наследуются от этого класса.
 * Содержит идентификатор и базовые метаданные.
 */
export abstract class BaseEntity<TId = string> {
  protected _id: TId;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: TId) {
    this._id = id;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): TId {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  equals(other: BaseEntity<TId>): boolean {
    if (!other) return false;
    return this._id === other._id;
  }
}

/**
 * Aggregate Root — корень агрегата. Управляет доменными событиями.
 */
export abstract class AggregateRoot<TId = string> extends BaseEntity<TId> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
