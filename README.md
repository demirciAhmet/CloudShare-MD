## 🚀 Project Setup Guide

### 0. **Create `.env` file**
```bash
mv .env_example .env
```

### 1. **Install dependencies**
```bash
npm install
```

### 2. **Generate Prisma Client**
```bash
npx prisma generate
```

### 3. **Build Docker images**
```bash
docker compose build
```

### 4. **Run DB migrations**
```bash
docker compose run app npx prisma migrate dev --name init
```

### 5. **Start the app**
```bash
docker compose up
```

### 6. **Stop the app**
```bash
docker compose down
```
## Project Structure:
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
