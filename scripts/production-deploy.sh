#!/bin/bash

# ISO Hub Production Deployment Script
# Security-First Deployment Automation

set -e  # Exit on any error
set -u  # Exit on undefined variables

echo "🔒 ISO Hub Production Deployment - Security First"
echo "=================================================="

# Configuration
PROJECT_NAME="isohub"
BACKUP_DIR="/var/backups/isohub"
LOG_DIR="/var/log/isohub"
APP_DIR="/opt/isohub"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Phase 1: Pre-deployment Security Checks
echo "Phase 1: Security Verification"
echo "=============================="

# Check required environment variables
log "Checking required secrets..."
required_secrets=(
    "DATABASE_URL"
    "SESSION_SECRET"
    "ANTHROPIC_API_KEY"
)

for secret in "${required_secrets[@]}"; do
    if [[ -z "${!secret:-}" ]]; then
        error "Required secret $secret is not set"
    else
        success "✓ $secret is configured"
    fi
done

# Check database connectivity
log "Testing database connection..."
if ! timeout 10 bash -c "</dev/tcp/${DB_HOST:-localhost}/${DB_PORT:-5432}"; then
    error "Cannot connect to database"
else
    success "✓ Database connection successful"
fi

# Validate SSL certificates
log "Checking SSL configuration..."
if [[ "${NODE_ENV}" == "production" ]]; then
    if [[ -z "${SSL_CERT_PATH:-}" ]] || [[ -z "${SSL_KEY_PATH:-}" ]]; then
        error "SSL certificates required for production"
    fi
    
    if [[ ! -f "${SSL_CERT_PATH}" ]] || [[ ! -f "${SSL_KEY_PATH}" ]]; then
        error "SSL certificate files not found"
    fi
    
    success "✓ SSL certificates validated"
fi

# Phase 2: Infrastructure Setup
echo ""
echo "Phase 2: Infrastructure Setup"
echo "============================="

# Create necessary directories
log "Creating application directories..."
sudo mkdir -p "$APP_DIR" "$LOG_DIR" "$BACKUP_DIR"
sudo chown -R app:app "$APP_DIR" "$LOG_DIR" "$BACKUP_DIR"

# Set up log rotation
log "Configuring log rotation..."
cat <<EOF | sudo tee /etc/logrotate.d/isohub
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 app app
    postrotate
        systemctl reload isohub || true
    endscript
}
EOF

# Set up systemd service
log "Installing systemd service..."
cat <<EOF | sudo tee /etc/systemd/system/isohub.service
[Unit]
Description=ISO Hub Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=app
Group=app
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
EnvironmentFile=/etc/isohub/environment
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=file:$LOG_DIR/app.log
StandardError=file:$LOG_DIR/error.log

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR $LOG_DIR
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF

# Phase 3: Application Deployment
echo ""
echo "Phase 3: Application Deployment"
echo "==============================="

# Create backup of current deployment
if [[ -d "$APP_DIR/current" ]]; then
    log "Creating backup of current deployment..."
    sudo cp -r "$APP_DIR/current" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    success "✓ Backup created"
fi

# Deploy new application
log "Deploying application code..."
sudo rm -rf "$APP_DIR/new"
sudo mkdir -p "$APP_DIR/new"

# Copy application files (this would be from your CI/CD pipeline)
sudo cp -r . "$APP_DIR/new/"
sudo chown -R app:app "$APP_DIR/new"

# Install dependencies
log "Installing production dependencies..."
cd "$APP_DIR/new"
sudo -u app npm ci --production --silent

# Build application
log "Building application..."
sudo -u app npm run build

# Run database migrations
log "Running database migrations..."
sudo -u app npm run db:migrate

# Phase 4: Security Hardening
echo ""
echo "Phase 4: Security Hardening"
echo "=========================="

# Set up firewall rules
log "Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
success "✓ Firewall configured"

# Configure fail2ban
log "Setting up fail2ban..."
cat <<EOF | sudo tee /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
logpath = /var/log/nginx/error.log
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
success "✓ Fail2ban configured"

# Set up automatic security updates
log "Configuring automatic security updates..."
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
sudo systemctl enable unattended-upgrades
success "✓ Automatic security updates enabled"

# Phase 5: Monitoring Setup
echo ""
echo "Phase 5: Monitoring Setup"
echo "========================"

# Set up health check monitoring
log "Setting up health check monitoring..."
cat <<EOF | sudo tee /usr/local/bin/isohub-healthcheck
#!/bin/bash
HEALTH_URL="http://localhost:5000/health"
TIMEOUT=10

if ! curl -sf --max-time \$TIMEOUT "\$HEALTH_URL" > /dev/null; then
    echo "Health check failed for \$HEALTH_URL"
    # In production, this would trigger alerts
    systemctl restart isohub
fi
EOF

sudo chmod +x /usr/local/bin/isohub-healthcheck

# Set up health check cron job
echo "*/5 * * * * /usr/local/bin/isohub-healthcheck" | sudo crontab -u app -

# Set up log monitoring
log "Setting up log monitoring..."
cat <<EOF | sudo tee /usr/local/bin/isohub-logmonitor
#!/bin/bash
LOG_FILE="$LOG_DIR/error.log"
ALERT_PATTERNS=("ERROR" "SECURITY" "CRITICAL")

tail -f "\$LOG_FILE" | while read line; do
    for pattern in "\${ALERT_PATTERNS[@]}"; do
        if echo "\$line" | grep -q "\$pattern"; then
            echo "ALERT: \$line" | logger -t isohub-monitor
            # In production, send to monitoring service
        fi
    done
done &
EOF

sudo chmod +x /usr/local/bin/isohub-logmonitor

# Phase 6: Final Deployment
echo ""
echo "Phase 6: Final Deployment"
echo "========================"

# Stop current application
if sudo systemctl is-active --quiet isohub; then
    log "Stopping current application..."
    sudo systemctl stop isohub
fi

# Switch to new deployment
log "Switching to new deployment..."
sudo rm -rf "$APP_DIR/previous"
if [[ -d "$APP_DIR/current" ]]; then
    sudo mv "$APP_DIR/current" "$APP_DIR/previous"
fi
sudo mv "$APP_DIR/new" "$APP_DIR/current"

# Start application
log "Starting application..."
sudo systemctl daemon-reload
sudo systemctl enable isohub
sudo systemctl start isohub

# Wait for startup
log "Waiting for application startup..."
sleep 10

# Verify deployment
log "Verifying deployment..."
if sudo systemctl is-active --quiet isohub; then
    success "✓ Application is running"
else
    error "Application failed to start"
fi

# Test health endpoint
if curl -sf "http://localhost:5000/health" > /dev/null; then
    success "✓ Health check passed"
else
    error "Health check failed"
fi

# Phase 7: Post-deployment
echo ""
echo "Phase 7: Post-deployment"
echo "======================="

# Clean up old backups (keep last 7 days)
log "Cleaning up old backups..."
find "$BACKUP_DIR" -name "backup-*" -mtime +7 -delete

# Display deployment summary
echo ""
success "🎉 ISO Hub deployed successfully!"
echo ""
echo "Deployment Summary:"
echo "=================="
echo "• Application URL: https://$(hostname)"
echo "• Health Check: https://$(hostname)/health"
echo "• Metrics: https://$(hostname)/metrics"
echo "• Logs: $LOG_DIR/"
echo "• Status: $(sudo systemctl is-active isohub)"
echo ""
echo "Next Steps:"
echo "==========="
echo "1. Configure DNS and SSL certificates"
echo "2. Set up monitoring alerts"
echo "3. Configure backup procedures"
echo "4. Test all application features"
echo ""
warning "Remember to:"
warning "• Monitor application logs for the first hour"
warning "• Verify all integrations are working"
warning "• Test user authentication flows"
warning "• Validate data processing pipelines"

echo ""
echo "Deployment completed at $(date)"