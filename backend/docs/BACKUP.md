# BlackBow Associates - Backup & Restore Guide

## Overview

This document provides comprehensive instructions for managing database backups and restores for the BlackBow Associates platform. The backup system uses PostgreSQL's `pg_dump` utility with compression, checksums, and optional remote backup via Restic.

## Table of Contents

- [Backup System Architecture](#backup-system-architecture)
- [Automated Backups](#automated-backups)
- [Manual Backup Procedures](#manual-backup-procedures)
- [Restore Procedures](#restore-procedures)
- [Disaster Recovery](#disaster-recovery)
- [Troubleshooting](#troubleshooting)
- [Monitoring and Alerts](#monitoring-and-alerts)

---

## Backup System Architecture

### Components

1. **Backup Script** (`scripts/backup.sh`)
   - PostgreSQL database dump using `pg_dump`
   - Compression with `gzip`
   - SHA256 checksum generation
   - JSON manifest creation
   - Optional Restic upload for remote backup
   - Automatic cleanup of old backups (7-day retention)

2. **Restore Script** (`scripts/restore.sh`)
   - Backup listing and selection
   - Integrity verification via checksums
   - Safe restore with confirmation prompts
   - Error handling and logging

3. **Systemd Service & Timer**
   - Automated daily backups at 2:00 AM UTC
   - Systemd-managed scheduling
   - Automatic retry on failure

### Backup Storage Structure

```
backend/backups/
├── dumps/
│   ├── blackbow_backup_20250127_020000.sql.gz
│   ├── blackbow_backup_20250127_020000.sql.gz.sha256
│   ├── blackbow_backup_20250128_020000.sql.gz
│   └── blackbow_backup_20250128_020000.sql.gz.sha256
└── manifests/
    ├── blackbow_backup_20250127_020000.json
    └── blackbow_backup_20250128_020000.json
```

### Backup Manifest Format

Each backup includes a JSON manifest with metadata:

```json
{
  "backup_name": "blackbow_backup_20250127_020000",
  "timestamp": "20250127_020000",
  "created_at": "2025-01-27T02:00:00Z",
  "database": {
    "host": "localhost",
    "port": 5433,
    "name": "postgres",
    "user": "supabase_admin"
  },
  "backup_file": {
    "path": "blackbow_backup_20250127_020000.sql.gz",
    "size": "45M",
    "original_size": "180M",
    "checksum": {
      "algorithm": "SHA256",
      "value": "abc123..."
    }
  },
  "compression": "gzip",
  "retention_days": 7
}
```

---

## Automated Backups

### Setup

1. **Install Systemd Service and Timer**

   ```bash
   # Copy systemd files to system directory
   sudo cp backend/scripts/systemd/blackbow-backup.service /etc/systemd/system/
   sudo cp backend/scripts/systemd/blackbow-backup.timer /etc/systemd/system/
   
   # Reload systemd daemon
   sudo systemctl daemon-reload
   
   # Enable and start the timer
   sudo systemctl enable blackbow-backup.timer
   sudo systemctl start blackbow-backup.timer
   ```

2. **Verify Timer Status**

   ```bash
   # Check timer status
   sudo systemctl status blackbow-backup.timer
   
   # List all timers
   sudo systemctl list-timers blackbow-backup.timer
   
   # Check service logs
   sudo journalctl -u blackbow-backup.service -f
   ```

3. **Test Manual Execution**

   ```bash
   # Test the backup service manually
   sudo systemctl start blackbow-backup.service
   
   # Check logs
   sudo journalctl -u blackbow-backup.service -n 50
   ```

### Schedule

- **Default Schedule**: Daily at 2:00 AM UTC
- **Retention**: 7 days (local backups)
- **Remote Backup**: If Restic is configured, backups are also uploaded to remote repository

### Configuration

Edit `/etc/systemd/system/blackbow-backup.service` to modify:
- Backup directory: `Environment="BACKUP_DIR=..."`
- Log file location: `Environment="LOG_FILE=..."`
- Environment variables: `EnvironmentFile=...`

Edit `/etc/systemd/system/blackbow-backup.timer` to modify:
- Schedule: `OnCalendar=...`
- Boot delay: `OnBootSec=...`

---

## Manual Backup Procedures

### Creating a Backup

```bash
# Navigate to project directory
cd /home/newadmin/projects/blackbow-associates/backend

# Run backup script
./scripts/backup.sh

# Or use npm script
npm run backup
```

### Backup Script Options

```bash
# Force backup (skip checks)
./scripts/backup.sh --force
```

### Environment Variables

The backup script reads from `.env` file or environment variables:

- `DATABASE_URL`: PostgreSQL connection string (required)
- `BACKUP_DIR`: Backup directory (default: `backend/backups`)
- `LOG_FILE`: Log file path (default: `/var/log/desaas/blackbow-backup.log`)
- `RESTIC_REPOSITORY`: Restic repository path (optional)
- `RESTIC_PASSWORD`: Restic repository password (optional)

### Verifying Backup Integrity

```bash
# Check backup file checksum
cd backend/backups/dumps
sha256sum -c blackbow_backup_YYYYMMDD_HHMMSS.sql.gz.sha256

# View backup manifest
cat ../manifests/blackbow_backup_YYYYMMDD_HHMMSS.json | jq
```

---

## Restore Procedures

### Warning

⚠️ **RESTORING A DATABASE WILL OVERWRITE ALL EXISTING DATA. THIS ACTION CANNOT BE UNDONE.**

Always ensure you have a current backup before performing a restore.

### Listing Available Backups

```bash
# List all backups
cd /home/newadmin/projects/blackbow-associates/backend
./scripts/restore.sh --list
```

### Restore from Latest Backup

```bash
# Restore from latest backup (with confirmation prompt)
./scripts/restore.sh

# Restore without confirmation (use with caution!)
./scripts/restore.sh --force
```

### Restore from Specific Backup

```bash
# Restore from specific backup
./scripts/restore.sh --backup blackbow_backup_20250127_020000

# Restore without confirmation
./scripts/restore.sh --backup blackbow_backup_20250127_020000 --force
```

### Restore Process

1. **Verification**: Script verifies backup file integrity using SHA256 checksum
2. **Confirmation**: User must type "RESTORE" to confirm (unless `--force` is used)
3. **Decompression**: Backup file is decompressed
4. **Restore**: Database is restored using `psql`
5. **Notification**: Telegram notification sent on completion

### Restore Logs

Restore logs are written to: `/var/log/desaas/blackbow-restore.log`

```bash
# View restore logs
tail -f /var/log/desaas/blackbow-restore.log

# Or check recent logs
journalctl -u blackbow-backup.service -n 100
```

---

## Disaster Recovery

### Complete System Recovery

If the entire system needs to be recovered:

1. **Restore Database**

   ```bash
   # Stop application
   pm2 stop blackbow-api
   
   # Restore database
   cd /home/newadmin/projects/blackbow-associates/backend
   ./scripts/restore.sh --backup blackbow_backup_YYYYMMDD_HHMMSS
   
   # Restart application
   pm2 start blackbow-api
   ```

2. **Verify Application**

   ```bash
   # Check health endpoint
   curl http://localhost:3450/health
   
   # Check logs
   pm2 logs blackbow-api
   ```

### Partial Data Recovery

If only specific tables need to be recovered:

1. **Extract Specific Table from Backup**

   ```bash
   # Decompress backup
   gunzip -c backend/backups/dumps/blackbow_backup_YYYYMMDD_HHMMSS.sql.gz > temp_backup.sql
   
   # Extract specific table (e.g., users table)
   grep -A 10000 "CREATE TABLE.*users" temp_backup.sql > users_table.sql
   grep -A 10000 "COPY.*users" temp_backup.sql >> users_table.sql
   
   # Restore specific table
   psql -h localhost -p 5433 -U supabase_admin -d postgres -f users_table.sql
   
   # Cleanup
   rm temp_backup.sql users_table.sql
   ```

### Remote Backup Recovery (Restic)

If using Restic for remote backups:

```bash
# List snapshots
restic snapshots --tag blackbow-db

# Restore backup from Restic
restic restore latest --tag blackbow-db --target /tmp/restore

# Use restored backup for database restore
gunzip -c /tmp/restore/backups/dumps/blackbow_backup_*.sql.gz | psql -h localhost -p 5433 -U supabase_admin -d postgres
```

---

## Troubleshooting

### Backup Fails

**Problem**: Backup script exits with error

**Solutions**:

1. **Check Database Connection**

   ```bash
   # Test database connectivity
   pg_isready -h localhost -p 5433 -U supabase_admin
   ```

2. **Check Disk Space**

   ```bash
   df -h /home/newadmin/projects/blackbow-associates/backend/backups
   ```

3. **Check Permissions**

   ```bash
   # Ensure backup directory is writable
   ls -la backend/backups
   chmod 755 backend/backups
   ```

4. **View Backup Logs**

   ```bash
   tail -f /var/log/desaas/blackbow-backup.log
   ```

### Systemd Timer Not Running

**Problem**: Automated backups not executing

**Solutions**:

1. **Check Timer Status**

   ```bash
   sudo systemctl status blackbow-backup.timer
   ```

2. **Check Timer Schedule**

   ```bash
   sudo systemctl list-timers blackbow-backup.timer
   ```

3. **Check Service Logs**

   ```bash
   sudo journalctl -u blackbow-backup.service -n 100
   ```

4. **Manual Test**

   ```bash
   sudo systemctl start blackbow-backup.service
   sudo journalctl -u blackbow-backup.service -f
   ```

### Checksum Verification Fails

**Problem**: Backup file checksum doesn't match

**Solutions**:

1. **Re-download Backup** (if from remote)
2. **Check for File Corruption**

   ```bash
   # Verify file integrity
   sha256sum backend/backups/dumps/blackbow_backup_*.sql.gz
   ```

3. **Use Different Backup** if available

### Restore Fails

**Problem**: Database restore fails

**Solutions**:

1. **Check Database Connection**

   ```bash
   pg_isready -h localhost -p 5433 -U supabase_admin
   ```

2. **Check Database Size**

   ```bash
   # Ensure sufficient disk space
   df -h
   ```

3. **Check Logs**

   ```bash
   tail -f /var/log/desaas/blackbow-restore.log
   ```

4. **Verify Backup File**

   ```bash
   # Check if backup file is valid
   gunzip -t backend/backups/dumps/blackbow_backup_*.sql.gz
   ```

---

## Monitoring and Alerts

### Telegram Notifications

The backup system sends Telegram notifications for:
- ✅ Successful backups
- ❌ Backup failures
- 🔄 Restore operations

Notifications are sent via the local notification service (`http://localhost:3400/notify`).

### Log Monitoring

**Backup Logs**: `/var/log/desaas/blackbow-backup.log`

**Restore Logs**: `/var/log/desaas/blackbow-restore.log`

**Systemd Logs**: `journalctl -u blackbow-backup.service`

### Health Checks

```bash
# Check if backups are running
sudo systemctl status blackbow-backup.timer

# Check latest backup
ls -lth backend/backups/dumps/ | head -5

# Check backup disk usage
du -sh backend/backups/
```

### Backup Verification Script

Create a monitoring script to verify backups:

```bash
#!/bin/bash
# Check if backup exists from last 24 hours
LATEST_BACKUP=$(find backend/backups/dumps -name "blackbow_backup_*.sql.gz" -mtime -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "WARNING: No backup found in last 24 hours"
    exit 1
else
    echo "OK: Latest backup: $LATEST_BACKUP"
    exit 0
fi
```

---

## Best Practices

### 1. Regular Verification

- Test restore procedure monthly
- Verify backup integrity weekly
- Monitor backup logs daily

### 2. Retention Policy

- Keep 7 days of local backups
- Consider longer retention for remote backups (30+ days)
- Archive critical backups before major changes

### 3. Pre-Migration Backups

Always create a manual backup before:
- Database migrations
- Major code deployments
- System updates
- Configuration changes

### 4. Documentation

- Document all manual backup/restore operations
- Keep records of backup locations
- Maintain contact information for disaster recovery

### 5. Testing

- Test restore procedures on staging environment
- Verify backup completeness (check table counts)
- Test disaster recovery scenarios quarterly

---

## Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Systemd Timer Documentation](https://www.freedesktop.org/software/systemd/man/systemd.timer.html)
- [Restic Documentation](https://restic.readthedocs.io/)

---

## Support

For backup-related issues:
1. Check logs: `/var/log/desaas/blackbow-backup.log`
2. Review systemd status: `sudo systemctl status blackbow-backup.service`
3. Consult troubleshooting section above
4. Contact system administrator if issue persists

---

**Last Updated**: 2025-01-27  
**Maintained By**: BlackBow Associates DevOps Team
