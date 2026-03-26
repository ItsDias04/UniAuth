/**
 * Base class for all domain events in the system.
 * Part of the Shared Kernel (DDD).
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventName: string;

  protected constructor(eventName: string) {
    this.occurredOn = new Date();
    this.eventName = eventName;
  }
}
