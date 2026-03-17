#!/bin/bash
set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
FILENAME="glass-${TIMESTAMP}.sql.gz"

CONTAINER=$(docker compose ps -q db)

if [ -z "$CONTAINER" ]; then
  echo "Error: db container is not running. Start it with: docker compose up db -d"
  exit 1
fi

docker compose exec -T db pg_dump -U glass glass | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "Backup saved to backups/${FILENAME}"
