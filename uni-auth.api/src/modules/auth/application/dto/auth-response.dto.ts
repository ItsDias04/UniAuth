export class AuthResponseDto {
  accessToken?: string;
  refreshToken?: string;
  mfaRequired: boolean;
  mfaChallengeId?: string;
  expiresIn?: number;
  tokenType?: string;

  static success(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;
    dto.mfaRequired = false;
    dto.expiresIn = expiresIn;
    dto.tokenType = 'Bearer';
    return dto;
  }

  static mfaChallenge(challengeId: string): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.mfaRequired = true;
    dto.mfaChallengeId = challengeId;
    return dto;
  }
}
