#!/bin/sh
set -e

export PATH="/app/packages/database/node_modules/.bin:$PATH"

echo 'Running database migrations...'
cd /app/packages/database
prisma migrate deploy

echo 'Starting indexer...'
exec node /app/apps/indexer/dist/index.js
