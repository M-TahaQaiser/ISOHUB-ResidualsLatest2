#!/bin/bash
# Development Backup Script for ISO Hub Platform

# Create timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/dev_$TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Copy critical files
echo "Creating development backup: $BACKUP_DIR"

# Core application files
cp -r client/ "$BACKUP_DIR/"
cp -r server/ "$BACKUP_DIR/"
cp -r shared/ "$BACKUP_DIR/"

# Configuration files
cp package.json "$BACKUP_DIR/"
cp tsconfig.json "$BACKUP_DIR/"
cp tailwind.config.ts "$BACKUP_DIR/"
cp vite.config.ts "$BACKUP_DIR/"
cp drizzle.config.ts "$BACKUP_DIR/"

# Documentation
cp replit.md "$BACKUP_DIR/"
cp DEVELOPMENT_LOG.md "$BACKUP_DIR/"

echo "Backup created successfully at: $BACKUP_DIR"
echo "Files backed up:"
echo "- client/ (React frontend)"
echo "- server/ (Express backend)" 
echo "- shared/ (Common schemas)"
echo "- Configuration files"
echo "- Documentation"

# Create backup log entry
echo "$(date): Backup created at $BACKUP_DIR" >> backups/backup_log.txt