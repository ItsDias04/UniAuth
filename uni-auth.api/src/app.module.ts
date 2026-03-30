import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IamContextModule } from './contexts/iam/iam-context.module';
import { SecurityContextModule } from './contexts/security/security-context.module';
import { Oauth2ContextModule } from './contexts/oauth2/oauth2-context.module';
import { AuditContextModule } from './contexts/audit/audit-context.module';
import { AdminContextModule } from './contexts/admin/admin-context.module';
import { DevelopersConsoleContextModule } from './contexts/developers-console/developers-console-context.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtStrategy } from './common/guards/jwt.strategy';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({ isGlobal: true }),

    // Database (PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASS', 'SuperAdmin'),
        database: configService.get<string>('DB_NAME', 'UniAuth'),
        entities: [__dirname + '/**/*.orm-entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Bounded Contexts (DDD Modules)
    IamContextModule,
    SecurityContextModule,
    Oauth2ContextModule,
    AuditContextModule,
    AdminContextModule,
    DevelopersConsoleContextModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
