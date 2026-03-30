import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

@Component({
    selector: 'app-external-service-integration-docs',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, MessageModule],
    templateUrl: './external-service-integration-docs.component.html',
    styleUrl: './external-service-integration-docs.component.scss'
})
export class ExternalServiceIntegrationDocsComponent {
    copyInfoMessage = '';

    readonly promptText = `Ты senior fullstack-разработчик (NestJS + Angular).
Реализуй интеграцию входа через UniAuth в существующем внешнем сервисе.

Контекст:
- Внешний сервис уже имеет собственные login/register.
- UniAuth backend доступен по http://localhost:3001/api/v1.
- Нужно добавить кнопку "Войти с помощью UniAuth" на странице логина внешнего сервиса.

Что нужно сделать:
1) Angular (внешний сервис):
- Добавь кнопку "Войти с помощью UniAuth" на странице логина.
- По клику вызывай backend внешнего сервиса: POST /auth/uniauth/start.
- Из ответа получай redirectUrl и делай window.location.href = redirectUrl.

2) NestJS backend (внешний сервис):
- Добавь endpoint POST /auth/uniauth/start.
- Внутри endpoint:
    a) Получи Token 1 у UniAuth через API token приложения:
         POST http://localhost:3001/api/v1/oauth2/sso/issue-token-1
         Header: Authorization: Bearer <application-api-token>
         Body: {}
     Response: { token1: string, expiresInSeconds: number }
  b) Сформируй redirectUrl на страницу UniAuth bridge:
     http://localhost:4200/oauth2/external-redirect/{token1}
     (если у вас UniAuth web отдается с другого host/port, используй его)
  c) Верни во внешний фронтенд JSON: { redirectUrl }

3) Callback endpoint внешнего сервиса:
- Создай endpoint, который указан у UniAuth как redirectRoute, например:
  GET /auth/uniauth/callback?token3=...
- В callback:
  a) Извлеки token3 из query.
  b) Проверь token3 через UniAuth:
     POST http://localhost:3001/api/v1/oauth2/sso/introspect-token-3
      Header: Authorization: Bearer <application-api-token>
     Body: { token3 }
  c) Если ответ status === "OK":
     - Найди/создай локального пользователя по email или userId.
     - Сгенерируй локальную сессию/JWT внешнего сервиса.
     - Редиректни пользователя в защищенную часть приложения.
  d) Если status === "ERROR":
     - Покажи понятную ошибку и кнопку "Повторить вход через UniAuth".

4) Обработка ошибок и безопасность:
- Не логируй token1/token3/application-api-token в production логах.
- Token3 одноразовый: повторный introspect должен давать ERROR.
- Добавь таймауты HTTP-запросов к UniAuth (например 5-10 секунд).
- Добавь обработку сетевых ошибок и fallback-страницу.

5) Подготовка в UniAuth Developers Console:
- Владелец приложения переводит приложение в production.
- Владелец генерирует постоянный API token приложения в разделе Developer Console.
- Этот API token передается во внешний сервис как секрет (env/secret manager).

6) Что вернуть в результате:
- Полный список измененных файлов.
- Код Angular кнопки и сервиса запуска.
- Код NestJS контроллера/сервиса start + callback.
- Пример .env переменных.
- Краткий чеклист ручного тестирования end-to-end.`;

    readonly apiTokenGenerationExample = `POST http://localhost:3001/api/v1/developers-console/applications/:applicationId/api-token/generate
Authorization: Bearer <owner-jwt-in-uniauth>
Body: {}

Response 200:
{
    "applicationId": "...",
    "apiToken": "ua_app_...",
    "tokenType": "Bearer"
}`;

    readonly token1EndpointExample = `POST http://localhost:3001/api/v1/oauth2/sso/issue-token-1
Authorization: Bearer <application-api-token>
Body: {}

Response 200:
{
    "token1": "6f31ae2b2e643e1329139bc30f008593ef06a4f9740f8e55",
    "expiresInSeconds": 1800
}`;

    readonly verifyToken1Example = `POST http://localhost:3001/api/v1/oauth2/sso/verify-token-1
Authorization: Bearer <token2-user-session>
Body:
{
    "token1": "..."
}

Response 200:
{
    "token3": "...",
    "expiresInSeconds": 120,
    "redirectUrl": "https://external-app/callback?token3=..."
}`;

    readonly introspectToken3Example = `POST http://localhost:3001/api/v1/oauth2/sso/introspect-token-3
Authorization: Bearer <application-api-token>
Body:
{
    "token3": "..."
}

Response OK:
{
    "status": "OK",
    "user": {
        "userId": "...",
        "clientId": "...",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "avatarUrl": null
    }
}

Response ERROR:
{
    "status": "ERROR",
    "reason": "Token 3 is invalid or expired"
}`;

    readonly envExample = `UNI_AUTH_API_BASE=http://localhost:3001/api/v1
UNI_AUTH_WEB_BASE=http://localhost:4200
UNI_AUTH_APPLICATION_API_TOKEN=ua_app_xxxxxxxxxxxxxxxxx
UNI_AUTH_CALLBACK_PATH=/auth/uniauth/callback`;

    async copyPrompt(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.promptText);
            this.copyInfoMessage = 'Промт скопирован в буфер обмена.';
        } catch {
            this.copyInfoMessage = 'Не удалось скопировать автоматически. Скопируйте текст вручную из блока ниже.';
        }
    }
}
