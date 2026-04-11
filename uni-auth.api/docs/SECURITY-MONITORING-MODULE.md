# Security Monitoring Module (UniAuth)

## 1. Назначение

Модуль реализует единый контур безопасности для UniAuth:

- тотальное журналирование HTTP-запросов и HTTP-ответов API;
- базовое IDS/IPS-обнаружение вторжений по сигнатурам и поведенческим правилам;
- активное предотвращение (блокировка) подозрительных/вредоносных запросов;
- e-mail оповещения по подозрительным и предотвращенным событиям;
- отдельный изолированный вход для офицера безопасности (SOC аккаунт);
- API и UI для просмотра всех, подозрительных и предотвращенных логов.

## 2. Где находится модуль

Backend (NestJS):

- Контекст: `src/contexts/audit`
- Сущность лога: `src/contexts/audit/infrastructure/persistence/security-event.orm-entity.ts`
- Сервис IDS/IPS: `src/contexts/audit/application/services/security-monitoring.service.ts`
- Сервис e-mail алертов: `src/contexts/audit/application/services/security-alert-email.service.ts`
- Авторизация безопасника: `src/contexts/audit/application/services/security-officer-auth.service.ts`
- Guard безопасника: `src/contexts/audit/presentation/guards/security-officer.guard.ts`
- Controller API: `src/contexts/audit/presentation/security-monitoring.controller.ts`

Global interception:

- Interceptor: `src/common/interceptors/audit.interceptor.ts`
- Подключение через DI (APP_INTERCEPTOR): `src/app.module.ts`

Frontend (Angular):

- Сервис API мониторинга: `src/app/@core/contexts/security/security-monitoring.service.ts`
- Login безопасника: `src/app/pages/security-monitor/security-officer-login.component.*`
- Dashboard мониторинга: `src/app/pages/security-monitor/security-monitor-dashboard.component.*`
- Маршруты: `src/app/pages/security-monitor/security-monitor.routes.ts`, `src/app.routes.ts`

## 3. Изоляция аккаунта безопасника

Реализованы два уровня изоляции:

1. Отдельная точка входа: `POST /api/v1/security-monitoring/officer/login`.
2. Отдельный JWT-секрет (`SECURITY_OFFICER_JWT_SECRET`), поэтому токен безопасника невалиден для обычных API-маршрутов.
3. Дополнительная защита в обычном логине (`/security/login/initiate`):
   - если идентификатор совпадает с `SECURITY_OFFICER_LOGIN`, вход отклоняется.

Итог: SOC-аккаунт предназначен только для Security Monitoring Console и не используется как обычная IAM-учетка.

## 4. Логирование (тотальное)

Interceptor `AuditInterceptor` перехватывает каждый HTTP-запрос и сохраняет:

- метод и путь;
- query;
- request headers;
- request body;
- response status;
- response body (или payload ошибки);
- длительность запроса;
- IP, user-agent;
- userId (если есть JWT-пользователь);
- requestId (`x-request-id`, если передан).

Для безопасности данных применяется редактирование чувствительных полей (ключи, содержащие `password`, `token`, `authorization`, `secret`, `mfa`, `code`) и ограничение размера сериализованного payload.

## 5. IDS/IPS: обнаружение и предотвращение

### 5.1 Детекторы сигнатур

Проверяются сигнатуры:

- SQL Injection (`union select`, `or 1=1`, `drop table`, и т.п.);
- XSS (`<script>`, `javascript:`, `onerror=`);
- Path Traversal (`../`, `..\\`, URL-encoded варианты);
- Command Injection (`&&`, `||`, `; cat`, `$(...)`, и т.п.);
- Scanner User-Agent (`sqlmap`, `nikto`, `burp`, `nmap`, ...).

### 5.2 Поведенческий детектор brute-force

Для auth-маршрутов учитываются неуспешные попытки (401/403):

- при достижении suspicious порога событие маркируется как `suspicious`;
- при block пороге IP помещается в временный блок;
- дальнейшие запросы с этого IP получают `403` и маркируются как `prevented`.

### 5.3 Категории событий

- `normal` - штатное поведение;
- `suspicious` - детектированы подозрительные признаки;
- `prevented` - запрос/действие заблокировано политикой безопасности.

## 6. E-mail оповещения

Сервис `SecurityAlertEmailService` отправляет уведомления для категорий `suspicious` и `prevented`.

Особенности:

- SMTP-настройка через стандартные SMTP-переменные;
- получатели задаются через `SECURITY_MONITOR_NOTIFICATION_EMAILS` (CSV);
- действует cooldown по повторяющимся событиям (`SECURITY_MONITOR_ALERT_COOLDOWN_SECONDS`), чтобы уменьшить шум.

## 7. API эндпоинты модуля

Базовый префикс: `/api/v1/security-monitoring`

### Публичный вход безопасника

- `POST /officer/login`
  - body: `{ login, password }`
  - ответ: `accessToken`, `tokenType`, `expiresInSeconds`, `login`

### Проверка сессии безопасника

- `GET /officer/session`
  - Bearer: security officer token

### Просмотр логов

- `GET /events`
  - query: `search`, `limit`, `offset`, `from`, `to`, `category`
- `GET /events/suspicious`
- `GET /events/prevented`

### Дашборд/сводка

- `GET /summary?hours=24`

## 8. Переменные окружения

Добавлены в `.env.example`:

- `SECURITY_MONITOR_NOTIFICATION_EMAILS`
- `SECURITY_MONITOR_PREVENT_INTRUSIONS`
- `SECURITY_MONITOR_BLOCK_ON_SIGNATURE`
- `SECURITY_MONITOR_AUTH_FAILURE_WINDOW_SECONDS`
- `SECURITY_MONITOR_AUTH_FAILURE_SUSPICIOUS_THRESHOLD`
- `SECURITY_MONITOR_AUTH_FAILURE_BLOCK_THRESHOLD`
- `SECURITY_MONITOR_AUTH_BLOCK_MINUTES`
- `SECURITY_MONITOR_MAX_SERIALIZED_LENGTH`
- `SECURITY_MONITOR_ALERT_COOLDOWN_SECONDS`
- `SECURITY_OFFICER_LOGIN`
- `SECURITY_OFFICER_PASSWORD`
- `SECURITY_OFFICER_JWT_SECRET`
- `SECURITY_OFFICER_JWT_TTL_SECONDS`

Важно: в production обязательно задать сильные значения `SECURITY_OFFICER_PASSWORD` и `SECURITY_OFFICER_JWT_SECRET`.

## 9. Frontend Security Console

Маршруты UI:

- `GET /security-monitor/login` - отдельный вход безопасника;
- `GET /security-monitor/dashboard` - консоль мониторинга.

Функциональность UI:

- вкладки: все логи / подозрительные / предотвращенные;
- фильтры: поиск, период времени;
- пагинация;
- раскрытие детальных request/response payload;
- агрегированная сводка и top reasons.

Токенизация в UI:

- обычный пользовательский токен хранится отдельно;
- токен безопасника хранится в `uniauth.security_officer_access_token`;
- interceptor добавляет токен безопасника только для `/security-monitoring` API.

## 10. Таблица хранения событий

Таблица: `audit_security_events`

Основные поля:

- `id`, `created_at`
- `category`, `event_type`
- `method`, `request_path`, `query_string`
- `request_headers`, `request_body`
- `response_status`, `response_body`
- `duration_ms`
- `ip_address`, `user_agent`, `user_id`
- `reason_codes`, `request_id`

## 11. Поток обработки запроса

1. Interceptor получает входящий request.
2. IDS/IPS pre-check (`analyzeIncomingRequest`).
3. Если блокировка нужна -> `403` + запись `prevented` + алерт.
4. Если не блокируется -> выполняется бизнес-обработчик.
5. После ответа/ошибки выполняется post-analysis (`analyzeAfterResponse`).
6. Событие сохраняется в БД.
7. При `suspicious`/`prevented` отправляется e-mail (с cooldown).

## 12. Быстрый запуск

1. Установить переменные в `uni-auth.api/.env`:

- SMTP переменные
- Security Monitoring переменные (см. `.env.example`)

2. Запустить backend:

```bash
cd uni-auth.api
npm run start:dev
```

3. Запустить frontend:

```bash
cd UniAuth.WebClient
npm start
```

4. Открыть:

- `http://localhost:4200/security-monitor/login`

## 13. Рекомендации для production

- Вынести логи в отдельное хранилище/архив (SIEM/ELK) по расписанию.
- Настроить отдельный SMTP-почтовый ящик для security alerts.
- Включить reverse-proxy request-id и проксировать real IP.
- Ограничить сетевой доступ к маршрутам мониторинга (VPN/IP allowlist).
- Включить ротацию и аудит доступа безопасников.
- Добавить webhook/Slack/Telegram-канал как второй канал оповещений.

## 14. Ограничения текущей реализации

- IDS основан на сигнатурах и базовой эвристике (не ML/UEBA).
- Блокировка по IP работает в памяти процесса (при горизонтальном scaling лучше Redis/central cache).
- Поддержка сложных корреляций событий (cross-service) не включена.

Это рабочая production-ready база для SOC-мониторинга в рамках текущего сервиса с возможностью дальнейшего расширения.
