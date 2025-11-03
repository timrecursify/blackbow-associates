#!/bin/bash

###############################################################################
# BlackBow Associates - Database Restore Script
# 
# This script restores PostgreSQL database from backup files with:
# - Backup listing
# - Integrity verification (checksum)
# - Confirmation prompts
# - Error handling
#
# Usage: ./restore.sh [--backup BACKUP_NAME] [--force]
#   --backup BACKUP_NAME: Restore from specific backup (default: latest)
#   --force: Skip confirmation prompts
###############################################################################

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
LOG_FILE="${LOG_FILE:-/var/log/desaas/blackbow-restore.log}"

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
    send_telegram_notification "❌ Restore failed: $1" "error"
    exit 1
}

# Send Telegram notification
send_telegram_notification() {
    local message="$1"
    local level="${2:-info}"
    
    if command -v curl &> /dev/null; then
        curl -s -X POST http://localhost:3400/notify \
            -H "Content-Type: application/json" \
            -d "{\"message\":\"🔄 **Database Restore**\\n${message}\",\"level\":\"${level}\",\"service\":\"restore-script\"}" \
            --max-time 5 &> /dev/null || true
    fi
}

# Parse DATABASE_URL
parse_database_url() {
    local db_url="${DATABASE_URL:-}"
    
    if [ -z "$db_url" ]; then
        if [ -f "$PROJECT_ROOT/.env" ]; then
            export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep DATABASE_URL | xargs)
            db_url="${DATABASE_URL:-}"
        fi
    fi
    
    if [ -z "$db_url" ]; then
        error_exit "DATABASE_URL not found in environment or .env file"
    fi
    
    DB_HOST=$(echo "$db_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$db_url" | sed -n 's/.*@[^:]*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "$db_url" | sed -n 's/postgresql:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$db_url" | sed -n 's/postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    DB_PORT="${DB_PORT:-5432}"
    
    log "INFO" "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    if ! command -v pg_restore &> /dev/null && ! command -v psql &> /dev/null; then
        error_exit "PostgreSQL client tools not found. Please install PostgreSQL client."
    fi
    
    if ! command -v gunzip &> /dev/null; then
        error_exit "gunzip not found. Please install gzip."
    fi
    
    if ! command -v sha256sum &> /dev/null; then
        error_exit "sha256sum not found. Please install sha256sum."
    fi
    
    if ! PGPASSWORD="$DB_PASS" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &> /dev/null; then
        error_exit "Database is not accessible at ${DB_HOST}:${DB_PORT}"
    fi
    
    log "INFO" "Prerequisites check passed"
}

# List available backups
list_backups() {
    log "INFO" "Available backups:"
    
    if [ ! -d "$BACKUP_DIR/manifests" ]; then
        error_exit "Backup directory not found: $BACKUP_DIR/manifests"
    fi
    
    local backup_count=0
    local backups=()
    
    for manifest in "$BACKUP_DIR/manifests"/*.json; do
        if [ -f "$manifest" ]; then
            local backup_name=$(basename "$manifest" .json)
            local created_at=$(jq -r '.created_at' "$manifest" 2>/dev/null || echo "unknown")
            local size=$(jq -r '.backup_file.size' "$manifest" 2>/dev/null || echo "unknown")
            local file_path=$(jq -r '.backup_file.path' "$manifest" 2>/dev/null || echo "")
            
            echo "  [$backup_count] $backup_name"
            echo "      Created: $created_at"
            echo "      Size: $size"
            echo ""
            
            backups+=("$backup_name")
            backup_count=$((backup_count + 1))
        fi
    done
    
    if [ $backup_count -eq 0 ]; then
        error_exit "No backups found in $BACKUP_DIR/manifests"
    fi
    
    echo "${backups[@]}"
}

# Find backup file
find_backup_file() {
    local backup_name="$1"
    local backup_file="$BACKUP_DIR/dumps/${backup_name}.sql.gz"
    
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    echo "$backup_file"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    local checksum_file="${backup_file}.sha256"
    
    log "INFO" "Verifying backup integrity..."
    
    if [ ! -f "$checksum_file" ]; then
        log "WARN" "Checksum file not found: $checksum_file"
        return 1
    fi
    
    local expected_checksum=$(cat "$checksum_file" | awk '{print $1}')
    local actual_checksum=$(sha256sum "$backup_file" | awk '{print $1}')
    
    if [ "$expected_checksum" != "$actual_checksum" ]; then
        error_exit "Checksum verification failed! Backup file may be corrupted."
    fi
    
    log "INFO" "${GREEN}Checksum verification passed${NC}"
    return 0
}

# Get latest backup
get_latest_backup() {
    local latest_manifest=$(ls -t "$BACKUP_DIR/manifests"/*.json 2>/dev/null | head -1)
    
    if [ -z "$latest_manifest" ]; then
        error_exit "No backups found"
    fi
    
    basename "$latest_manifest" .json
}

# Confirm restore
confirm_restore() {
    local backup_name="$1"
    
    if [ "$FORCE" = "true" ]; then
        return 0
    fi
    
    echo ""
    echo "${YELLOW}⚠️  WARNING: This will restore the database from backup!${NC}"
    echo "  Backup: $backup_name"
    echo "  Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
    echo ""
    echo "${RED}This operation will:${NC}"
    echo "  - DROP existing tables and data"
    echo "  - Restore all data from backup"
    echo "  - This action CANNOT be undone!"
    echo ""
    read -p "Type 'RESTORE' to confirm: " confirmation
    
    if [ "$confirmation" != "RESTORE" ]; then
        log "INFO" "Restore cancelled by user"
        exit 0
    fi
}

# Perform restore
perform_restore() {
    local backup_file="$1"
    local temp_sql=$(mktemp)
    
    log "INFO" "Decompressing backup..."
    if ! gunzip -c "$backup_file" > "$temp_sql"; then
        rm -f "$temp_sql"
        error_exit "Failed to decompress backup"
    fi
    
    log "INFO" "Restoring database..."
    
    # Use psql to restore (pg_restore is for custom format)
    if ! PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$temp_sql" \
        > "$LOG_FILE" 2>&1; then
        rm -f "$temp_sql"
        error_exit "Database restore failed. Check logs: $LOG_FILE"
    fi
    
    rm -f "$temp_sql"
    log "INFO" "${GREEN}Database restored successfully${NC}"
}

# Main execution
main() {
    log "INFO" "=========================================="
    log "INFO" "BlackBow Database Restore Script"
    log "INFO" "Started at $(date)"
    log "INFO" "=========================================="
    
    # Parse command line arguments
    FORCE=false
    TARGET_BACKUP=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup)
                TARGET_BACKUP="$2"
                shift 2
                ;;
            --force)
                FORCE=true
                shift
                ;;
            *)
                log "WARN" "Unknown option: $1"
                shift
                ;;
        esac
    done
    
    cd "$PROJECT_ROOT" || error_exit "Failed to change to project root"
    
    # Setup
    parse_database_url
    check_prerequisites
    
    # Determine backup to restore
    if [ -z "$TARGET_BACKUP" ]; then
        log "INFO" "No backup specified, finding latest..."
        TARGET_BACKUP=$(get_latest_backup)
        log "INFO" "Latest backup: $TARGET_BACKUP"
    fi
    
    # Find backup file
    local backup_file=$(find_backup_file "$TARGET_BACKUP")
    
    # Verify integrity
    verify_backup "$backup_file"
    
    # Confirm restore
    confirm_restore "$TARGET_BACKUP"
    
    # Perform restore
    perform_restore "$backup_file"
    
    # Success
    log "INFO" "=========================================="
    log "INFO" "Restore completed successfully"
    log "INFO" "Restored from: $TARGET_BACKUP"
    log "INFO" "Completed at $(date)"
    log "INFO" "=========================================="
    
    send_telegram_notification "Database restored from: $TARGET_BACKUP" "success"
    exit 0
}

# Run main function
main "$@"
