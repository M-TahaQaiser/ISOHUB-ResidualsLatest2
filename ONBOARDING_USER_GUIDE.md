# ISOHub Organization Onboarding User Guide

## Overview

This guide walks through the complete sales-to-signup self-onboarding system that enables super admins to create new organization accounts, automatically send welcome emails with activation links, and guide new users through a comprehensive 7-step onboarding wizard.

## Process Flow

### 1. Super Admin Organization Creation

**Who:** Super Admin  
**When:** After sales completion  
**Where:** Organization Management Dashboard

#### Steps:
1. Navigate to "Organization Management" in the admin sidebar
2. Click "Create Organization" button
3. Fill out the organization creation form:
   - **Organization Name** (required)
   - **Website URL** (optional)
   - **Admin Contact Name** (required)
   - **Admin Contact Email** (required)
   - **Admin Contact Phone** (optional)
   - **Industry** (optional)

4. Review the "What happens next" information box
5. Click "Create Organization"

#### What Happens Automatically:
- ✅ Organization workspace is created with unique ID
- ✅ Welcome email with activation link is sent to admin contact
- ✅ Admin can activate account and begin onboarding
- ✅ 7-step guided setup process is initialized

### 2. Welcome Email & Account Activation

**Who:** New Organization Admin  
**When:** Immediately after organization creation  
**Where:** Email inbox + Activation page

#### Email Contents:
- Welcome message with organization details
- Secure activation link (24-hour expiration)
- Temporary password for initial access
- Instructions for account setup

#### Activation Process:
1. Click activation link in welcome email
2. Verify email address and organization details
3. Set new secure password (minimum 8 characters)
4. Confirm password
5. Complete activation to access onboarding wizard

### 3. 7-Step Onboarding Wizard

**Who:** New Organization Admin  
**When:** After successful account activation  
**Where:** Onboarding Wizard Interface

#### Step 1: Instance Setup
- **Purpose:** Configure basic instance settings
- **Fields:** Instance name, primary domain, basic preferences
- **Duration:** 2-3 minutes

#### Step 2: Company Information
- **Purpose:** Complete business profile and contact details
- **Fields:** Business address, phone, industry details, company size
- **Duration:** 3-5 minutes

#### Step 3: Organization Chart
- **Purpose:** Set up team structure and roles
- **Fields:** Department setup, role definitions, team member invitations
- **Duration:** 5-10 minutes

#### Step 4: Business Profile
- **Purpose:** AI-powered business profile generation
- **Fields:** Business description, target market, service offerings
- **Duration:** 3-5 minutes

#### Step 5: Vendor Selection
- **Purpose:** Choose from 36 available vendors across categories
- **Categories:**
  - **Processors** (7 vendors): Payment Advisors, Clearent, etc.
  - **Gateways** (11 vendors): Authorize.Net, Stripe, etc.
  - **Hardware/Equipment** (12 vendors): Ingenico, PAX, etc.
  - **Internal** (6 vendors): CRM systems, accounting tools, etc.
- **Duration:** 10-15 minutes

#### Step 6: Document Hub Integration
- **Purpose:** Connect document management systems
- **Options:**
  - Google Drive OAuth integration
  - Microsoft OneDrive connection
  - SharePoint integration
  - Dropbox connection
  - Manual document upload
- **Duration:** 5-10 minutes

#### Step 7: Dashboard Tour
- **Purpose:** Interactive platform walkthrough
- **Features:** Guided tour of main features, tips and best practices
- **Duration:** 5-10 minutes

### 4. Post-Onboarding Access

**Who:** Activated Organization Admin  
**When:** After completing onboarding wizard  
**Where:** Full platform access

#### Available Features:
- Complete dashboard access
- Residuals tracking and reporting
- AI-powered insights and reporting
- Vendor portal access
- Document management
- Team member management
- Commission assignment tools

## Technical Implementation

### Database Architecture
- **organizations**: Main organization records with branding and settings
- **onboarding_progress**: Step-by-step completion tracking
- **user_activations**: Secure activation token management
- **organization_vendors**: Selected vendor relationships
- **document_integrations**: OAuth and document hub connections

### Security Features
- 24-hour activation token expiration
- Secure password requirements
- Encrypted temporary passwords
- Role-based access control
- Organization data isolation

### Email Integration
- Professional HTML email templates
- SMTP delivery with tracking
- Activation link generation
- Welcome message customization

## Troubleshooting

### Common Issues

**Activation Link Expired**
- Generate new activation link from Organization Management
- Check email spam/junk folders
- Verify email address accuracy

**Onboarding Step Failures**
- Refresh page and retry
- Check internet connection
- Contact support if issues persist

**Vendor Selection Issues**
- Ensure all required categories are selected
- Verify vendor availability
- Contact vendor directly for integration support

**Document Integration Failures**
- Verify OAuth permissions
- Check account access rights
- Test connection manually

## Data Upload & Monthly Audit System

### Overview
The monthly audit system provides comprehensive verification and validation of uploaded processor data to ensure 100% accuracy before residual calculations.

### Data Upload Process

#### 1. Accessing Data Upload
- Navigate to "Data Upload" in the main sidebar
- Use the yellow "Monthly Audit" button in the header to review upload status
- Select the appropriate month from the dropdown selector

#### 2. Upload Areas
**Processors Supported:**
- Payment Advisors, Clearent, Global Payments TSYS
- Merchant Lynx, Micamp Solutions, First Data, Shift4

**File Formats:** CSV and Excel (.xlsx) files accepted

#### 3. Monthly Audit System

**Status Indicators:**
- 🔴 **Needs Upload** - No data uploaded for this month/processor
- 🟡 **Uploaded** - Data uploaded but requires verification
- 🟢 **Verified** - Data confirmed accurate and complete
- ⚠️ **Error** - Validation issues found requiring correction
- 🔵 **Corrected** - Errors resolved and ready for verification

**Error Correction Workflow:**
1. Click "View Errors" button on processor with issues
2. Review detailed error list with severity levels
3. Click "Correct" button for individual errors
4. Enter corrected value and reason
5. Apply correction with audit trail
6. Click "Verify" when all errors resolved

**Validation Features:**
- Data completeness and format accuracy
- Revenue calculation verification
- Duplicate detection and prevention
- Historical consistency checks

## Support Contacts

For technical support during onboarding:
- **Email:** support@isohub.io
- **Phone:** Available through organization settings
- **Documentation:** Available in platform help section

---

*This guide is automatically updated as new features are added to the onboarding system.*