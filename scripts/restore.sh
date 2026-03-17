#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/restore.sh <backup-file>"
  echo "Example: ./scripts/restore.sh backups/glass-2025-01-15-143000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File not found: $BACKUP_FILE"
  exit 1
fi

CONTAINER=$(docker compose ps -q db)

if [ -z "$CONTAINER" ]; then
  echo "Error: db container is not running. Start it with: docker compose up db -d"
  exit 1
fi

echo "Restoring from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U glass -d glass

echo "Restore complete."
