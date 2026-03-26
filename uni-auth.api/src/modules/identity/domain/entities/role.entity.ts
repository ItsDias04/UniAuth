/**
 * Domain Entity — Role (роль пользователя в системе).
 * Не является Aggregate Root — управляется через User.
 */
export class Role {
  constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _permissions: string[] = [],
  ) {}

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get permissions(): ReadonlyArray<string> {
    return [...this._permissions];
  }

  hasPermission(permission: string): boolean {
    return this._permissions.includes(permission);
  }

  equals(other: Role): boolean {
    if (!other) return false;
    return this._id === other._id;
  }
}
