#!/bin/sh
set -e

# Yerelde .env dosyasını yükle.
# Vercel'de değişkenler zaten ortamdan gelir.
if [ -f ".env" ]; then
  set -a
  . ./.env
  set +a
fi

export DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL tanımlı değil."
  exit 1
fi

attempt=1
max_attempts=5

while [ "$attempt" -le "$max_attempts" ]; do
  if npx prisma migrate deploy; then
    exit 0
  fi

  echo "prisma migrate deploy failed (attempt $attempt/$max_attempts)."

  if [ "$attempt" -lt "$max_attempts" ]; then
    echo "Neon's database may still be waking up from idle. Retrying in 10s..."
    sleep 10
  fi

  attempt=$((attempt + 1))
done

echo "prisma migrate deploy failed after $max_attempts attempts."
exit 1
