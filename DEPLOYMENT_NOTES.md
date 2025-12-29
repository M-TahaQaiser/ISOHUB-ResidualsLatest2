# ISOHub Multi-Tenant Platform - Deployment Notes

## Pre-Deployment Checklist

### 1. Remove Mock Data
Before deploying to production, remove all sample/mock data:

- [ ] Remove sample agencies from database
- [ ] Remove test user credentials from login form
- [ ] Remove development-only test endpoints
- [ ] Replace placeholder email addresses with production emails
- [ ] Remove debug console.log statements
- [ ] Update environment variables for production

### 2. Domain & Email Configuration
The platform now includes comprehensive domain and email management:

- [ ] Configure DNS management service (Cloudflare/Route 53)
- [ ] Set up SSL certificate automation (Let's Encrypt)
- [ ] Configure SMTP settings for ISOHub's email service
- [ ] Set up SendGrid/Mailgun integration if needed
- [ ] Test domain verification system
- [ ] Test email delivery for all configured providers

### 3. Security Hardening
- [ ] Enable HTTPS only
- [ ] Configure proper CORS settings
- [ ] Set up rate limiting
- [ ] Enable SQL injection protection
- [ ] Configure input sanitization
- [ ] Set up proper session management
- [ ] Enable CSRF protection

### 4. Database Migration
- [ ] Backup existing data
- [ ] Run final database schema migration
- [ ] Verify all new domain/email fields are properly created
- [ ] Test database connections under load
- [ ] Set up database backup schedule

### 5. Environment Variables
Required production environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Email Service
GMAIL_USER=your-smtp-user@domain.com
GMAIL_PASS=your-app-specific-password

# Domain Management
CLOUDFLARE_API_TOKEN=your-cloudflare-token (optional)
AWS_ACCESS_KEY_ID=your-aws-key (optional)
AWS_SECRET_ACCESS_KEY=your-aws-secret (optional)

# SSL/TLS
LETSENCRYPT_EMAIL=admin@isohub.io

# Application
NODE_ENV=production
SESSION_SECRET=generate-strong-random-secret
```

### 6. Third-Party Service Setup

#### DNS Management (Choose One)
- **Cloudflare**: Set up API token with Zone:Edit permissions
- **AWS Route 53**: Configure IAM user with Route53 permissions
- **Manual**: Prepare documentation for client DNS setup

#### Email Service Configuration
- **ISOHub SMTP**: Configure internal SMTP server
- **SendGrid**: Set up API key and domain authentication
- **Mailgun**: Configure API key and domain verification

#### SSL Certificate Management
- **Let's Encrypt**: Automated certificate renewal
- **Cloudflare**: Proxy SSL certificates
- **Manual**: Client-provided certificates

### 7. Whitelabel Features Testing
- [ ] Test standard subdomain creation
- [ ] Test custom domain setup workflow
- [ ] Test subdomain availability checking
- [ ] Test DNS verification process
- [ ] Test email service switching
- [ ] Test SMTP connection validation
- [ ] Test agency-specific email templates

### 8. Performance Optimization
- [ ] Enable database connection pooling
- [ ] Configure caching for static assets
- [ ] Optimize image loading for agency logos
- [ ] Set up CDN for asset delivery
- [ ] Configure database query optimization
- [ ] Set up monitoring and alerting

### 9. Monitoring & Logging
- [ ] Set up application performance monitoring
- [ ] Configure error tracking (Sentry/Bugsnag)
- [ ] Set up log aggregation
- [ ] Configure uptime monitoring
- [ ] Set up SSL certificate expiration alerts
- [ ] Monitor domain verification status

### 10. Documentation
- [ ] Update API documentation
- [ ] Create client setup guides
- [ ] Document troubleshooting procedures
- [ ] Create admin user guides
- [ ] Document backup and recovery procedures

## New Features Added for Whitelabel Support

### Domain Management System
- **Three Setup Types**: Standard, Custom Domain, Subdomain
- **DNS Integration**: Cloudflare and AWS Route 53 support
- **Domain Verification**: TXT record verification system
- **SSL Automation**: Let's Encrypt integration
- **Status Tracking**: Real-time domain and SSL status

### Email Service Management
- **Multiple Providers**: ISOHub SMTP, Agency SMTP, SendGrid, Mailgun
- **SMTP Testing**: Connection validation before saving
- **Template Customization**: Agency-specific email branding
- **Delivery Tracking**: Email delivery monitoring

### Enhanced Onboarding
- **Domain Step Added**: New onboarding step for domain/email setup
- **Real-time Validation**: Live subdomain availability checking
- **Setup Instructions**: Dynamic DNS configuration guides
- **Visual Feedback**: Color-coded setup progress indicators

### Database Schema Updates
New fields added to `agencies` table:
- `domainType`, `customDomain`, `subdomainPrefix`
- `domainStatus`, `sslStatus`, `dnsProvider`
- `emailProvider`, `smtpHost`, `smtpPort`, `smtpUsername`, `smtpPassword`
- `fromEmailAddress`, `fromDisplayName`

### API Endpoints Added
- `/api/domain/*` - Domain management endpoints
- `/api/email/*` - Email service endpoints
- Domain verification, subdomain checking, SMTP testing

## Post-Deployment Tasks

### 1. Initial Setup
- [ ] Create super admin account
- [ ] Set up default email templates
- [ ] Configure DNS management service
- [ ] Test email delivery system
- [ ] Verify SSL certificate automation

### 2. Client Migration
- [ ] Import existing agency data
- [ ] Set up agency-specific domains/subdomains
- [ ] Configure email services for each agency
- [ ] Test whitelabel functionality
- [ ] Train agency administrators

### 3. Monitoring
- [ ] Monitor domain verification success rates
- [ ] Track email delivery rates
- [ ] Monitor SSL certificate renewals
- [ ] Check DNS propagation times
- [ ] Validate SMTP connection stability

## Support Documentation

### For Clients
- Domain setup instructions by DNS provider
- Email service configuration guides
- Troubleshooting common issues
- SSL certificate management

### For Support Team
- Domain verification procedures
- Email delivery troubleshooting
- SSL certificate management
- Escalation procedures

## Rollback Plan
1. Keep database backup before deployment
2. Document all configuration changes
3. Test rollback procedure in staging
4. Prepare emergency contact procedures
5. Document known issues and workarounds

This deployment adds comprehensive whitelabel domain and email management capabilities while maintaining backward compatibility with existing features.