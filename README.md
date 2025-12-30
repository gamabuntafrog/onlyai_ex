# OnlyAI - Асинхронна AI-фіча для аналізу особистості

Backend застосунок для асинхронного аналізу особистості з використанням OpenAI API. Застосунок реалізований на Node.js з TypeScript, використовує Hono framework, PostgreSQL для зберігання користувачів, Redis для тимчасового зберігання стану аналізу, та QStash для асинхронної обробки завдань.

## 🚀 Основні можливості

- ✅ Асинхронна обробка аналізу через QStash
- ✅ Зберігання стану аналізу в Redis з автоматичним TTL
- ✅ JWT авторизація з refresh tokens
- ✅ Валідація даних через Zod
- ✅ Структурована обробка помилок
- ✅ Idempotency для захисту від дублікатів
- ✅ Retry logic для OpenAI API
- ✅ TypeScript з повною типобезпекою

## 📋 Технологічний стек

- **Framework**: [Hono](https://hono.dev/) - швидкий web framework для Node.js
- **Runtime**: Node.js 22+
- **Language**: TypeScript
- **Database**: PostgreSQL 16+ з Sequelize ORM
- **Cache/State**: Redis (Upstash) для тимчасового зберігання стану
- **Queue**: QStash (Upstash) для асинхронної обробки
- **AI**: OpenAI API для генерації аналізу
- **Validation**: Zod для runtime валідації
- **Logging**: Pino для структурованого логування

## 🏗️ Архітектура

Проект організований за принципом шарової архітектури:

```
Controllers → Services → Repositories/Stores → Database/External APIs
```

Детальну документацію архітектури дивіться в [ARCHITECTURE_DOC.md](./ARCHITECTURE_DOC.md)

## 📁 Структура проекту

```
src/
├── adapters/          # Адаптери для зовнішніх сервісів (Redis)
├── config/           # Конфігурація застосунку
├── constants/        # Константи (коди помилок)
├── controllers/      # HTTP контролери
├── db/              # База даних (моделі, міграції)
├── errors/          # Кастомні класи помилок
├── helpers/         # Допоміжні функції
├── integrations/    # Інтеграції (OpenAI, QStash)
├── middleware/      # Middleware (auth, CORS, error handling)
├── mappers/         # Маппінг та валідація даних
├── repositories/    # Репозиторії для доступу до БД
├── routes/          # Маршрути API
├── services/        # Бізнес-логіка
├── stores/          # Domain stores (AnalysisStateStore)
├── types/           # TypeScript типи
├── utilities/       # Утиліти (logger)
└── validators/      # Zod схеми валідації
```

## 🛠️ Встановлення та запуск

### Вимоги

- Node.js >= 22.0.0
- npm >= 10.0.0
- PostgreSQL 16+ (або Docker)
- Redis (Upstash або локальний)
- QStash (Upstash)

### Крок 1: Клонування репозиторію

```bash
git clone <repository-url>
cd onlyai_ex
```

### Крок 2: Встановлення залежностей

```bash
npm install
```

### Крок 3: Налаштування environment variables

Створіть файл `.env` в корені проекту:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/palz
# Або окремо:
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=palz
POSTGRES_SSL=false

# JWT
JWT_SECRET=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-secret-refresh-key-change-in-production

# Logger
LOG_LEVEL=debug

# CORS
FRONTEND_ORIGIN=http://localhost:3001

# Redis (Upstash)
REDIS_URL=https://your-redis.upstash.io
REDIS_TOKEN=your-redis-token

# QStash (Upstash)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-current-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Base URL для webhook (для production)
BASE_URL=https://your-domain.com
```

### Крок 4: Запуск інфраструктури (Docker)

```bash
# Запуск PostgreSQL
npm run docker:infra:up

# Зупинка
npm run docker:infra:down
```

Або встановіть PostgreSQL локально та налаштуйте підключення.

### Крок 5: Запуск міграцій

```bash
npm run migrate
```

### Крок 6: Запуск сервера

```bash
# Development режим (з hot reload)
npm run dev

# Production режим
npm run build
npm start
```

Сервер буде доступний на `http://localhost:3000`

## 📚 API Документація

### Авторизація

#### Реєстрація користувача
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Логін
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Оновлення токенів
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Аналіз

#### Створення аналізу
```http
POST /api/analyze
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "John Doe",
  "age": 30,
  "description": "A detailed description of the person"
}
```

**Відповідь:**
```json
{
  "requestId": "uuid-string"
}
```

#### Отримання статусу аналізу
```http
GET /api/analyze/:requestId
Authorization: Bearer {accessToken}
```

**Відповідь:**
```json
{
  "requestId": "uuid-string",
  "userId": "uuid-string",
  "status": "done",
  "input": {
    "name": "John Doe",
    "age": 30,
    "description": "A detailed description"
  },
  "result": "Generated personality summary...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Статуси:**
- `queued` - аналіз в черзі
- `processing` - аналіз обробляється
- `done` - аналіз завершено (містить `result`)
- `error` - сталася помилка (містить `error`)

### Користувач

#### Отримання поточного користувача
```http
GET /api/users/me
Authorization: Bearer {accessToken}
```

Детальну документацію API дивіться в [FRONTEND_API_DOCS.md](./FRONTEND_API_DOCS.md)

## 🔄 Флоу обробки аналізу

1. **Користувач відправляє дані** → `POST /api/analyze`
2. **Валідація даних** через Zod
3. **Створення requestId** (UUID)
4. **Збереження стану** в Redis зі статусом `queued`
5. **Публікація завдання** в QStash з затримкою
6. **Миттєва відповідь** користувачу з `requestId`
7. **QStash викликає webhook** через заданий час
8. **Отримання блокування** (idempotency)
9. **Оновлення статусу** на `processing`
10. **Виклик OpenAI API** з retry logic
11. **Збереження результату** зі статусом `done` або `error`
12. **Користувач отримує результат** через `GET /api/analyze/:requestId`

## 🐳 Docker

### Запуск з Docker Compose

```bash
# Запуск всіх сервісів
docker-compose up -d

# Перегляд логів
docker-compose logs -f api

# Зупинка
docker-compose down
```

### Збірка Docker образу

```bash
docker build -t onlyai-backend .
```

## 📝 Скрипти

```bash
# Development
npm run dev              # Запуск з hot reload

# Build
npm run build           # Компіляція TypeScript

# Production
npm start               # Запуск скомпільованого коду

# Database
npm run migrate         # Запуск міграцій
npm run migrate:rollback # Відкат останньої міграції
npm run migrate:status  # Статус міграцій
npm run migrate:create  # Створення нової міграції

# Code Quality
npm run lint            # Перевірка коду
npm run lint:fix        # Автоматичне виправлення
npm run format          # Форматування коду
npm run format:check    # Перевірка форматування
npm run typecheck       # Перевірка типів TypeScript

# Docker
npm run docker:infra:up   # Запуск інфраструктури
npm run docker:infra:down # Зупинка інфраструктури
```

## 🔒 Безпека

- JWT токени для авторизації
- Хешування паролів через bcrypt
- Валідація всіх вхідних даних через Zod
- Перевірка підписів QStash webhook
- CORS налаштування
- Захист від SQL injection через Sequelize
- Environment variables для секретів

## 📊 Моніторинг

### Health Check

```http
GET /health
```

**Відповідь:**
```json
{
  "success": true,
  "message": "Server is running"
}
```

## 🐛 Обробка помилок

Всі помилки повертаються у структурованому форматі:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Коди помилок дивіться в `src/constants/errorCodes.ts`

## 🚀 Deployment

### Railway

Проект налаштований для deployment на Railway. Файл `railway.json` містить конфігурацію.

### Environment Variables для Production

Переконайтеся, що всі змінні оточення налаштовані в вашому хостинг-провайдері:

- `DATABASE_URL` - URL PostgreSQL бази даних
- `REDIS_URL` та `REDIS_TOKEN` - Upstash Redis
- `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` - QStash
- `OPENAI_API_KEY` - OpenAI API ключ
- `JWT_SECRET` та `REFRESH_TOKEN_SECRET` - Секрети для JWT
- `BASE_URL` - URL вашого сервера (для webhook)

## 📖 Додаткова документація

- [Архітектура проекту](./ARCHITECTURE_DOC.md) - детальний опис архітектурних рішень
- [API Документація](./FRONTEND_API_DOCS.md) - повна документація API
- [Frontend Prompt](./FRONTEND_PROMPT.md) - інструкції для створення фронтенду
- [Frontend Types](./FRONTEND_TYPES.ts) - TypeScript типи для фронтенду

## 🤝 Contributing

1. Fork проекту
2. Створіть feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit зміни (`git commit -m 'Add some AmazingFeature'`)
4. Push до branch (`git push origin feature/AmazingFeature`)
5. Відкрийте Pull Request

### Commit Convention

Проект використовує [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - нова функція
- `fix:` - виправлення бага
- `docs:` - зміни в документації
- `style:` - форматування коду
- `refactor:` - рефакторинг
- `test:` - додавання тестів
- `chore:` - зміни в build процесі або інструментах

## 📄 Ліцензія

ISC

## 👤 Автор

[Ваше ім'я]

## 🙏 Подяки

- [Hono](https://hono.dev/) - швидкий web framework
- [Upstash](https://upstash.com/) - managed Redis та QStash
- [OpenAI](https://openai.com/) - AI API
