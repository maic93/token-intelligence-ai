#!/bin/sh
set -e

export PATH="/app/packages/database/node_modules/.bin:$PATH"

echo 'Running database migrations...'
cd /app/packages/database
prisma migrate deploy

echo 'Starting service...'
cd /app
exec "$@"
