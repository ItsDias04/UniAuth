# UniAuth — Identity Provider

Корпоративный провайдер идентификации (Identity Provider) с поддержкой многофакторной аутентификации (MFA) и интеграции внешних систем по протоколу OAuth2.

## Архитектура

Проект построен по принципам **Domain-Driven Design (DDD)** с применением паттернов **CQRS**, **Event Sourcing** (доменные события) и **Гексагональной архитектуры** (Ports & Adapters).

### Стек технологий

| Компонент | Технология |
|---|---|
| **Backend API** | NestJS 11 (TypeScript) |
| **Frontend** | Angular 20 + PrimeNG 20 + Tailwind CSS 4 |
| **БД** | PostgreSQL 16 |
| **Кэш / Sessions** | Redis 7 |
| **ORM** | TypeORM 0.3 |
| **CQRS** | @nestjs/cqrs 11 |
| **Аутентификация** | JWT (Passport), TOTP (otplib) |
| **Контейнеризация** | Docker Compose |

### Структура проекта

```
UniAuth/
├── uni-auth.api/          # Backend API (NestJS)
│   ├── src/
│   │   ├── common/        # Shared Kernel (базовые классы, guards, interceptors)
│   │   └── modules/
│   │       ├── identity/          # BC: Управление пользователями
│   │       ├── auth/              # BC: Аутентификация
│   │       ├── mfa/               # BC: Многофакторная аутентификация
│   │       ├── token/             # BC: Управление токенами
│   │       ├── session/           # BC: Управление сессиями
│   │       ├── audit/             # BC: Аудит и журналирование
│   │       └── external-system/   # BC: Интеграция внешних систем
│   ├── docker-compose.yml
│   └── Dockerfile
│
└── UniAuth.WebClient/     # Frontend (Angular)
    └── src/
        ├── app/
        │   ├── layout/            # Компоненты layout (topbar, sidebar, footer)
        │   ├── guards/            # Route guards (authGuard)
        │   ├── interceptors/      # HTTP interceptors (JWT)
        │   └── pages/
        │       ├── auth/          # Вход, регистрация, MFA
        │       ├── external-systems/  # Управление внешними системами
        │       ├── dashboard/     # Дашборд
        │       └── service/       # Angular сервисы (AuthService, ExternalSystemService)
        └── environments/          # Конфигурация окружения
```

## Bounded Contexts

### 1. Identity (Управление идентичностью)

Центральный BC, отвечающий за регистрацию, хранение и управление учётными записями пользователей.

- **Aggregate Root**: `User` (email, статус, роли, MFA-флаг, блокировка)
- **Entities**: `Role` (с permissions)
- **Value Objects**: `Email`, `PasswordHash` (scrypt), `UniqueId`
- **Events**: `UserRegisteredEvent`, `UserBlockedEvent`

### 2. Auth (Аутентификация)

Обработка входа/выхода с защитой от brute-force атак.

- **Entity**: `LoginAttempt` (статус, IP, user-agent)
- **Domain Service**: `AuthenticationDomainService` (проверка MFA, блокировка IP)
- **Events**: `LoginSucceededEvent`, `LoginFailedEvent`

### 3. MFA (Многофакторная аутентификация)

Поддержка TOTP (Google Authenticator), SMS, Email, Push.

- **Aggregate Root**: `MfaDevice` (тип, секрет, backup-коды, статус верификации)
- **Value Objects**: `MfaType`, `MfaChallenge`
- **Events**: `MfaEnabledEvent`, `MfaVerifiedEvent`, `MfaFailedEvent`

### 4. Token (Управление токенами)

Выпуск, ротация и отзыв JWT Access / Refresh токенов.

- **Service Interface**: `ITokenService` (issueTokenPair, refreshTokens, revokeRefreshToken)
- **Implementation**: `JwtTokenService` (access 15 мин, refresh 7 дней, rotation)
- **Events**: `TokenIssuedEvent`, `TokenRevokedEvent`

### 5. Session (Управление сессиями)

Отслеживание активных сессий, device fingerprinting, отзыв.

- **Aggregate Root**: `Session` (userId, IP, userAgent, fingerprint, expiry)

### 6. Audit (Аудит)

Кросс-модульное журналирование всех доменных событий.

- **Entity**: `AuditLogEntry` (action, severity, userId, IP, details JSONB)
- **Event Handlers**: 7 обработчиков, подписанных на события других BC

### 7. External System (Интеграция внешних систем)

OAuth2 Authorization Code Flow с поддержкой PKCE для интеграции сторонних приложений.

- **Aggregate Root**: `ExternalClient` (client_id, secret, redirect_uris, grant_types, scopes)
- **Entity**: `AuthorizationCode` (код авторизации с PKCE и сроком жизни)
- **Value Objects**: `ClientCredentials`, `GrantType`, `RedirectUri`
- **Events**: `ClientRegisteredEvent`, `ClientRevokedEvent`, `AuthorizationGrantedEvent`

## API Endpoints

### Аутентификация
| Метод | Эндпоинт | Описание |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Вход в систему |
| `POST` | `/api/v1/auth/logout` | Выход из системы |

### Пользователи
| Метод | Эндпоинт | Описание |
|---|---|---|
| `POST` | `/api/v1/users/register` | Регистрация |
| `GET` | `/api/v1/users/me` | Профиль текущего пользователя |
| `GET` | `/api/v1/users/:id` | Получение пользователя (admin) |
| `POST` | `/api/v1/users/:id/block` | Блокировка пользователя (admin) |

### MFA
| Метод | Эндпоинт | Описание |
|---|---|---|
| `POST` | `/api/v1/mfa/totp/setup` | Настройка TOTP |
| `POST` | `/api/v1/mfa/totp/verify` | Верификация TOTP кода |

### Токены
| Метод | Эндпоинт | Описание |
|---|---|---|
| `POST` | `/api/v1/token/refresh` | Обновление access token |

### Сессии
| Метод | Эндпоинт | Описание |
|---|---|---|
| `GET` | `/api/v1/sessions` | Список активных сессий |
| `DELETE` | `/api/v1/sessions/:id` | Отзыв сессии |
| `POST` | `/api/v1/sessions/revoke-all` | Отзыв всех сессий |

### Аудит
| Метод | Эндпоинт | Описание |
|---|---|---|
| `GET` | `/api/v1/audit` | Журнал событий (admin) |
| `GET` | `/api/v1/audit/user/:userId` | События пользователя |
| `GET` | `/api/v1/audit/action/:action` | События по типу действия |

### Внешние системы (OAuth2)
| Метод | Эндпоинт | Описание |
|---|---|---|
| `POST` | `/api/v1/external-clients` | Регистрация OAuth2 клиента |
| `GET` | `/api/v1/external-clients/my` | Мои клиенты |
| `GET` | `/api/v1/external-clients` | Все клиенты (admin) |
| `DELETE` | `/api/v1/external-clients/:id` | Отзыв клиента |
| `GET` | `/api/v1/oauth2/authorize` | Авторизация (Authorization Code Flow) |
| `POST` | `/api/v1/oauth2/token` | Обмен кода на токены |

## Запуск

### Предварительные требования

- Node.js 18+
- Docker & Docker Compose
- npm или yarn

### Backend API

```bash
cd uni-auth.api

# Установка зависимостей
npm install

# Запуск PostgreSQL и Redis через Docker
docker-compose up -d postgres redis

# Запуск в режиме разработки
npm run start:dev
```

API будет доступен на `http://localhost:3000/api/v1`.

### Frontend (WebClient)

```bash
cd UniAuth.WebClient

# Установка зависимостей
npm install

# Запуск dev-сервера
ng serve
```

Клиент будет доступен на `http://localhost:4200`.

### Docker (полный стек)

```bash
cd uni-auth.api
docker-compose up --build
```

## Переменные окружения

| Переменная | Значение по умолчанию | Описание |
|---|---|---|
| `NODE_ENV` | `development` | Окружение |
| `PORT` | `3000` | Порт API |
| `DB_HOST` | `localhost` | Хост PostgreSQL |
| `DB_PORT` | `5432` | Порт PostgreSQL |
| `DB_USER` | `postgres` | Пользователь БД |
| `DB_PASS` | `postgres` | Пароль БД |
| `DB_NAME` | `unicauth` | Имя базы данных |
| `REDIS_HOST` | `127.0.0.1` | Хост Redis |
| `REDIS_PORT` | `6379` | Порт Redis |
| `JWT_ACCESS_SECRET` | — | Секрет access token |
| `JWT_REFRESH_SECRET` | — | Секрет refresh token |
| `JWT_ACCESS_TTL` | `900` | TTL access token (сек) |
| `JWT_REFRESH_TTL` | `604800` | TTL refresh token (сек) |
| `CORS_ORIGIN` | `http://localhost:4200` | Разрешённый origin |

## Безопасность

- **Пароли**: хеширование через `scrypt` с солью
- **JWT**: access (15 мин) + refresh (7 дней) с rotation
- **MFA**: TOTP (RFC 6238) через `otplib`
- **Brute-force**: ограничение попыток входа, блокировка аккаунта
- **Rate Limiting**: скользящее окно через Redis
- **OAuth2**: Authorization Code Flow с PKCE
- **CORS**: настраиваемый origin
- **Аудит**: полное журналирование всех действий

## Лицензия

MIT
