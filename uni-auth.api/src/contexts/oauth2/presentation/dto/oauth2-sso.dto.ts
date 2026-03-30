import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyToken1Dto {
  @ApiProperty({
    example: '6f31ae2b2e643e1329139bc30f008593ef06a4f9740f8e55',
    description: 'One-time Token 1 received by external service',
  })
  @IsString()
  token1: string;
}

export class IntrospectToken3Dto {
  @ApiProperty({
    example: '5f0fc86f7f4d7e8275b8de2f9152d8a3313b4e8d995620f47ab8b5e94018a899',
    description: 'One-time Token 3 returned from UniAuth callback flow',
  })
  @IsString()
  token3: string;
}
