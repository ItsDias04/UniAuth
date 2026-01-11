import { IsString, Length } from 'class-validator';

export class VerifyChallengeDto {
  @IsString()
  @Length(4, 10)
  code: string;
}
