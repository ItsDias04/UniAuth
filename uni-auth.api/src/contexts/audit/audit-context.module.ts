import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityEventOrmEntity } from './infrastructure/persistence/security-event.orm-entity';
import { SecurityMonitoringController } from './presentation/security-monitoring.controller';
import { SecurityOfficerGuard } from './presentation/guards/security-officer.guard';
import { SecurityAlertEmailService } from './application/services/security-alert-email.service';
import { SecurityMonitoringService } from './application/services/security-monitoring.service';
import { SecurityOfficerAuthService } from './application/services/security-officer-auth.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([SecurityEventOrmEntity]),
  ],
  controllers: [SecurityMonitoringController],
  providers: [
    SecurityMonitoringService,
    SecurityAlertEmailService,
    SecurityOfficerAuthService,
    SecurityOfficerGuard,
  ],
  exports: [SecurityMonitoringService],
})
export class AuditContextModule {}
