# Audit — Bounded Context (Аудит и журналирование)

## Описание

Кросс-модульный Bounded Context для сбора, хранения и анализа событий аудита. Подписывается на доменные события всех остальных контекстов и сохраняет их в журнал.

## Доменная модель

### Entity: AuditLogEntry

Запись в журнале аудита.

**Свойства:**
- `id` (UUID)
- `action` — тип действия (enum):
  - `user_registered` — регистрация пользователя
  - `user_blocked` — блокировка
  - `login_success` — успешный вход
  - `login_failed` — неудачный вход
  - `mfa_enabled` — активация MFA
  - `mfa_verified` — верификация MFA
  - `mfa_failed` — неудачная MFA-проверка
  - `token_issued` — выпуск токена
  - `token_revoked` — отзыв токена
  - `client_registered` — регистрация OAuth2 клиента
  - `client_revoked` — отзыв клиента
- `severity` — уровень: `info`, `warning`, `critical`
- `userId` — ID пользователя (nullable)
- `ip` — IP-адрес
- `userAgent` — User-Agent
- `details` — JSONB с дополнительными данными
- `createdAt` — время события

### Repository Interface: IAuditLogRepository

- `save(entry)` — сохранение записи
- `findByUserId(userId)` — записи пользователя
- `findByAction(action)` — записи по типу действия
- `findAll(options)` — все записи с пагинацией и фильтрацией

## Event Handlers

Модуль содержит 7 обработчиков доменных событий:

| Обработчик | Событие | Severity |
|---|---|---|
| `UserRegisteredAuditHandler` | `UserRegisteredEvent` | info |
| `UserBlockedAuditHandler` | `UserBlockedEvent` | warning |
| `LoginSucceededAuditHandler` | `LoginSucceededEvent` | info |
| `LoginFailedAuditHandler` | `LoginFailedEvent` | warning |
| `MfaEnabledAuditHandler` | `MfaEnabledEvent` | info |
| `MfaVerifiedAuditHandler` | `MfaVerifiedEvent` | info |
| `MfaFailedAuditHandler` | `MfaFailedEvent` | warning |

## API Endpoints

| Метод | URL | Auth | Описание |
|---|---|---|---|
| GET | `/api/v1/audit` | JWT + admin | Полный журнал |
| GET | `/api/v1/audit/user/:userId` | JWT + admin | Журнал пользователя |
| GET | `/api/v1/audit/action/:action` | JWT + admin | Журнал по типу |

## Зависимости

- **Импортирует**: `CqrsModule` (подписка на события)
- **Экспортирует**: `AUDIT_LOG_REPOSITORY`
