import { IsString } from 'class-validator';

export class SetupTotpDto {
  // userId берётся из JWT, здесь ничего не нужно от клиента.
}

export class VerifyTotpDto {
  @IsString()
  code: string;
}

export class VerifyMfaChallengeDto {
  @IsString()
  challengeId: string;

  @IsString()
  code: string;
}
