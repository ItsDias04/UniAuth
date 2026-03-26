/**
 * CQRS Command — регистрация нового пользователя.
 */
export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly displayName: string,
    public readonly ip: string,
  ) {}
}
