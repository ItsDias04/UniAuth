import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
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