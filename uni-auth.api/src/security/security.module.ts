import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityService } from './application/services/security.service';
import { SecurityController } from './infrastructure/controllers/security.controller';
import { SecurityEventEntity } from './data/entities/security-event.entity';
import { PasswordPolicyEntity } from './data/entities/password-policy.entity';
import { AccessPolicyEntity } from './data/entities/access-policy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SecurityEventEntity, PasswordPolicyEntity, AccessPolicyEntity])],
  providers: [SecurityService],
  controllers: [SecurityController],
  exports: [SecurityService],
})
export class SecurityModule {}
