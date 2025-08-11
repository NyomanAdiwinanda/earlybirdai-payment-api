#!/bin/sh
set -e

echo "Starting EarlyBird AI Payment API..."

echo "Waiting for PostgreSQL to be ready..."
until nc -z dev-db 5432; do
  echo "PostgreSQL is not ready yet, waiting 2 seconds..."
  sleep 2
done

echo "PostgreSQL is ready!"

echo "Running Prisma migrations..."
npx prisma migrate dev --name init --skip-generate

echo "Generating Prisma client..."
npx prisma generate

echo "Setup complete! Starting the application..."

exec "$@"
