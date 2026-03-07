# NestSync Backend

API с PostgreSQL за регистрация, логин и потребителски данни (вкл. опционална снимка и първоначална сума по карта).

## Изисквания

- Node.js 18+
- Docker и Docker Compose (за PostgreSQL) или инсталиран локален PostgreSQL

## Стартиране

### 1. PostgreSQL с Docker

```bash
docker-compose up -d
```

**Ако излезе „permission denied“ при Docker:**  
Трябва да имаш права за Docker сокета. Избери едно от двете:

- **Вариант А** – добави потребителя в групата `docker`, след което излез и влез отново от терминала (или рестартирай WSL):
  ```bash
  sudo usermod -aG docker $USER
  ```
- **Вариант Б** – пусни Docker с `sudo`:
  ```bash
  sudo docker-compose up -d
  ```

**Без Docker:** може да инсталираш PostgreSQL локално и в `.env` да зададеш `DATABASE_URL=postgresql://postgres:tvoqta_parola@localhost:5432/nestsync` (създай базата `nestsync` ръчно).

### 2. Копирай конфигурацията

```bash
cp .env.example .env
```

При нужда редактирай `.env` (PORT, DATABASE_URL, JWT_SECRET).

### 3. Инициализирай базата

```bash
npm install
npm run db:init
```

Ако таблицата `users` вече съществува и няма колона `username`, пусни миграцията:
```bash
npm run db:migrate
```

### 4. Пусни сървъра

```bash
npm run dev
```

API-то е на `http://localhost:3001`.

**Важно:** Регистрацията и логинът от уеб сайта работят само ако този backend и базата данни текат. Ако бутонът „Create account“ / „Log in“ зависва или изписва „Cannot reach server“, пусни отново стъпки 1–4 по-горе (Docker + db:init + npm run dev).

## Endpoints

| Метод | Път | Описание |
|-------|-----|----------|
| POST | `/api/auth/register` | Регистрация (email, password; опц. profilePhoto, initialCardAmount) |
| POST | `/api/auth/login` | Логин (email, password) → връща `{ user, token }` |
| GET | `/api/auth/me` | Текущ потребител (Header: `Authorization: Bearer <token>`) |
| GET | `/api/health` | Health check |

### Регистрация (multipart/form-data)

- `email` (required)
- `password` (required, min 6 символа)
- `username` (optional)
- `profilePhoto` (optional) – image file
- `initialCardAmount` (optional) – число

### Логин (JSON)

```json
{ "email": "user@example.com", "password": "secret" }
```

Ответ: `{ "user": { "id", "email", "profilePhotoUrl", "initialCardAmount" }, "token": "..." }`

## Структура на БД

Таблица `users`:

- `id`, `email`, `password_hash`, `profile_photo_path`, `initial_card_amount`, `created_at`
