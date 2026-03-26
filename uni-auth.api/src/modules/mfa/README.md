# MFA — Bounded Context (Многофакторная аутентификация)

## Описание

Bounded Context, реализующий поддержку многофакторной аутентификации. Поддерживает несколько типов MFA: TOTP (Time-based One-Time Password), SMS, Email, Push-уведомления.

## Доменная модель

### Aggregate Root: MfaDevice

Устройство / канал MFA, привязанное к пользователю.

**Свойства:**
- `id` (UUID)
- `userId` — владелец устройства
- `type` (MfaType VO) — тип MFA: `TOTP`, `SMS`, `EMAIL`, `PUSH`
- `secret` — секрет для генерации кодов (TOTP)
- `verified` — подтверждено ли устройство
- `backupCodes` — резервные коды для восстановления доступа
- `lastUsedAt` — дата последнего использования

**Инварианты:**
- У пользователя может быть только одно активное устройство каждого типа
- Устройство должно быть верифицировано перед использованием
- Backup-коды одноразовые

**Методы:**
- `setupTotp(id, userId)` — factory, создание TOTP-устройства с генерацией секрета
- `verify(code)` — верификация кода
- `useBackupCode(code)` — использование backup-кода
- `disable()` — отключение устройства

### Value Objects

- **MfaType** — перечисление типов MFA (`TOTP`, `SMS`, `EMAIL`, `PUSH`)
- **MfaChallenge** — вызов MFA с challengeId, userId и сроком жизни

### Доменные события

- `MfaEnabledEvent` — MFA активирован для пользователя (userId, type)
- `MfaVerifiedEvent` — успешная верификация MFA-кода (userId, deviceId)
- `MfaFailedEvent` — неудачная верификация кода (userId, reason)

## CQRS

### Commands
- `SetupTotpCommand` → `SetupTotpHandler` — настройка TOTP:
  1. Генерация секрета (otplib)
  2. Создание QR-кода для Google Authenticator
  3. Генерация backup-кодов (10 штук)
  4. Сохранение MfaDevice
- `VerifyTotpCommand` → `VerifyTotpHandler` — проверка TOTP-кода

## Инфраструктура

- **MfaDeviceRepository** — TypeORM (PostgreSQL)
- **RedisMfaChallengeStore** — Redis для хранения MFA challenges (TTL 5 мин)

## API Endpoints

| Метод | URL | Auth | Описание |
|---|---|---|---|
| POST | `/api/v1/mfa/totp/setup` | JWT | Настройка TOTP |
| POST | `/api/v1/mfa/totp/verify` | JWT | Верификация кода |

## Зависимости

- **Импортирует**: `IdentityModule` (USER_REPOSITORY)
- **Экспортирует**: `MFA_DEVICE_REPOSITORY`, `MFA_CHALLENGE_STORE`
