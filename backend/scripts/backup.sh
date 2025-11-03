#!/bin/bash

###############################################################################
# BlackBow Associates - Database Backup Script
# 
# This script performs automated PostgreSQL database backups with:
# - Compression (gzip)
# - SHA256 checksums
# - Manifest generation (JSON)
# - Restic integration for remote backup
# - Local retention policy (7 days)
# - Telegram notifications
#
# Usage: ./backup.sh [--force]
#   --force: Skip checks and force backup execution
###############################################################################

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="blackbow_backup_${TIMESTAMP}"
LOG_FILE="${LOG_FILE:-/var/log/desaas/blackbow-backup.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR" "${RED}$1${NC}"
    send_telegram_notification "❌ Backup failed: $1" "error"
    exit 1
}

# Success handler
success_exit() {
    log "INFO" "${GREEN}$1${NC}"
    send_telegram_notification "✅ Backup completed successfully" "success"
    exit 0
}

# Send Telegram notification
send_telegram_notification() {
    local message="$1"
    local level="${2:-info}"
    
    # Try to send via local notification service (if available)
    if command -v curl &> /dev/null; then
        curl -s -X POST http://localhost:3400/notify \
            -H "Content-Type: application/json" \
            -d "{\"message\":\"📦 **Database Backup**\\n${message}\",\"level\":\"${level}\",\"service\":\"backup-script\"}" \
            --max-time 5 &> /dev/null || true
    fi
}

# Parse DATABASE_URL to extract connection details
parse_database_url() {
    local db_url="${DATABASE_URL:-}"
    
    if [ -z "$db_url" ]; then
        # Try to load from .env file
        if [ -f "$PROJECT_ROOT/.env" ]; then
            export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep DATABASE_URL | xargs)
            db_url="${DATABASE_URL:-}"
        fi
    fi
    
    if [ -z "$db_url" ]; then
        error_exit "DATABASE_URL not found in environment or .env file"
    fi
    
    # Extract components from postgresql://user:pass@host:port/dbname
    DB_HOST=$(echo "$db_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$db_url" | sed -n 's/.*@[^:]*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "$db_url" | sed -n 's/postgresql:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$db_url" | sed -n 's/postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Default port if not specified
    DB_PORT="${DB_PORT:-5432}"
    
    log "INFO" "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        error_exit "pg_dump not found. Please install PostgreSQL client tools."
    fi
    
    # Check if database is accessible
    if ! PGPASSWORD="$DB_PASS" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &> /dev/null; then
        error_exit "Database is not accessible at ${DB_HOST}:${DB_PORT}"
    fi
    
    # Check if gzip is available
    if ! command -v gzip &> /dev/null; then
        error_exit "gzip not found. Please install gzip."
    fi
    
    # Check if sha256sum is available
    if ! command -v sha256sum &> /dev/null; then
        error_exit "sha256sum not found. Please install sha256sum."
    fi
    
    # Check if restic is available (optional)
    RESTIC_AVAILABLE=false
    if command -v restic &> /dev/null; then
        RESTIC_AVAILABLE=true
        log "INFO" "Restic found - remote backup will be enabled"
    else
        log "WARN" "Restic not found - remote backup will be skipped"
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Create backup directory structure
setup_backup_directory() {
    mkdir -p "$BACKUP_DIR" || error_exit "Failed to create backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/dumps" || error_exit "Failed to create dumps directory"
    mkdir -p "$BACKUP_DIR/manifests" || error_exit "Failed to create manifests directory"
    log "INFO" "Backup directory: $BACKUP_DIR"
}

# Perform database backup
perform_backup() {
    log "INFO" "Starting database backup..."
    
    local dump_file="$BACKUP_DIR/dumps/${BACKUP_NAME}.sql"
    local compressed_file="${dump_file}.gz"
    
    # Perform pg_dump
    log "INFO" "Running pg_dump..."
    if ! PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --verbose \
        > "$dump_file" 2>>"$LOG_FILE"; then
        error_exit "pg_dump failed"
    fi
    
    # Get dump file size
    local dump_size=$(du -h "$dump_file" | cut -f1)
    log "INFO" "Dump created: ${dump_size}"
    
    # Compress backup
    log "INFO" "Compressing backup..."
    if ! gzip -f "$dump_file"; then
        error_exit "Compression failed"
    fi
    
    # Get compressed file size
    local compressed_size=$(du -h "$compressed_file" | cut -f1)
    log "INFO" "Backup compressed: ${compressed_size}"
    
    # Generate SHA256 checksum
    log "INFO" "Generating checksum..."
    local checksum=$(sha256sum "$compressed_file" | awk '{print $1}')
    echo "$checksum" > "${compressed_file}.sha256"
    log "INFO" "Checksum: $checksum"
    
    # Create manifest JSON
    create_manifest "$compressed_file" "$checksum" "$dump_size" "$compressed_size"
    
    echo "$compressed_file"
}

# Create manifest file
create_manifest() {
    local backup_file="$1"
    local checksum="$2"
    local original_size="$3"
    local compressed_size="$4"
    
    local manifest_file="$BACKUP_DIR/manifests/${BACKUP_NAME}.json"
    
    local manifest=$(cat <<EOF
{
  "backup_name": "${BACKUP_NAME}",
  "timestamp": "${TIMESTAMP}",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": {
    "host": "${DB_HOST}",
    "port": ${DB_PORT},
    "name": "${DB_NAME}",
    "user": "${DB_USER}"
  },
  "backup_file": {
    "path": "$(basename "$backup_file")",
    "size": "${compressed_size}",
    "original_size": "${original_size}",
    "checksum": {
      "algorithm": "SHA256",
      "value": "${checksum}"
    }
  },
  "compression": "gzip",
  "retention_days": ${RETENTION_DAYS}
}
EOF
)
    
    echo "$manifest" > "$manifest_file"
    log "INFO" "Manifest created: $(basename "$manifest_file")"
}

# Upload to Restic (if available)
upload_to_restic() {
    if [ "$RESTIC_AVAILABLE" != "true" ]; then
        return 0
    fi
    
    local backup_file="$1"
    
    # Check if Restic repository is configured
    if [ -z "${RESTIC_REPOSITORY:-}" ]; then
        log "WARN" "RESTIC_REPOSITORY not set - skipping remote backup"
        return 0
    fi
    
    if [ -z "${RESTIC_PASSWORD:-}" ]; then
        log "WARN" "RESTIC_PASSWORD not set - skipping remote backup"
        return 0
    fi
    
    log "INFO" "Uploading to Restic repository..."
    
    # Initialize repository if needed
    if ! restic snapshots &> /dev/null; then
        log "INFO" "Initializing Restic repository..."
        restic init || log "WARN" "Restic init failed (may already exist)"
    fi
    
    # Backup the backup file
    if restic backup "$backup_file" --tag "blackbow-db" --tag "database-backup"; then
        log "INFO" "Backup uploaded to Restic successfully"
        
        # Prune old snapshots (keep last 30 days)
        restic forget --keep-daily 30 --prune || log "WARN" "Restic prune failed"
    else
        log "WARN" "Restic upload failed - local backup still available"
    fi
}

# Clean old backups
clean_old_backups() {
    log "INFO" "Cleaning backups older than ${RETENTION_DAYS} days..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    find "$BACKUP_DIR/dumps" -name "blackbow_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete && {
        deleted_count=$((deleted_count + 1))
    }
    
    # Delete corresponding checksum files
    find "$BACKUP_DIR/dumps" -name "blackbow_backup_*.sql.gz.sha256" -type f -mtime +${RETENTION_DAYS} -delete
    
    # Delete corresponding manifest files
    find "$BACKUP_DIR/manifests" -name "blackbow_backup_*.json" -type f -mtime +${RETENTION_DAYS} -delete
    
    if [ $deleted_count -gt 0 ]; then
        log "INFO" "Cleaned ${deleted_count} old backup(s)"
    else
        log "INFO" "No old backups to clean"
    fi
}

# List available backups
list_backups() {
    log "INFO" "Available backups:"
    local backup_count=0
    
    for manifest in "$BACKUP_DIR/manifests"/*.json; do
        if [ -f "$manifest" ]; then
            local backup_name=$(basename "$manifest" .json)
            local created_at=$(jq -r '.created_at' "$manifest" 2>/dev/null || echo "unknown")
            local size=$(jq -r '.backup_file.size' "$manifest" 2>/dev/null || echo "unknown")
            echo "  - $backup_name (${created_at}, ${size})"
            backup_count=$((backup_count + 1))
        fi
    done
    
    if [ $backup_count -eq 0 ]; then
        log "WARN" "No backups found"
    else
        log "INFO" "Total backups: ${backup_count}"
    fi
}

# Main execution
main() {
    log "INFO" "=========================================="
    log "INFO" "BlackBow Database Backup Script"
    log "INFO" "Started at $(date)"
    log "INFO" "=========================================="
    
    # Parse command line arguments
    FORCE=false
    if [[ "${1:-}" == "--force" ]]; then
        FORCE=true
    fi
    
    # Change to project root
    cd "$PROJECT_ROOT" || error_exit "Failed to change to project root"
    
    # Setup
    parse_database_url
    check_prerequisites
    setup_backup_directory
    
    # Perform backup
    local backup_file=$(perform_backup)
    
    # Upload to Restic
    upload_to_restic "$backup_file"
    
    # Clean old backups
    clean_old_backups
    
    # List backups
    list_backups
    
    # Success
    log "INFO" "=========================================="
    log "INFO" "Backup completed successfully"
    log "INFO" "Backup file: $(basename "$backup_file")"
    log "INFO" "Completed at $(date)"
    log "INFO" "=========================================="
    
    send_telegram_notification "Backup completed: $(basename "$backup_file")" "success"
    exit 0
}

# Run main function
main "$@"
