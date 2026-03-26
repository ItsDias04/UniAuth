export const USER_PROFILE_SERVICE = Symbol('USER_PROFILE_SERVICE');

export interface UserProfileReadModel {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface IUserProfileService {
  getByUserId(userId: string): Promise<UserProfileReadModel | null>;
}
