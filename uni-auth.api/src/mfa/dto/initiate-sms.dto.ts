import { IsUUID, IsString, Matches } from 'class-validator';

export class InitiateSmsDto {
  @IsUUID()
  userId: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/)
  phone: string;
}
