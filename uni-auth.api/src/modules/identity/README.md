# Identity — Bounded Context (Управление идентичностью)

## Описание

Центральный Bounded Context системы UniAuth. Отвечает за регистрацию, хранение и управление учётными записями пользователей и их ролями. Является основой для всех остальных контекстов.

## Доменная модель

### Aggregate Root: User

Корень агрегата, представляющий пользователя системы.

**Свойства:**
- `id` (UUID) — уникальный идентификатор
- `email` (Email VO) — адрес электронной почты (уникален)
- `passwordHash` (PasswordHash VO) — хеш пароля (scrypt с солью)
- `displayName` — отображаемое имя
- `status` — статус: `active`, `blocked`, `pending_verification`, `deactivated`
- `roles` — набор ролей пользователя
- `mfaEnabled` — флаг активации MFA
- `failedLoginAttempts` — счётчик неудачных попыток входа
- `lastLoginAt` — дата последнего входа
- `lockedUntil` — блокировка до определённого времени

**Инварианты:**
- Email уникален в системе
- Пароль хешируется при создании (scrypt, salt 16 bytes)
- Заблокированный пользователь не может войти
- Превышение лимита попыток входа ведёт к временной блокировке

**Методы:**
- `register(id, email, password, displayName, ip)` — factory, регистрация нового пользователя
- `block(reason)` — блокировка
- `activate()` — активация
- `recordFailedLogin()` — запись неудачной попытки
- `recordSuccessfulLogin()` — запись успешного входа
- `verifyPassword(plainPassword)` — проверка пароля

### Entity: Role

Роль пользователя с набором разрешений.

**Свойства:**
- `id` (UUID)
- `name` — имя роли (например `admin`, `user`)
- `description` — описание
- `permissions` — массив разрешений

### Value Objects

- **Email** — валидация формата email, нормализация (lowercase, trim)
- **PasswordHash** — хеширование пароля через scrypt, проверка сложности (мин. 8 символов, буквы + цифры)
- **UniqueId** — генерация UUID v4

### Доменные события

- `UserRegisteredEvent` — пользователь зарегистрирован (userId, email, ip)
- `UserBlockedEvent` — пользователь заблокирован (userId, reason)

## CQRS

### Commands
- `RegisterUserCommand` → `RegisterUserHandler` — регистрация
- `BlockUserCommand` → `BlockUserHandler` — блокировка

### Queries
- `GetUserQuery` → `GetUserHandler` — получение пользователя по ID

## API Endpoints

| Метод | URL | Auth | Описание |
|---|---|---|---|
| POST | `/api/v1/users/register` | Public | Регистрация |
| GET | `/api/v1/users/me` | JWT | Текущий профиль |
| GET | `/api/v1/users/:id` | JWT + admin | Пользователь по ID |
| POST | `/api/v1/users/:id/block` | JWT + admin | Блокировка |

## Зависимости

- **Экспортирует**: `USER_REPOSITORY` (используется в Auth, MFA)
- **Импортирует**: —
