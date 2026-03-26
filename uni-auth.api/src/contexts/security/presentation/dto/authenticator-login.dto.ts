import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginToAuthenticatorDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  deviceName: string;

  @ApiProperty({ example: 'd3c17b6f-fingerprint-hash' })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  deviceFingerprint: string;
}

export class VerifyAuthenticatorEmailDto {
  @ApiProperty({ example: '8db12ea9-0337-4934-b06a-d7f3f21f633f' })
  @IsString()
  loginAttemptId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  emailCode: string;
}
