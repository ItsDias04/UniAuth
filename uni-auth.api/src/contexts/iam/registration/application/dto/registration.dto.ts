import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateRegistrationDto {
  @ApiProperty({ example: 'john.doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  login: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase, and digit',
  })
  password: string;

    @ApiProperty({ example: 'StrongPass123' })
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'Confirm password must contain uppercase, lowercase, and digit',
    })

  confirmPassword: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ example: '+77015554433' })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyRegistrationEmailDto {
  @ApiProperty({ example: '2b661ef0-5f6f-49f8-a2d3-6deeb8d5f8f9' })
  @IsString()
  registrationId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/)
  emailCode: string;
}

export class VerifyWhatsAppAndCompleteRegistrationDto {
  @ApiProperty({ example: '2b661ef0-5f6f-49f8-a2d3-6deeb8d5f8f9' })
  @IsString()
  registrationId: string;

  @ApiProperty({ example: '8aeb65de-4470-4a39-9168-c3e9925be857' })
  @IsString()
  tempToken: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Matches(/^\d{6}$/)
  whatsAppCode: string;
}
