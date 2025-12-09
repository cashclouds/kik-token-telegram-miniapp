# KIK Telegram Bot - Setup Guide

**Status**: MVP Ready (In-Memory Mode)
**Date**: 8 декабря 2024

---

## ✅ Что Уже Готово

### 1. Структура проекта ✅
```
telegram-bot/
├── src/
│   ├── index.js (350+ lines) - Main bot logic
│   ├── database/
│   │   └── db.js - Database (in-memory MVP)
│   ├── services/
│   │   ├── adManager.js - Ad monetization
│   │   ├── rewardService.js - Reward tracking
│   │   ├── nftService.js - NFT creation
│   │   └── referralService.js - Referral system
│   └── utils/
│       ├── logger.js - Winston logging
│       └── redis.js - Caching (in-memory MVP)
├── .env - Configuration
├── .env.example - Example config
├── package.json - Dependencies
└── README.md - Documentation
```

### 2. Dependencies установлены ✅
```
✅ telegraf - Telegram bot framework
✅ express - HTTP server
✅ winston - Logging
✅ pg - PostgreSQL (optional)
✅ redis - Caching (optional)
✅ dotenv - Environment variables
✅ ethers - Blockchain interaction
```

### 3. MVP Mode Features ✅
- ✅ **In-memory storage** (no PostgreSQL needed)
- ✅ **In-memory cache** (no Redis needed)
- ✅ **Mock services** (works without deployed contracts)
- ✅ **All bot commands** implemented
- ✅ **Rate limiting** working
- ✅ **User management** working

---

## 🚀 Quick Start (3 шага)

### Шаг 1: Получить BOT_TOKEN от BotFather

1. Открой Telegram и найди **@BotFather**
2. Отправь команду `/newbot`
3. Введи имя бота (например: "KIK Collectibles Bot")
4. Введи username бота (должен заканчиваться на "bot", например: "kik_collectibles_bot")
5. **Скопируй TOKEN** который даст BotFather (вида: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Пример**:
```
BotFather: Done! Congratulations on your new bot. You will find it at t.me/kik_collectibles_bot.
You can now add a description...

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

For a description of the Bot API, see this page: https://core.telegram.org/bots/api
```

### Шаг 2: Обновить .env файл

Открой файл `telegram-bot/.env` и вставь свой TOKEN:

```bash
# Замени YOUR_BOT_TOKEN_HERE на токен от BotFather
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Остальные настройки уже готовы!** Database и Redis используют in-memory storage.

### Шаг 3: Запустить бота

```bash
cd telegram-bot
npm install  # Already done
npm run dev
```

Увидишь:
```
✅ PostgreSQL connection pool created
   OR
⚠️  Using in-memory storage (MVP mode)
   Set DATABASE_URL in .env for production database

⚠️  Using in-memory cache (MVP mode)
   Set REDIS_URL in .env for production Redis

✅ Bot started successfully!
Bot username: @kik_collectibles_bot
Ready to receive updates...
```

### Шаг 4: Протестировать бота

1. Открой Telegram
2. Найди своего бота (например @kik_collectibles_bot)
3. Нажми **START**
4. Попробуй команды:
   - `/start` - Регистрация + приветствие
   - `/balance` - Проверить баланс (mock)
   - `/create red ferrari` - Создать NFT (mock с placeholder image)
   - `/collection` - Посмотреть свои NFTs
   - `/invite` - Получить реферальную ссылку
   - `/help` - Список всех команд

---

## 📝 Доступные Команды

### Для Пользователей
```
/start [referral_code] - Регистрация (получить 100 KIK бонус)
/create <prompt> - Создать AI NFT (100 KIK, вернуть 50 KIK)
/gift @username <nft_id> - Подарить NFT другу (оба получают 50 KIK)
/marketplace - Просмотр NFTs на продаже
/collection - Твои NFTs
/invite - Реферальная ссылка + статистика
/watchad - Смотреть 30-сек видео, заработать 50 KIK
/balance - Баланс KIK токенов
/rewards - Проверить pending rewards
/claim - Забрать rewards (минимум 10 KIK)
/premium - Подписка $4.99/месяц (без рекламы)
/settings - Настройки пользователя
/help - Помощь
```

### Для Админов
```
/stats - Статистика бота
/campaign_create - Создать рекламную кампанию
/campaign_list - Список активных кампаний
/revenue - Просмотр ad revenue
```

---

## 🎯 MVP Mode vs Production

### MVP Mode (Сейчас) ✅
**Что работает:**
- ✅ Все команды бота
- ✅ Регистрация пользователей (in-memory)
- ✅ NFT creation (mock с placeholder images)
- ✅ Referral system (in-memory tracking)
- ✅ Balance tracking (mock)
- ✅ Rate limiting
- ✅ Logging

**Что НЕ работает:**
- ❌ Real blockchain integration (нет deployed контрактов)
- ❌ Real AI image generation (нет OPENAI_API_KEY)
- ❌ IPFS metadata storage (нет PINATA_API_KEY)
- ❌ Ad monetization (BOOT_AD_ENABLED=false)
- ❌ Premium subscriptions (нет payment integration)
- ❌ Persistent storage (данные теряются при перезапуске)

### Production Mode (После деплоя)
**Нужно добавить:**

#### 1. Deployed Smart Contracts
```bash
# В .env добавить:
KIK_TOKEN_ADDRESS=0x...
COLLECTIBLES_NFT_ADDRESS=0x...
MARKETPLACE_ADDRESS=0x...
REFERRAL_SYSTEM_ADDRESS=0x...
REWARD_DISTRIBUTOR_ADDRESS=0x...
```

#### 2. PostgreSQL Database
```bash
# Установить PostgreSQL
# Создать database: kik_collectibles
# В .env добавить:
DATABASE_URL=postgresql://user:password@localhost:5432/kik_collectibles

# Запустить migrations:
npm run db:migrate
```

#### 3. Redis Cache
```bash
# Установить Redis
# В .env добавить:
REDIS_URL=redis://localhost:6379
```

#### 4. AI Image Generation
```bash
# Получить OpenAI API key
OPENAI_API_KEY=sk-...

# Или Stability AI:
STABILITY_API_KEY=...
```

#### 5. IPFS Storage
```bash
# Получить Pinata API keys
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
```

#### 6. Ad Networks
```bash
# Получить Telegram Ads token
TELEGRAM_ADS_TOKEN=...
BOOT_AD_ENABLED=true
REWARD_AD_ENABLED=true
```

---

## 🔧 Troubleshooting

### Проблема: "Error: 401 Unauthorized"
**Решение**: Неверный BOT_TOKEN. Проверь что скопировал правильно.

### Проблема: "Error: ECONNREFUSED"
**Решение**: PostgreSQL или Redis не запущен. Для MVP это не критично - используется in-memory.

### Проблема: "Rate limit exceeded"
**Решение**: Слишком много запросов. Подожди 1 минуту.

### Проблема: Бот не отвечает
**Решение**:
1. Проверь что бот запущен (`npm run dev`)
2. Проверь логи в консоли
3. Проверь что TOKEN правильный
4. Попробуй `/start` снова

---

## 📊 Логирование

### В консоли увидишь:
```
2024-12-08 20:00:00 [info]: ✅ Bot started successfully!
2024-12-08 20:00:05 [info]: User 123456 (@username) accessed bot
2024-12-08 20:00:06 [info]: Creating NFT for user 123456 with prompt: "red ferrari"
2024-12-08 20:00:07 [info]: Awarding 50 KIK to user 123456 for nft_creation
```

### Log Levels:
- `info` - Нормальная работа
- `warn` - Предупреждения (не критично)
- `error` - Ошибки (требуют внимания)

Можно изменить в `.env`:
```bash
LOG_LEVEL=debug  # Больше информации
LOG_LEVEL=error  # Только ошибки
```

---

## 🚦 Проверка Статуса

### Health Check
Пока бот работает, открой в браузере:
```
http://localhost:3000/health
```

Увидишь:
```json
{
  "status": "ok",
  "timestamp": "2024-12-08T20:00:00.000Z"
}
```

---

## 📈 Следующие Шаги

### 1. Протестировать все команды ✅
- Создать несколько NFTs
- Попробовать referral систему
- Проверить balance tracking

### 2. Задеплоить smart contracts
```bash
cd ../  # Вернуться в files-v2
npm run deploy:amoy:pool:lite     # Deploy KIKTokenV2 + AnonymousPool
npm run deploy:amoy:burning       # Deploy BurningSystem
```

### 3. Обновить .env с адресами контрактов
```bash
KIK_TOKEN_ADDRESS=0x...  # После деплоя
```

### 4. Настроить production services
- PostgreSQL database
- Redis cache
- OpenAI API для real AI images
- Pinata для IPFS
- Telegram Ads для monetization

### 5. Deploy бота на сервер
```bash
# Heroku, AWS, DigitalOcean, etc.
# PM2 для process management:
pm2 start src/index.js --name kik-bot
pm2 logs kik-bot
```

---

## 📞 Полезные Ссылки

### Telegram Bot
- BotFather: https://t.me/BotFather
- Bot API Docs: https://core.telegram.org/bots/api
- Telegraf Docs: https://telegraf.js.org/

### Blockchain
- Polygon Amoy Faucet: https://faucet.polygon.technology/
- Amoy Explorer: https://amoy.polygonscan.com/

### AI & IPFS
- OpenAI API: https://platform.openai.com/api-keys
- Stability AI: https://platform.stability.ai/
- Pinata (IPFS): https://www.pinata.cloud/

---

## ✅ Checklist Перед Production

- [ ] BOT_TOKEN получен от BotFather
- [ ] Бот работает локально (npm run dev)
- [ ] Все команды протестированы
- [ ] Smart contracts deployed
- [ ] Contract адреса в .env
- [ ] PostgreSQL настроен
- [ ] Redis настроен
- [ ] OpenAI API key получен
- [ ] Pinata API key получен
- [ ] Telegram Ads token получен
- [ ] Бот задеплоен на production сервер
- [ ] Webhook настроен (для production)
- [ ] Monitoring настроен (Sentry, etc.)

---

**Последнее обновление**: 8 декабря 2024
**Статус**: MVP READY - Готов к локальному тестированию! 🚀
**Создатель**: Claude Sonnet 4.5
