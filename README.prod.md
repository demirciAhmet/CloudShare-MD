# 🚀 Project Setup Guide (PRODUCTION)

## **Setup**

#### -1. **Edit the `.env` file**
```bash
vim .env_example
```

#### 0. **Generate `.env` file**
```bash
mv .env_example .env_production
```

#### 1. **Build Docker images**
```bash
docker-compose -f docker-compose.prod.yaml build --no-cache app
```

#### 2. **Start the app**
```bash
docker-compose -f docker-compose.prod.yaml up -d
```

#### 3. **Stop the app (also remove volume if necessary)**
```bash
docker-compose -f docker-compose.prod.yaml down -v
```

## **Debugging (for a running app)**


#### 1. **View Logs**
```bash
docker-compose -f docker-compose.prod.yaml logs -f app
```

