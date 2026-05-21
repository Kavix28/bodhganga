#!/bin/bash

# BODHGANGA PRODUCTION BACKUP SCRIPT
# This script performs a full MongoDB dump and uploads it to AWS S3.
# It should be configured to run daily via cron.
# Example cron: 0 2 * * * /path/to/bodhganga/backup.sh >> /var/log/bodhganga-backup.log 2>&1

set -e

TIMESTAMP=$(date +"%F_%H-%M-%S")
BACKUP_DIR="/tmp/bodhganga_backup_$TIMESTAMP"
ARCHIVE_NAME="bodhganga_db_$TIMESTAMP.tar.gz"
S3_BUCKET="s3://bodhganga-backups-prod"

echo "Starting Backup Process at $TIMESTAMP"

# 1. Database Dump
echo "Dumping MongoDB Database..."
mongodump --uri="${MONGO_URI:-mongodb://localhost:27017/bodhganga}" --out="$BACKUP_DIR"

# 2. Compress Dump
echo "Compressing Backup..."
cd /tmp
tar -czvf "$ARCHIVE_NAME" "bodhganga_backup_$TIMESTAMP"

# 3. Upload to Cloud Storage (AWS S3)
echo "Uploading to S3..."
# Ensure AWS CLI is configured with the correct IAM role/credentials
aws s3 cp "$ARCHIVE_NAME" "$S3_BUCKET/$ARCHIVE_NAME"

# 4. Cleanup
echo "Cleaning up local files..."
rm -rf "$BACKUP_DIR"
rm "$ARCHIVE_NAME"

echo "Backup completed successfully at $(date +"%F_%H-%M-%S")"
