#!/bin/bash
# backup-database.sh - Create database backup
# Usage: ./backup-database.sh [--output PATH]

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_PATH="backups/backup_${TIMESTAMP}.sql"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output)
            OUTPUT_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./backup-database.sh [--output PATH]"
            exit 1
            ;;
    esac
done

# Create backup directory
mkdir -p "$(dirname "$OUTPUT_PATH")"

echo "💾 Creating database backup..."
echo "   Output: $OUTPUT_PATH"

# Create backup using pg_dump
pg_dump -h localhost -p 54322 -U postgres -d postgres \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --schema=public \
    > "$OUTPUT_PATH"

# Get file size
FILE_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)

echo "✅ Backup completed successfully!"
echo "   File: $OUTPUT_PATH"
echo "   Size: $FILE_SIZE"
echo ""
echo "💡 To restore this backup:"
echo "   psql -h localhost -p 54322 -U postgres -d postgres -f $OUTPUT_PATH"
