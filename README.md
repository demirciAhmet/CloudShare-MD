0. **Generate an .env file**

`mv .env_example .env
`
0. **For changed dependencies**

`npm install
`
1. **Generate the Prisma Client**

`npx prisma generate
`
2. **Build your docker images**

`docker compose build
`
3. **Create PostgreSQL migrations and apply them**

`docker compose run app npx prisma migrate dev --name init
`
4. **Boot up docker containers**:

`docker compose up
`
5. **Remove containers**

`docker compose down
`

6. **To stop Docker containers**

`docker compose down`