# Документація архітектури Backend застосунку

## Технічне завдання та вимоги

### Основна ідея
Реалізація асинхронної AI-фічі, де:
- Користувач відправляє дані для аналізу
- Аналіз не виконується одразу, а запускається асинхронно
- Результат стає доступним пізніше по `requestId`

### Ключові вимоги з ТЗ

1. **POST /analyze** - приймає дані форми, валідує, створює `requestId`, зберігає стан, відправляє відкладене завдання
2. **Храніння стану** - Redis (Upstash) як тимчасове сховище з TTL
3. **Асинхронна обробка** - QStash (Upstash) для відкладених webhook викликів
4. **GET /analyze/:requestId** - повертає поточний статус та результат
5. **AI-інтеграція** - OpenAI API тільки на бекенді, обробка помилок
6. **Framework** - обов'язково Hono

## Реалізація флоу згідно ТЗ

### Основний флоу обробки аналізу

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Користувач відправляє дані                               │
│    POST /api/analyze                                         │
│    { name, age, description }                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Валідація даних (Zod)                                    │
│    - Перевірка обов'язкових полів                           │
│    - Перевірка типів та форматів                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Створення requestId (UUID)                               │
│    Генерація унікального ідентифікатора                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Збереження стану в Redis                                 │
│    Ключ: analysis:{requestId}                               │
│    Значення: { requestId, status: "queued", input, ... }    │
│    TTL: 3600 секунд (1 година)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Публікація відкладеного завдання в QStash                │
│    URL: /webhooks/qstash/analyze                            │
│    Payload: { requestId }                                    │
│    Затримка: 10 секунд (для тестування)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Відповідь користувачу                                    │
│    { requestId }                                             │
│    ⚡ Миттєва відповідь, без очікування AI                   │
└─────────────────────────────────────────────────────────────┘

                    [Асинхронна обробка]

┌─────────────────────────────────────────────────────────────┐
│ 7. QStash викликає webhook (через 10 секунд)                │
│    POST /webhooks/qstash/analyze                            │
│    { requestId }                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Перевірка підпису QStash                                 │
│    Middleware: verifyQStashSignature                         │
│    Захист від несанкціонованих запитів                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Отримання блокування (Idempotency)                       │
│    Redis SETNX lock:analysis:{requestId}                    │
│    Захист від дубльованих запитів webhook                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Оновлення статусу                                        │
│     status: "queued" → "processing"                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. Виклик OpenAI API                                        │
│     - Retry logic (3 спроби з exponential backoff)          │
│     - Обробка помилок (rate limit, timeout, etc.)           │
│     - Валідація відповіді                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 12. Збереження результату або помилки                         │
│     status: "processing" → "done" або "error"                │
│     Збереження в Redis з оновленням TTL                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 13. Звільнення блокування                                    │
│     Видалення lock:analysis:{requestId}                      │
└─────────────────────────────────────────────────────────────┘

                    [Отримання результату]

┌─────────────────────────────────────────────────────────────┐
│ 14. Користувач запитує статус                                │
│     GET /api/analyze/:requestId                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 15. Завантаження стану з Redis                               │
│     Повернення статусу та результату (якщо готово)          │
└─────────────────────────────────────────────────────────────┘
```

## Архітектурні рішення та їх обґрунтування через призму ТЗ

### 1. Layered Architecture - структура серверу

**Реалізація:**
```
Controllers → Services → Repositories/Stores → External Services
```

**Чому саме такий підхід:**
- **Шарова архітектура забезпечує чітку структуру без надмірної складності**
- **Розділення відповідальності**: 
  - `Controllers` - обробка HTTP, валідація
  - `Services` - бізнес-логіка, координація
  - `Stores/Repositories` - зберігання стану
- **Тестованість**: Кожен шар можна тестувати незалежно, що критично для асинхронного флоу

### 2. Hono Framework

**Вимога з ТЗ:** "Бекенд - обов'язково Hono"

**Реалізація відповідно до ТЗ:**
```typescript
// POST /analyze - відповідає вимозі ТЗ
app.post("/analyze", authenticate, ...analyzeController.createAnalysis);

// GET /analyze/:requestId - відповідає вимозі ТЗ
app.get("/analyze/:requestId", authenticate, ...analyzeController.getAnalysis);

// Webhook для QStash - відповідає вимозі ТЗ
app.post("/webhooks/qstash/analyze", verifyQStashSignature, ...webhookController.handleAnalyzeWebhook);
```

### 3. Redis як тимчасове сховище стану - відповідно до ТЗ

**Приклад реалізації в AnalysisStateStore:**

```typescript
class AnalysisStateStore {
  // Зберігання стану з TTL 
  async createQueued(requestId, userId, input) {
    await this.redis.set(key, state, { ex: 3600 }); // TTL 1 година
  }
  
  // Оновлення статусу
  async markProcessing(requestId) { ... }
  async markDone(requestId, result) { ... }
  async markError(requestId, errorDetails) { ... }
}
```

**Upstash Managed Redis без необхідності налаштування інфраструктури**

### 4. QStash для асинхронної обробки - відповідно до ТЗ

**Реалізація:**

```typescript
await qstashService.publishDelayedJob(webhookUrl, { requestId }, 10);

// Webhook обробник
app.post("/webhooks/qstash/analyze", verifyQStashSignature, ...webhookController.handleAnalyzeWebhook);
```

**Чому саме QStash:**
- **Надійність**: Гарантована доставка webhook навіть при тимчасових збоях (критично для асинхронного флоу)
- **Retry**: Автоматичні повторні спроби при збоях
- **Delay**: Вбудована підтримка відкладених завдань без необхідності власного scheduler
- **Upstash**: Managed сервіс, не потрібна інфраструктура

**Альтернативи та чому не використані:**
- **Cron jobs**: Не забезпечують гарантовану доставку
- **RabbitMQ/SQS**: Overkill для простої відкладеної обробки

**Відповідність ТЗ:**
- ✅ Асинхронний підхід (не викликає AI одразу)
- ✅ Відкладений виклик через webhook
- ✅ QStash як рекомендоване 

### 5. Idempotency через Redis Locks - захист від дублікатів

**Проблема:** QStash може надіслати webhook двічі через retry logic

**Рішення:**
```typescript
// Отримання блокування перед обробкою
const lockAcquired = await analysisStateStore.acquireLock(requestId);
if (!lockAcquired) {
  // Вже обробляється, пропускаємо
  return;
}
```

**Чому це важливо:**
- **Захист від дублікатів**: Якщо QStash надішле webhook двічі, обробка виконається тільки один раз
- **Race condition protection**: Захист від одночасної обробки одного запиту
- **Автоматичне звільнення**: Lock автоматично звільняється через TTL навіть при збоях

### 6. Валідація через Zod - відповідно до ТЗ

**Реалізація:**
```typescript
// Валідація запиту на створення аналізу
export const analyzeRequestSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  age: z.number().int().positive("Age must be positive"),
  description: z.string().min(1, "Description cannot be empty"),
});

// Валідація requestId в GET запиті
export const getAnalysisSchema = z.object({
  requestId: z.string().uuid("Request ID must be a valid UUID"),
});
```

**Чому Zod:**
- **TypeScript integration**: Автоматична генерація типів з схем
- **Runtime validation**: Перевірка даних під час виконання (не тільки під час компіляції)
- **User-friendly errors**: Структуровані повідомлення про помилки
- **Composable**: Легко комбінувати схеми для різних частин запиту (body, params, query)

### 7. OpenAI Client з обробкою помилок

**Реалізація:**

```typescript
class OpenAIClient {
  // Retry logic для надійності
  async generatePersonalitySummary(input: AnalysisInput): Promise<string> {
    return await retryWithBackoff(
      async () => await this.client.responses.create({...}),
      3, // max retries
      1000 // base delay
    );
  }
}

// Обробка різних типів помилок OpenAI
function handleOpenAIError(error: unknown): AppError {
  if (error instanceof OpenAI.RateLimitError) {
    return new InternalServerError("Rate limit exceeded", ...);
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new InternalServerError("Connection failed", ...);
  }
  // ... інші типи помилок
}
```

### 8. Domain-Oriented Store Pattern - інкапсуляція логіки Redis

**Проблема:** Пряме використання Redis в сервісах призводить до:
- Дублювання логіки ключів
- Розкиданої логіки TTL
- Складної заміни сховища

**Рішення:**
```typescript
class AnalysisStateStore {
  // Інкапсуляція логіки ключів
  private _buildStateKey(requestId: string): string {
    return `analysis:${requestId}`;
  }
  
  // Інкапсуляція логіки TTL
  private readonly stateTtl = 3600; // 1 година
  
  // Доменно-орієнтовані методи
  async createQueued(requestId, userId, input) { ... }
  async markProcessing(requestId) { ... }
  async markDone(requestId, result) { ... }
}
```

**Чому саме такий підхід:**
- **Інкапсуляція**: Деталі роботи з Redis приховані від бізнес-логіки
- **Замінність**: Можна замінити Redis на інше сховище
- **Читабельність**: Бізнес-логіка використовує доменні методи, а не низькорівневі Redis операції

### 9. Adapter Pattern для зовнішніх сервісів

**Реалізація:**
```typescript
// Інтерфейс (port)
interface IRedisAdapter {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<void>;
  // ...
}

// Конкретна реалізація (adapter)
class RedisAdapter implements IRedisAdapter { ... }

// Використання через інтерфейс
class AnalysisStateStore {
  constructor(private readonly redis: IRedisAdapter) {}
}
```

**Чому такий підхід:**
- **Гнучкість**: Можна легко замінити Upstash Redis на локальний Redis або інше сховище
- **Тестованість**: Легко створити in-memory mock для тестування

### 10. Custom Error Handling - структуровані помилки

**Реалізація:**
```typescript
class AppError extends Error {
  statusCode: number;
  code: string;
  details?: ErrorDetails;
}

// Спеціалізовані класи помилок
class ValidationError extends AppError { ... }
class NotFoundError extends AppError { ... }
class InternalServerError extends AppError { ... }
```

## Технологічний стек - обґрунтування вибору

### PostgreSQL + Sequelize
**Чому додано:**
- Для зберігання користувачів та refresh tokens (не тимчасові дані)
- Sequelize ORM забезпечує типобезпеку та міграції
- Транзакції для критичних операцій

**Пояснення:** ТЗ не вимагає auth, але для повноцінного застосунку вона необхідна. PostgreSQL використовується тільки для постійних даних (користувачі), а не для тимчасового стану аналізу.

## Відповідність технічному завданню

### ✅ Вимоги з ТЗ виконані:

1. **POST /analyze**
   - ✅ Приймає дані форми (name, age, description)
   - ✅ Валідує входні дані (Zod)
   - ✅ Не викликає AI одразу (асинхронно через QStash)
   - ✅ Створює requestId (UUID)
   - ✅ Зберігає стан в Redis
   - ✅ Відправляє відкладене завдання (QStash)
   - ✅ Повертає requestId

2. **Храніння стану**
   - ✅ Redis від Upstash
   - ✅ Тимчасове сховище з TTL (1 година)
   - ✅ Зберігання: requestId, статус, входні дані, результат

3. **Асинхронна обробка**
   - ✅ QStash від Upstash
   - ✅ Відкладений виклик webhook
   - ✅ Webhook оновлює статус
   - ✅ Викликає OpenAI API
   - ✅ Зберігає результат або помилку

4. **GET /analyze/:requestId**
   - ✅ Повертає поточний статус
   - ✅ Повертає результат, якщо готово

5. **AI-інтеграція**
   - ✅ OpenAI API тільки на бекенді
   - ✅ API ключ не доступний з фронту
   - ✅ Обробка помилок AI-запиту

6. **Framework**
   - ✅ Hono обов'язково

## Що було покращено порівняно з мінімальними вимогами ТЗ

### 1. Авторизація (JWT)
**Чому додано:** Для захисту endpoints та відстеження авторства аналізів

### 2. Idempotency через Redis Locks
**Чому додано:** Захист від дублікатів webhook від QStash

### 3. Retry Logic для OpenAI
**Чому додано:** Обробка тимчасових збоїв OpenAI API

### 4. Структурована обробка помилок
**Чому додано:** User-friendly повідомлення та детальне логування

### 5. Domain-Oriented Store
**Чому додано:** Інкапсуляція логіки Redis, легша заміна сховища

## Покращення для продакшену

### 1. Реорганізація OpenAI клієнта

**Поточна проблема:**
OpenAI клієнт містить багато логіки в одному файлі (error handling, retry logic, validation).

**Покращення:**
```
src/integrations/openai/
├── index.ts                    # Експорт основного клієнта
├── IOpenAIClient.ts           # Інтерфейс
├── OpenAIClient.ts            # Основна реалізація
├── errors/
│   ├── OpenAIErrorHandler.ts  # Обробка помилок OpenAI
│   └── OpenAIErrorMapper.ts   # Маппінг помилок в AppError
├── retry/
│   └── RetryStrategy.ts       # Стратегії повторних спроб
└── validators/
    └── ResponseValidator.ts   # Валідація відповідей
```

**Переваги:**
- Розділення відповідальності
- Легше тестувати окремі компоненти
- Можна легко змінити стратегію retry або обробку помилок

### 2. Server-Sent Events (SSE) для real-time оновлень

**Поточна проблема:**
Клієнт має опитувати API кожні 2-3 секунди для отримання статусу аналізу.

**Покращення:**
```typescript
GET /api/analyze/:requestId/stream

// Відкрити SSE з'єднання
// Автоматично відправляти оновлення статусу при зміні
```

**Реалізація:**
```typescript
// Використання Redis pub/sub для real-time оновлень
// Або опитування Redis з інтервалом та відправка через SSE
```

**Переваги:**
- Менше навантаження на сервер (немає постійних polling запитів)
- Real-time оновлення для користувача
- Ефективніше використання ресурсів

### 3. Покращена обробка помилок та retry стратегії

**Покращення:**
- Circuit breaker pattern для OpenAI API
- Exponential backoff з jitter для retry
- Fallback стратегії при недоступності сервісів
- Dead letter queue для невдалих завдань

### 4. Тестування

**Додати:**
- Unit тести для сервісів та репозиторіїв
- Integration тести для API endpoints
- E2E тести для критичних флоу
- Mock стратегії для зовнішніх сервісів

### 5. Документація API

**Додати:**
- OpenAPI/Swagger документація
- Автоматична генерація з TypeScript типів
- Приклади запитів/відповідей

### 6. Безпека

**Покращення:**
- Rate limiting для API endpoints
- Security headers middleware
- Audit logging для критичних операцій

## Висновок

Архітектура повністю відповідає технічному завданню:

**Архітектурні рішення обґрунтовані:**
- Кожне рішення відповідає конкретній вимозі ТЗ
- Використані рекомендовані технології (Hono, Redis Upstash, QStash)
- Додано покращення для надійності (idempotency, retry logic)

**Готовність до покращень:**
- Архітектура дозволяє легко додавати нові функції
- Модульна структура спрощує тестування та підтримку
- Adapter pattern дозволяє замінювати компоненти без зміни бізнес-логіки

Запропоновані покращення для продакшену дозволять:
- Покращити організацію коду та читабельність
- Надати кращий UX через real-time оновлення
- Підвищити надійність та моніторинг
- Спростити підтримку та розробку нових функцій
