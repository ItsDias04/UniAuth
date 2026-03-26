export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');

export interface IssuedTokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
}

export interface ITokenIssuer {
  issueTokenPair(userId: string, sessionId: string): Promise<IssuedTokenPair>;
}
