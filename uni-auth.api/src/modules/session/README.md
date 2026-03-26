# Session — Bounded Context (Управление сессиями)

## Описание

Bounded Context для отслеживания активных пользовательских сессий, device fingerprinting и управления отзывом сессий.

## Доменная модель

### Aggregate Root: Session

Представляет активную сессию пользователя.

**Свойства:**
- `id` (UUID) — идентификатор сессии
- `userId` — владелец сессии
- `status` — статус: `active`, `revoked`, `expired`
- `ip` — IP-адрес клиента
- `userAgent` — User-Agent браузера
- `deviceFingerprint` — отпечаток устройства
- `expiresAt` — срок действия сессии
- `lastActiveAt` — время последней активности

**Инварианты:**
- Сессия привязана к одному пользователю
- Отозванная сессия не может быть восстановлена
- Истёкшая сессия автоматически инвалидируется

**Методы:**
- `create(props)` — factory, создание новой сессии
- `revoke()` — отзыв сессии
- `touch()` — обновление lastActiveAt
- `isActive()` — проверка активности
- `isExpired()` — проверка истечения

### Repository Interface: ISessionRepository

- `save(session)` — сохранение
- `findById(id)` — поиск по ID
- `findByUserId(userId)` — все сессии пользователя
- `findActiveByUserId(userId)` — только активные сессии
- `deleteExpired()` — очистка истёкших

## API Endpoints

| Метод | URL | Auth | Описание |
|---|---|---|---|
| GET | `/api/v1/sessions` | JWT | Список активных сессий |
| DELETE | `/api/v1/sessions/:id` | JWT | Отзыв конкретной сессии |
| POST | `/api/v1/sessions/revoke-all` | JWT | Отзыв всех сессий |

## Зависимости

- **Импортирует**: —
- **Экспортирует**: `SESSION_REPOSITORY`
