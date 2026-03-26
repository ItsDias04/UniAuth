# Auth — Bounded Context (Аутентификация)

## Описание

Bounded Context, отвечающий за аутентификацию пользователей: обработку входа/выхода, проверку учётных данных, защиту от brute-force атак и интеграцию с MFA.

## Доменная модель

### Entity: LoginAttempt

Запись о попытке входа в систему.

**Свойства:**
- `id` (UUID)
- `userId` — идентификатор пользователя (nullable для неудачных попыток)
- `email` — email, использованный при входе
- `status` — статус попытки:
  - `success` — успешный вход
  - `failed_credentials` — неверные учётные данные
  - `failed_mfa` — неверный MFA код
  - `blocked` — заблокированный IP
  - `locked` — заблокированный аккаунт
- `ip` — IP-адрес клиента
- `userAgent` — User-Agent браузера

### Domain Service: AuthenticationDomainService

Доменный сервис координации аутентификации.

**Методы:**
- `isMfaRequired(user)` — проверка необходимости MFA
- `isIpBlocked(ip, userId)` — проверка блокировки IP по количеству неудачных попыток

### Доменные события

- `LoginSucceededEvent` — успешный вход (userId, ip, userAgent)
- `LoginFailedEvent` — неудачный вход (email, reason, ip)

## CQRS

### Commands
- `LoginCommand` → `LoginHandler` — обработка входа:
  1. Поиск пользователя по email
  2. Проверка статуса и блокировки
  3. Проверка пароля
  4. Проверка MFA (если включён)
  5. Выпуск токенов
- `LogoutCommand` → `LogoutHandler` — отзыв refresh token

## API Endpoints

| Метод | URL | Auth | Описание |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Вход |
| POST | `/api/v1/auth/logout` | JWT | Выход |

## Зависимости

- **Импортирует**: `IdentityModule` (USER_REPOSITORY), `TokenModule` (TOKEN_SERVICE)
- **Экспортирует**: `LOGIN_ATTEMPT_REPOSITORY`
