# Domain & Email Setup Requirements for ISOHub Multi-Tenant Platform

## Overview
This document outlines the technical requirements and client information needed to set up whitelabel domains and email services for agencies in the ISOHub platform.

## Domain Setup Types

### 1. Standard Setup (isohub.io)
- **Description**: Uses ISOHub subdomain structure
- **Format**: `agency-name.isohub.io`
- **Requirements**: None from client
- **Backend Tasks**: 
  - Configure subdomain routing
  - SSL certificate (wildcard *.isohub.io)
  - Update DNS records automatically

### 2. Custom Domain Setup
- **Description**: Client's own domain (e.g., `yourcompany.com`)
- **Format**: `yourcompany.com` or `app.yourcompany.com`
- **Client Requirements**:
  - Domain ownership verification
  - DNS access (ability to add A/CNAME records)
  - SSL certificate preferences
- **Backend Tasks**:
  - Domain ownership verification
  - DNS configuration guidance
  - SSL certificate provisioning (Let's Encrypt or client-provided)
  - CNAME/A record setup instructions

### 3. Subdomain on ISOHub
- **Description**: Company subdomain on ISOHub infrastructure
- **Format**: `companyname.isohub.io`
- **Requirements**: Subdomain prefix validation
- **Backend Tasks**:
  - Subdomain creation
  - SSL certificate (wildcard coverage)
  - Routing configuration

## Email Service Configuration

### 1. ISOHub SMTP (Recommended)
- **Description**: Use ISOHub's email infrastructure
- **Client Requirements**: None
- **Configuration**: Automatic setup with ISOHub branding
- **From Address**: `noreply@isohub.io` or `noreply@agency-subdomain.isohub.io`

### 2. Agency Custom SMTP
- **Description**: Client's own email server/service
- **Client Requirements**:
  - SMTP server details (host, port, security)
  - Authentication credentials
  - From address configuration
  - SPF/DKIM records setup
- **Configuration Fields**:
  - SMTP Host (e.g., smtp.gmail.com, mail.company.com)
  - SMTP Port (587 for TLS, 465 for SSL)
  - Username/Password or App Password
  - From Email Address
  - From Display Name
  - Security Type (TLS/SSL/None)

### 3. Third-Party Email Services
- **SendGrid Integration**:
  - API Key
  - From email verification
  - Domain authentication (SPF, DKIM, DMARC)
- **Mailgun Integration**:
  - API Key
  - Domain verification
  - Webhook configuration

## Technical Implementation Requirements

### Domain Management Backend
1. **DNS Management Service**:
   - Cloudflare API integration
   - AWS Route 53 integration
   - Domain verification system
   - SSL certificate automation (Let's Encrypt)

2. **Database Fields** (Already implemented in agencies table):
   - `domainType` (standard, custom_domain, subdomain)
   - `customDomain` (client's domain)
   - `subdomainPrefix` (for subdomain setup)
   - `domainStatus` (pending, configuring, active, error)
   - `sslStatus` (pending, issued, expired, error)
   - `dnsProvider` (cloudflare, godaddy, namecheap, route53, other)

### Email Service Backend
1. **SMTP Configuration Management**:
   - Secure credential storage (encrypted)
   - SMTP connection testing
   - Email template system with agency branding
   - Delivery tracking and logging

2. **Database Fields** (Already implemented):
   - `emailProvider` (isohub_smtp, agency_smtp, sendgrid, mailgun)
   - `smtpHost`, `smtpPort`, `smtpUsername`, `smtpPassword`
   - `fromEmailAddress`, `fromDisplayName`

### Client Information Gathering Form
When agencies choose whitelabel setup, collect:

#### For Custom Domain:
- [ ] Domain name (e.g., yourcompany.com)
- [ ] DNS provider/registrar
- [ ] Admin contact for DNS changes
- [ ] Preferred subdomain (if any) - app, portal, payments
- [ ] SSL certificate preference (auto/manual)

#### For Custom Email:
- [ ] Email service provider
- [ ] SMTP server details
- [ ] Authentication method
- [ ] From address preferences
- [ ] Display name for emails
- [ ] Support email address
- [ ] SPF/DKIM setup assistance needed (yes/no)

#### For Both:
- [ ] Go-live timeline
- [ ] Technical contact information
- [ ] Support level needed (self-service, assisted, managed)

## Setup Process Workflow

### Phase 1: Information Collection
1. Agency selects domain type during onboarding
2. System collects required information based on selection
3. Validation of provided information (domain ownership, email testing)

### Phase 2: Configuration
1. **Standard/Subdomain**: Automatic setup
2. **Custom Domain**: 
   - Generate DNS instructions for client
   - Verify domain ownership
   - Configure SSL certificate
   - Set up routing

### Phase 3: Email Setup
1. **ISOHub SMTP**: Automatic configuration
2. **Custom SMTP**: 
   - Test connection with provided credentials
   - Configure email templates with agency branding
   - Set up delivery tracking

### Phase 4: Testing & Activation
1. Domain accessibility testing
2. SSL certificate verification
3. Email delivery testing
4. Agency notification and training

## Integration Points

### Frontend Integration
- Domain setup wizard in onboarding flow
- Real-time domain availability checking
- DNS configuration guidance display
- Email testing interface

### Backend Integration
- Domain management API endpoints
- Email service configuration API
- Status monitoring and reporting
- Automated SSL renewal system

### Third-Party Integrations
- DNS management APIs (Cloudflare, Route 53)
- SSL certificate providers (Let's Encrypt)
- Email service providers (SendGrid, Mailgun)
- Domain registrars for verification

## Security Considerations

1. **Domain Security**:
   - Domain ownership verification before configuration
   - SSL certificate automation and monitoring
   - DNS record validation

2. **Email Security**:
   - Encrypted storage of SMTP credentials
   - SPF/DKIM/DMARC configuration guidance
   - Email delivery monitoring and logging

3. **Data Protection**:
   - Secure API endpoints for configuration
   - Audit logging for all domain/email changes
   - Role-based access control for configuration

## Support Documentation

### For Clients
- Domain setup instructions by provider
- DNS configuration guides
- Email service setup tutorials
- Troubleshooting common issues

### For Support Team
- Domain verification procedures
- Email delivery troubleshooting
- SSL certificate management
- Escalation procedures for technical issues

This comprehensive setup ensures agencies can choose between simple standard setup or advanced whitelabel configuration while maintaining security and reliability.