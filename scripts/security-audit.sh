#!/bin/bash

# ISO Hub Security Audit Script
# Comprehensive security assessment and hardening verification

echo "🔒 ISO Hub Security Audit"
echo "========================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCORE=0
TOTAL_CHECKS=0

check_passed() {
    echo -e "${GREEN}✓ $1${NC}"
    ((SCORE++))
    ((TOTAL_CHECKS++))
}

check_failed() {
    echo -e "${RED}✗ $1${NC}"
    ((TOTAL_CHECKS++))
}

check_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((TOTAL_CHECKS++))
}

echo "1. Environment Security"
echo "======================"

# Check environment variables
if [[ -n "${DATABASE_URL}" ]]; then
    check_passed "DATABASE_URL is set"
else
    check_failed "DATABASE_URL is not configured"
fi

if [[ -n "${SESSION_SECRET}" ]]; then
    if [[ ${#SESSION_SECRET} -ge 32 ]]; then
        check_passed "SESSION_SECRET has adequate length"
    else
        check_warning "SESSION_SECRET should be at least 32 characters"
    fi
else
    check_failed "SESSION_SECRET is not configured"
fi

if [[ "${NODE_ENV}" == "production" ]]; then
    check_passed "NODE_ENV set to production"
else
    check_warning "NODE_ENV not set to production"
fi

echo ""
echo "2. Network Security"
echo "=================="

# Check for open ports
if command -v netstat >/dev/null; then
    OPEN_PORTS=$(netstat -tuln | grep LISTEN | wc -l)
    if [[ $OPEN_PORTS -le 5 ]]; then
        check_passed "Minimal open ports ($OPEN_PORTS)"
    else
        check_warning "Many open ports detected ($OPEN_PORTS)"
    fi
else
    check_warning "Cannot check open ports (netstat not available)"
fi

# Check firewall status
if command -v ufw >/dev/null; then
    if ufw status | grep -q "Status: active"; then
        check_passed "UFW firewall is active"
    else
        check_failed "UFW firewall is not active"
    fi
fi

echo ""
echo "3. Application Security"
echo "======================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    check_failed "Application running as root (security risk)"
else
    check_passed "Application not running as root"
fi

# Check SSL/TLS configuration
if [[ "${NODE_ENV}" == "production" ]]; then
    if [[ -n "${SSL_CERT_PATH}" ]] && [[ -f "${SSL_CERT_PATH}" ]]; then
        check_passed "SSL certificate configured"
    else
        check_failed "SSL certificate not configured for production"
    fi
fi

# Check for security headers
if curl -s -I "http://localhost:5000/health" | grep -q "X-Content-Type-Options"; then
    check_passed "Security headers present"
else
    check_warning "Security headers not detected"
fi

echo ""
echo "4. Database Security"
echo "=================="

# Check database connection encryption
if echo "${DATABASE_URL}" | grep -q "ssl=true\|sslmode=require"; then
    check_passed "Database SSL encryption enabled"
else
    check_warning "Database SSL encryption not explicitly enabled"
fi

# Check for default database credentials
if echo "${DATABASE_URL}" | grep -q "postgres:postgres\|user:password"; then
    check_failed "Default database credentials detected"
else
    check_passed "Non-default database credentials"
fi

echo ""
echo "5. File System Security"
echo "======================"

# Check file permissions
if [[ -d "/opt/isohub" ]]; then
    PERMS=$(stat -c "%a" /opt/isohub 2>/dev/null || stat -f "%A" /opt/isohub 2>/dev/null)
    if [[ "${PERMS}" == "755" ]] || [[ "${PERMS}" == "750" ]]; then
        check_passed "Application directory permissions secure"
    else
        check_warning "Application directory permissions: ${PERMS}"
    fi
fi

# Check for sensitive files
if [[ -f ".env" ]]; then
    check_warning ".env file present (consider using environment variables)"
fi

if [[ -f "package-lock.json" ]]; then
    check_passed "package-lock.json present (dependency integrity)"
fi

echo ""
echo "6. Monitoring and Logging"
echo "========================"

# Check health endpoint
if curl -s "http://localhost:5000/health" >/dev/null; then
    check_passed "Health endpoint responding"
else
    check_failed "Health endpoint not responding"
fi

# Check metrics endpoint
if curl -s "http://localhost:5000/metrics" >/dev/null; then
    check_passed "Metrics endpoint responding"
else
    check_warning "Metrics endpoint not responding"
fi

# Check log files
if [[ -d "/var/log/isohub" ]]; then
    check_passed "Application logs directory exists"
else
    check_warning "Application logs directory not found"
fi

echo ""
echo "7. Dependency Security"
echo "======================"

# Check for npm audit
if command -v npm >/dev/null; then
    AUDIT_RESULT=$(npm audit --json 2>/dev/null | jq -r '.metadata.vulnerabilities.total' 2>/dev/null || echo "unknown")
    if [[ "${AUDIT_RESULT}" == "0" ]]; then
        check_passed "No npm security vulnerabilities"
    elif [[ "${AUDIT_RESULT}" == "unknown" ]]; then
        check_warning "Cannot determine npm vulnerability status"
    else
        check_warning "${AUDIT_RESULT} npm vulnerabilities found"
    fi
fi

echo ""
echo "8. Runtime Security"
echo "=================="

# Check process limits
if ulimit -n >/dev/null 2>&1; then
    FILE_LIMIT=$(ulimit -n)
    if [[ $FILE_LIMIT -ge 1024 ]]; then
        check_passed "Adequate file descriptor limit ($FILE_LIMIT)"
    else
        check_warning "Low file descriptor limit ($FILE_LIMIT)"
    fi
fi

# Check memory limits
if [[ -f "/proc/meminfo" ]]; then
    TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    if [[ $TOTAL_MEM -ge 1048576 ]]; then  # 1GB in KB
        check_passed "Adequate system memory"
    else
        check_warning "Low system memory"
    fi
fi

echo ""
echo "9. Backup and Recovery"
echo "===================="

if [[ -d "/var/backups/isohub" ]]; then
    check_passed "Backup directory exists"
    
    BACKUP_COUNT=$(find /var/backups/isohub -name "backup-*" 2>/dev/null | wc -l)
    if [[ $BACKUP_COUNT -gt 0 ]]; then
        check_passed "Application backups present ($BACKUP_COUNT)"
    else
        check_warning "No application backups found"
    fi
else
    check_warning "Backup directory not configured"
fi

echo ""
echo "10. Security Monitoring"
echo "======================"

# Check fail2ban
if command -v fail2ban-client >/dev/null; then
    if fail2ban-client status >/dev/null 2>&1; then
        check_passed "Fail2ban is active"
    else
        check_warning "Fail2ban not running"
    fi
else
    check_warning "Fail2ban not installed"
fi

# Check for intrusion detection
if command -v aide >/dev/null || command -v tripwire >/dev/null; then
    check_passed "Intrusion detection system present"
else
    check_warning "No intrusion detection system detected"
fi

echo ""
echo "==============================================="
echo "Security Audit Results"
echo "==============================================="

PERCENTAGE=$((SCORE * 100 / TOTAL_CHECKS))

echo "Score: $SCORE / $TOTAL_CHECKS ($PERCENTAGE%)"

if [[ $PERCENTAGE -ge 90 ]]; then
    echo -e "${GREEN}🛡️  Excellent security posture${NC}"
elif [[ $PERCENTAGE -ge 80 ]]; then
    echo -e "${YELLOW}⚠️  Good security with room for improvement${NC}"
elif [[ $PERCENTAGE -ge 70 ]]; then
    echo -e "${YELLOW}⚠️  Moderate security - improvements needed${NC}"
else
    echo -e "${RED}🚨 Poor security posture - immediate action required${NC}"
fi

echo ""
echo "Recommendations:"
echo "==============="

if [[ $PERCENTAGE -lt 90 ]]; then
    echo "• Fix all failed security checks"
    echo "• Address security warnings"
    echo "• Enable missing monitoring systems"
    echo "• Review and update security policies"
fi

if [[ "${NODE_ENV}" != "production" ]]; then
    echo "• Set NODE_ENV=production for production deployment"
fi

echo "• Regular security audits (monthly)"
echo "• Keep dependencies updated"
echo "• Monitor security logs daily"
echo "• Test backup and recovery procedures"

echo ""
echo "Audit completed at $(date)"