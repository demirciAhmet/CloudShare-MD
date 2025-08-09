# CloudShare MD

A simple, fast, and secure way to share markdown notes, designed to be deployed as a containerized application.

## Core Concepts

This project runs in Docker containers and is designed for both local development and production deployment.

- **Containerization**: The application and its PostgreSQL database are managed by Docker Compose, ensuring a consistent environment.
- **Port Defaults**:
  - **Internal Port**: The Node.js server listens on port `3000` inside the container. This is configurable via the `PORT` environment variable.
  - **External Port**: Docker maps the host machine's port `8080` to the container's internal port `3000`. All external access (local testing, reverse proxy) should target port `8080`.

---

## 🚀 Development Setup

These instructions will get you a local development environment with live-reloading for easy coding.

### 1. Environment File

First, create an environment file for development by copying the example file.

```bash
cp .env_example .env_development
```

Make sure to review .env_development and fill in any necessary values.

### 2. Build Docker Images

Build the initial images defined in docker-compose.yaml.

```bash
docker compose build
```

### 3. Run Initial Database Migration

This command sets up your database schema for the first time.

```bash
docker compose run --rm app npx prisma migrate dev --name init
```

4. Start the Application

Start all services. The -d flag runs them in the background.

```bash
docker compose up -d
```

The application will now be available at http://localhost:8080.

5. Stopping the Environment

To stop all services and remove the containers:

```bash
docker compose down
```

To also remove the database volume (which deletes all data), add the -v flag: docker compose down -v.

🏭 Production Deployment

The production deployment uses a pre-built Docker image from a container registry, which is managed by the CI/CD pipeline. The docker-compose.prod.yaml file is used for orchestration on the server.

CI/CD Pipeline

A push to the master branch automatically triggers the GitHub Actions workflow which will:

Run the test suite.
Build a production-ready Docker image.
Push the image to the GitHub Container Registry (GHCR).
Manual Deployment Steps (On the Server)

Environment File: Create a .env_production file on your server with your production secrets (database credentials, etc.). Ensure you set PORT=3000.

```bash
# Example .env_production
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:password@db:5432/dbname"
# ... other secrets
```

Pull the Latest Image: Fetch the latest image built by your CI/CD pipeline.

```bash
docker compose -f docker-compose.prod.yaml pull app
```

Start the Services: Start the application stack in detached mode. The entrypoint.sh script will automatically run database migrations (prisma migrate deploy) before starting the server.

```bash
docker compose -f docker-compose.prod.yaml up -d
```

To manually test the API, you can use the .rest files (api-endpoints.rest, api-edgecases.rest) with a compatible client, such as the REST Client extension for VS Code. All requests now target http://localhost:8080.

🛠️ Debugging
View Logs
Development: docker compose logs -f app
Production: docker compose -f docker-compose.prod.yaml logs -f app
Subsequent Database Migrations (Development Only)

If you change your schema.prisma file during development, create and apply a new migration:

```bash
docker compose exec app npx prisma migrate dev
```

Access the Database

You can connect directly to the PostgreSQL database using psql.

Development Database:

```bash
docker compose exec db psql -U your_dev_user -d your_dev_db
````

Production Database:

```bash
docker compose -f docker-compose.prod.yaml exec db psql -U your_prod_user -d your_prod_db
```

Once inside psql, you can use commands like \dt (list tables), \d "Note" (describe table), or run any SQL query. To quit, type \q.
