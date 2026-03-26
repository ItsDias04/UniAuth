import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // CORS — для работы с внешними клиентами
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global audit interceptor
  app.useGlobalInterceptors(new AuditInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`UniAuth Identity Provider running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
// UniAuth — универсальный провайдер идентификации
// c поддержкой многофакторной аутентификации

// Сыртқы ақпараттық жүйелер үшін көпфакторлы аутентификацияны (MFA) қолдайтын 
// идентификацияның қауіпсіз провайдерінің (Identity Provider) архитектурасын әзірлеу / 

// Разработка архитектуры безопасного провайдера идентификации (Identity Provider) 
// с поддержкой многофакторной аутентификации (MFA) для внешних информационных систем 

// Development of a secure Identity Provider architecture with Multi-Factor 
// Authentication (MFA) support for external information systems