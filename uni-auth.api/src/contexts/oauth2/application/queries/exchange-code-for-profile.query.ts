import { IQueryInput, IQueryOutput } from '../../../../common/cqrs';

export class UserProfileOutput implements IQueryOutput {
  constructor(
    public readonly userId: string,
    public readonly clientId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly avatarUrl: string | null,
  ) {}
}

/**
 * Step 6-7: exchanges one-time Token 3 for user profile.
 */
export class ExchangeCodeForProfileQuery implements IQueryInput<UserProfileOutput> {
  constructor(public readonly authorizationCode: string) {}
}
