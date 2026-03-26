# External System — Bounded Context (Интеграция внешних систем)

## Описание

Bounded Context для интеграции сторонних приложений с UniAuth по протоколу OAuth2. Реализует полный Authorization Code Flow с поддержкой PKCE (Proof Key for Code Exchange) для защиты от перехвата кодов авторизации.

## Доменная модель

### Aggregate Root: ExternalClient

OAuth2 клиент — зарегистрированное внешнее приложение.

**Свойства:**
- `id` (UUID) — внутренний идентификатор
- `name` — название приложения
- `description` — описание
- `credentials` (ClientCredentials VO):
  - `clientId` — публичный идентификатор (формат: `ua_<hex>`)
  - `clientSecretHash` — SHA256 хеш секрета
- `redirectUris` (RedirectUri[] VO) — разрешённые URI перенаправления
- `allowedGrantTypes` (GrantType[] VO) — разрешённые типы грантов
- `allowedScopes` — разрешённые scopes
- `status` — `active`, `revoked`, `suspended`
- `ownerId` — ID пользователя-владельца
- `homepageUrl` — URL домашней страницы приложения
- `logoUrl` — URL логотипа

**Инварианты:**
- `client_id` уникален в системе
- Минимум один redirect_uri обязателен
- Минимум один grant_type обязателен
- Отозванный клиент не может выполнять авторизацию
- `redirect_uri` должен использовать HTTPS (кроме localhost)
- `redirect_uri` не должен содержать фрагменты (#)

**Методы:**
- `register(props)` — factory, регистрация клиента (генерация client_id + client_secret)
- `verifySecret(plainSecret)` — проверка секрета
- `isRedirectUriAllowed(uri)` — валидация redirect_uri
- `isGrantTypeAllowed(grantType)` — проверка типа гранта
- `areScopesAllowed(scopes)` — проверка scopes
- `revoke(userId, reason)` — отзыв клиента
- `update(props)` — обновление метаданных

### Entity: AuthorizationCode

Одноразовый код авторизации OAuth2.

**Свойства:**
- `id` (UUID)
- `codeHash` — SHA256 хеш кода (plain code не хранится)
- `clientDbId` — ID клиента
- `userId` — ID пользователя, выдавшего авторизацию
- `redirectUri` — URI для перенаправления
- `scopes` — запрошенные scopes
- `codeChallenge` — PKCE challenge (опционально)
- `codeChallengeMethod` — метод PKCE (`plain` или `S256`)
- `expiresAt` — срок жизни (10 минут)
- `used` — использован ли код

**Инварианты:**
- Код одноразовый
- Срок жизни 10 минут
- redirect_uri при обмене должен совпадать с исходным
- При наличии PKCE code_verifier обязателен

### Value Objects

- **ClientCredentials** — генерация и верификация client_id/client_secret
- **GrantType** — `authorization_code`, `client_credentials`, `refresh_token`
- **RedirectUri** — валидация URI (HTTPS, без фрагментов, корректный формат)

### Доменные события

- `ClientRegisteredEvent` — клиент зарегистрирован (clientId, name, ownerId)
- `ClientRevokedEvent` — клиент отозван (clientId, reason)
- `AuthorizationGrantedEvent` — авторизация выдана (userId, clientId, scopes)

## CQRS

### Commands
- `RegisterClientCommand` → `RegisterClientHandler` — регистрация OAuth2 клиента
- `RevokeClientCommand` → `RevokeClientHandler` — отзыв клиента
- `AuthorizeCommand` → `AuthorizeHandler` — выдача кода авторизации
- `ExchangeTokenCommand` → `ExchangeTokenHandler` — обмен кода на токены

### Queries
- `GetClientsByOwnerQuery` → `GetClientsByOwnerHandler` — клиенты пользователя
- `GetAllClientsQuery` → `GetAllClientsHandler` — все клиенты (admin)

## OAuth2 Authorization Code Flow

```
┌──────────┐                              ┌──────────────┐                              ┌──────────┐
│  Внешнее │                              │   UniAuth    │                              │  UniAuth │
│  приложен│                              │   Frontend   │                              │    API   │
└────┬─────┘                              └──────┬───────┘                              └────┬─────┘
     │  1. Redirect to /authorize                │                                          │
     │──────────────────────────────────────────>│                                          │
     │                                           │  2. GET /api/v1/oauth2/authorize         │
     │                                           │─────────────────────────────────────────>│
     │                                           │                                          │
     │                                           │  3. Redirect with ?code=xxx&state=yyy    │
     │  4. Callback with code                    │<─────────────────────────────────────────│
     │<──────────────────────────────────────────│                                          │
     │                                           │                                          │
     │  5. POST /api/v1/oauth2/token (code + client_secret)                                │
     │─────────────────────────────────────────────────────────────────────────────────────>│
     │                                           │                                          │
     │  6. { access_token, refresh_token }                                                  │
     │<─────────────────────────────────────────────────────────────────────────────────────│
```

## API Endpoints

### Управление клиентами (JWT required)
| Метод | URL | Auth | Описание |
|---|---|---|---|
| POST | `/api/v1/external-clients` | JWT | Регистрация клиента |
| GET | `/api/v1/external-clients/my` | JWT | Мои клиенты |
| GET | `/api/v1/external-clients` | JWT + admin | Все клиенты |
| DELETE | `/api/v1/external-clients/:id` | JWT | Отзыв клиента |

### OAuth2 Flow
| Метод | URL | Auth | Описание |
|---|---|---|---|
| GET | `/api/v1/oauth2/authorize` | JWT | Авторизация (шаг 1) |
| POST | `/api/v1/oauth2/token` | Public | Обмен кода на токены (шаг 2) |

## Зависимости

- **Импортирует**: `TokenModule` (TOKEN_SERVICE для выпуска токенов)
- **Экспортирует**: `EXTERNAL_CLIENT_REPOSITORY`
