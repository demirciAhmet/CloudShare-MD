# ---- Builder Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies (including devDependencies for build)
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm install
RUN npm run build

# Copy the rest of the application source code
COPY . .

# ---- Production Stage ----
FROM node:22-alpine

WORKDIR /app

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only necessary artifacts from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma 
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client 

# Copy the entrypoint script
COPY entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# Ensure all files are owned by the non-root user
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Use PORT from env, default to 5002
EXPOSE ${PORT} 

CMD ["node", "./src/server.js"]
