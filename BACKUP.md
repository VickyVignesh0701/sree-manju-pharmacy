# Backup & Restore

This covers the MySQL database only — it's where every real business record lives
(inventory, sales, patients, staff, activity log). The application code itself is just
files; if you're deploying from this repo, code doesn't need a separate backup strategy
beyond normal version control.

## Manual backup

```bash
mysqldump -u youruser -p \
  --single-transaction \
  --routines \
  --triggers \
  sree_manju_pharmacy > backup_$(date +%Y%m%d_%H%M%S).sql
```

`--single-transaction` takes a consistent snapshot without locking tables — important on a
live system, since this app is in active use during business hours.

Store the resulting `.sql` file somewhere other than the same server (a separate disk, offsite
storage, or a cloud bucket). A backup that lives next to the database it protects doesn't survive
the failure it's meant to protect against.

## Automated daily backup (cron)

Add a script, e.g. `/usr/local/bin/pharmacy-backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/pharmacy"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

mysqldump -u youruser -p"$DB_PASSWORD" \
  --single-transaction --routines --triggers \
  sree_manju_pharmacy | gzip > "$BACKUP_DIR/pharmacy_$TIMESTAMP.sql.gz"

# Remove backups older than the retention window
find "$BACKUP_DIR" -name "pharmacy_*.sql.gz" -mtime +$RETENTION_DAYS -delete
```

```bash
chmod +x /usr/local/bin/pharmacy-backup.sh
crontab -e
# Run every day at 2 AM
0 2 * * * /usr/local/bin/pharmacy-backup.sh >> /var/log/pharmacy-backup.log 2>&1
```

Set `DB_PASSWORD` in the script's environment (or a `~/.my.cnf` with restricted permissions)
rather than hard-coding it in the script file itself.

**Copy backups off the server** — a nightly `rsync`, `rclone` to cloud storage, or similar. A
cron job that only writes to local disk still fails the "survives a full server loss" test.

## Restore

```bash
# From a plain .sql file
mysql -u youruser -p sree_manju_pharmacy < backup_20260901_020000.sql

# From a gzipped backup
gunzip < pharmacy_20260901_020000.sql.gz | mysql -u youruser -p sree_manju_pharmacy
```

This overwrites existing data in the target database. To restore into a fresh
database instead of overwriting the live one:

```bash
mysql -u youruser -p -e "CREATE DATABASE sree_manju_pharmacy_restore CHARACTER SET utf8mb4"
mysql -u youruser -p sree_manju_pharmacy_restore < backup_20260901_020000.sql
```

## Before you actually need this

Test the restore process before an emergency forces you to. A backup nobody has ever restored
from is an assumption, not a safety net. Periodically:

1. Restore the latest backup into a throwaway database (as above).
2. Point a local copy of the app at it.
3. Confirm login works and recent data is present.
