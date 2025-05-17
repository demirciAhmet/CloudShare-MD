# 🚀 Project Setup Guide (DEVELOPMENT)

## **Setup**

#### -1. **Edit the `.env` file**
```bash
vim .env_example
```

#### 0. **Generate `.env` file**
```bash
mv .env_example .env_development
```

#### 1. **Build Docker images**
```bash
docker compose build --no-cache app
```

#### 2. **Run DB migrations**
```bash
docker compose run --rm app npx prisma migrate dev --name init
```

#### 3. **Start the app**
```bash
docker compose up --remove-orphans
```

#### 5. **Stop the app**
```bash
docker compose down -v
```

## **Debugging (for a running app)**

#### 1. **(Debugging) For Subsequent Schema Changes**

```bash
docker-compose exec app npx prisma migrate dev
```

#### 2. **(Debugging) Query The Database**

```bash
docker exec -it postgres-db_dev psql -U postgres -d cloudshare_dev
```

#### 3. **Database Queries**

```sql
-- list tables 
cloudshare_dev=# \dt
```

```sql
-- describe the Note table
cloudshare_dev=# \d "Note"
```

```sql
-- select everything
cloudshare_dev=# SELECT * FROM "Note" LIMIT 10;
```

```sql
cloudshare_dev=# SELECT content, created_at
               FROM "Note"
               WHERE expires_at IS NULL
               ORDER BY created_at DESC;
```

```sql
-- quit
\q
```

## Project Structure:

(May need update)

```
├── Dockerfile
├── docker-compose.yaml
├── README.md
├── api-endpoints.rest
├── api-edgecases.rest
├── package.json
├── package-lock.json
├── prisma
│   └── schema.prisma
├── public
│   ├── index.html
│   ├── js
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── config.js
│   │   ├── dom.js
│   │   ├── editor.js
│   │   ├── eventHandlers.js
│   │   ├── eventListeners.js
│   │   ├── noteManager.js
│   │   ├── state.js
│   │   ├── ui.js
│   │   └── utils.js
│   └── styles.css
├── src
│   ├── middleware
│   │   └── creatorAuthMiddleware.js
│   ├── routes
│   │   └── noteRoutes.js
│   ├── prismaClient.js
│   └── server.js
```
