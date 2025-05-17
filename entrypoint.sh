#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting the application..."
# Execute the original CMD from the Dockerfile
exec "$@"