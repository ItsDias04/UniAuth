import { IsString, IsUUID, Length } from 'class-validator';

export class ConfirmTotpDto {
  @IsUUID()
  methodId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
