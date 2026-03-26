# Token — Bounded Context (Управление токенами)

## Описание

Bounded Context, отвечающий за выпуск, ротацию, валидацию и отзыв JWT-токенов. Реализует паттерн Refresh Token Rotation для повышенной безопасности.

## Доменная модель

### Service Interface: ITokenService

Контракт (порт) для работы с токенами.

**Методы:**
- `issueTokenPair(payload: TokenPayload)` → `TokenPair` — выпуск пары access + refresh
- `refreshTokens(refreshToken: string)` → `TokenPair` — обновление с ротацией
- `revokeRefreshToken(refreshToken: string)` — отзыв refresh token
- `revokeAllUserTokens(userId: string)` — отзыв всех токенов пользователя
- `verifyAccessToken(token: string)` — валидация access token

### TokenPayload

- `sub` — ID пользователя
- `email` — email
- `roles` — массив ролей
- Расширяемый через `[key: string]: any`

### TokenPair

- `accessToken` — JWT (short-lived, 15 мин по умолчанию)
- `refreshToken` — UUID-based (long-lived, 7 дней)
- `idToken` — (опционально) OpenID Connect ID Token
- `expiresIn` — TTL в секундах
- `tokenType` — `Bearer`

### Implementation: JwtTokenService

- Access Token: JWT, подписан `JWT_ACCESS_SECRET`, TTL из конфига
- Refresh Token: случайный UUID, хеш SHA256 хранится в БД
- Ротация: при refresh старый токен инвалидируется, выпускается новый
- Таблица `refresh_tokens` хранит: tokenHash, userId, deviceInfo, expiresAt, revoked

### Доменные события

- `TokenIssuedEvent` — токены выпущены (userId, tokenType)
- `TokenRevokedEvent` — токен отозван (userId, reason)

## API Endpoints

| Метод | URL | Auth | Описание |
|---|---|---|---|
| POST | `/api/v1/token/refresh` | Public | Обновление access token |

## Зависимости

- **Импортирует**: —
- **Экспортирует**: `TOKEN_SERVICE`, `JwtModule`
