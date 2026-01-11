import { IsUUID } from 'class-validator';

export class EnableTotpDto {
  @IsUUID()
  userId: string;
}
