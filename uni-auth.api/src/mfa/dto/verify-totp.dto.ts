import { IsUUID, IsString, Length } from 'class-validator';

export class VerifyTotpDto {
  @IsUUID()
  methodId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
