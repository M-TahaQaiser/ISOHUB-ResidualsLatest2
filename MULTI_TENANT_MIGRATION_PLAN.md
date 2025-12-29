# ISO Hub Multi-Tenant Migration Plan
## Complete Database Restructuring & Data Migration Strategy

*Prepared: January 2025*  
*Status: Planning & Design Phase*

---

## 🎯 **EXECUTIVE SUMMARY**

This document outlines the complete plan to transform ISO Hub from a single-tenant system to a true multi-tenant SaaS platform where each agency operates in complete data isolation.

**Current State:**
- 719 merchants in database
- 716 monthly data records
- 132 role assignments
- NO agency association - all data in "global" scope
- Default organizationId: "org-86f76df1"

**Target State:**
- All data scoped to specific agencies
- **First Tenant: Tracer C2FS** receives all existing data (719 merchants, 716 monthly records, 132 assignments)
- New agencies start with clean, isolated environments
- Full data isolation and security
- **Each tenant has independent OAuth configurations** for Dropbox, OneDrive, and Google Drive

---

## 📊 **CURRENT DATABASE STRUCTURE ANALYSIS**

### Tables WITHOUT Agency Scoping (Need Migration)
1. **merchants** (719 records)
   - Current: No agency_id field
   - Impact: All merchants are "global"
   
2. **monthly_data** (716 records)
   - Current: No agency_id field
   - Impact: Revenue data not scoped to agencies

3. **mid_role_assignments** 
   - Current: No agency_id field
   - Impact: Role assignments not tenant-specific

4. **assignments** (132 records)
   - Current: No agency_id field
   - Impact: Commission assignments not scoped

5. **processors**
   - Current: No agency_id field
   - Impact: Processors shared globally (this may be intentional)

6. **roles**
   - Current: No agency_id field
   - Impact: Roles shared globally (this may be intentional)

7. **audit_issues**
   - Current: No agency_id field
   - Impact: Audit data not scoped to agencies

8. **file_uploads**
   - Current: No agency_id field
   - Impact: Upload history not tenant-specific

9. **upload_progress**
   - Current: No agency_id field
   - Impact: Workflow progress not scoped

10. **no_mid_declarations**
    - Current: No agency_id field
    - Impact: Processor declarations not scoped

### Tables WITH Agency Scoping (Already Correct)
- **users** (has agencyId + organizationId)
- **agencies** (primary tenant table)
- **email_tracking** (has agencyId)
- **pre_applications** (has organizationId)
- **short_urls** (has organizationId)
- **onboarding_steps** (has agencyId)

### New Tables Required for OAuth Integration
- **agency_oauth_credentials** (NEW - stores OAuth tokens per agency)
  - Required for: Dropbox, OneDrive, Google Drive integrations
  - Each agency has independent OAuth connections
  - Supports token refresh and expiration tracking

---

## ☁️ **CLOUD STORAGE OAUTH REQUIREMENTS**

### Multi-Tenant OAuth Architecture

Each agency requires independent OAuth configurations for cloud storage integrations:

1. **Dropbox Integration**
   - OAuth 2.0 with app-level credentials
   - Per-agency access tokens and refresh tokens
   - File upload/download capabilities
   - Automatic token refresh

2. **OneDrive Integration**  
   - Microsoft Graph API OAuth 2.0
   - Per-agency Microsoft app credentials
   - SharePoint integration support
   - Automatic token refresh

3. **Google Drive Integration**
   - Google OAuth 2.0 with Drive API
   - Per-agency Google Cloud project credentials
   - File storage and sharing capabilities
   - Automatic token refresh

### OAuth Storage Schema

```typescript
export const agencyOAuthCredentials = pgTable("agency_oauth_credentials", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(),
  provider: varchar("provider", { 
    length: 20,
    enum: ["dropbox", "onedrive", "google_drive"]
  }).notNull(),
  
  // OAuth Credentials
  clientId: text("client_id"), // Encrypted
  clientSecret: text("client_secret"), // Encrypted
  accessToken: text("access_token"), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  
  // Token Management
  tokenType: varchar("token_type", { length: 20 }),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  
  // Connection Status
  isActive: boolean("is_active").default(true),
  isConnected: boolean("is_connected").default(false),
  lastConnected: timestamp("last_connected"),
  lastRefreshed: timestamp("last_refreshed"),
  
  // Metadata
  userId: text("user_id"), // Provider's user ID
  userName: text("user_name"), // Provider's user name
  userEmail: text("user_email"), // Provider's email
  
  // Error Handling
  lastError: text("last_error"),
  errorCount: integer("error_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueAgencyProvider: unique().on(table.agencyId, table.provider),
}));
```

### OAuth Migration SQL

```sql
-- Create OAuth credentials table
CREATE TABLE agency_oauth_credentials (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL REFERENCES agencies(id),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('dropbox', 'onedrive', 'google_drive')),
  
  -- OAuth Credentials (will be encrypted in application layer)
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  
  -- Token Management
  token_type VARCHAR(20),
  expires_at TIMESTAMP,
  scope TEXT,
  
  -- Connection Status
  is_active BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  last_connected TIMESTAMP,
  last_refreshed TIMESTAMP,
  
  -- Metadata
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  
  -- Error Handling
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT agency_oauth_credentials_agency_id_provider_unique UNIQUE (agency_id, provider)
);

-- Create indexes for performance
CREATE INDEX idx_agency_oauth_credentials_agency_id ON agency_oauth_credentials(agency_id);
CREATE INDEX idx_agency_oauth_credentials_provider ON agency_oauth_credentials(provider);
CREATE INDEX idx_agency_oauth_credentials_active ON agency_oauth_credentials(is_active, is_connected);
```

### OAuth Integration Implementation Guide

#### 1. Dropbox OAuth Flow
```typescript
// Dropbox OAuth configuration per agency
const dropboxConfig = {
  clientId: process.env[`DROPBOX_CLIENT_ID_AGENCY_${agencyId}`],
  clientSecret: process.env[`DROPBOX_CLIENT_SECRET_AGENCY_${agencyId}`],
  redirectUri: `https://yourdomain.com/oauth/dropbox/callback`,
};

// Authorization URL
const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;

// Token exchange
const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=authorization_code&code=${code}&client_id=${clientId}&client_secret=${clientSecret}`,
});
```

#### 2. OneDrive OAuth Flow
```typescript
// Microsoft Graph OAuth configuration per agency
const oneDriveConfig = {
  clientId: process.env[`MICROSOFT_CLIENT_ID_AGENCY_${agencyId}`],
  clientSecret: process.env[`MICROSOFT_CLIENT_SECRET_AGENCY_${agencyId}`],
  tenantId: 'common', // Or specific tenant ID
  redirectUri: `https://yourdomain.com/oauth/onedrive/callback`,
  scopes: ['Files.ReadWrite', 'Files.ReadWrite.All'],
};

// Authorization URL
const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes.join(' ')}`;

// Token exchange
const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=authorization_code&code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}`,
});
```

#### 3. Google Drive OAuth Flow
```typescript
// Google OAuth configuration per agency
const googleDriveConfig = {
  clientId: process.env[`GOOGLE_CLIENT_ID_AGENCY_${agencyId}`],
  clientSecret: process.env[`GOOGLE_CLIENT_SECRET_AGENCY_${agencyId}`],
  redirectUri: `https://yourdomain.com/oauth/google/callback`,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
};

// Authorization URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join(' ')}&access_type=offline&prompt=consent`;

// Token exchange
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=authorization_code&code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}`,
});
```

### Security Best Practices

1. **Token Encryption**
   - All OAuth tokens stored in database MUST be encrypted
   - Use AES-256-GCM encryption for token storage
   - Encryption keys managed via environment variables
   - Never log decrypted tokens

2. **Token Refresh Strategy**
   - Implement automatic token refresh before expiration
   - Retry failed refresh attempts with exponential backoff
   - Alert agency admins when refresh fails after 3 attempts
   - Gracefully handle revoked tokens

3. **Per-Agency Isolation**
   - Each agency has separate OAuth apps/projects
   - Tokens stored with agency_id foreign key
   - API calls always scoped to agency context
   - Cross-agency token access prevented

4. **Audit Trail**
   - Log all OAuth connection/disconnection events
   - Track token refresh activities
   - Monitor failed authentication attempts
   - Alert on suspicious OAuth activities

---

## 🏗️ **MIGRATION ARCHITECTURE**

### Phase 1: Create First Agency (Tenant #1)

#### Step 1.1: Create First Tenant - Tracer C2FS
```sql
INSERT INTO agencies (
  id,
  company_name,
  contact_name,
  email,
  phone,
  status,
  admin_username,
  primary_color,
  secondary_color,
  accent_color,
  is_whitelabel,
  created_at
) VALUES (
  1,
  'Tracer C2FS',
  'System Administrator',
  'admin@tracerc2fs.com',
  NULL,
  'active',
  'admin',
  '#FFD700',  -- Yellow
  '#000000',  -- Black
  '#FFFFFF',  -- White
  true,       -- White-label enabled
  NOW()
);
```

**Important:** All existing data (719 merchants, 716 monthly records, 132 assignments) will be migrated into the Tracer C2FS tenancy.

#### Step 1.2: Link Existing Users to First Agency
```sql
-- Update all existing users to belong to Agency #1
UPDATE users 
SET agency_id = 1 
WHERE agency_id IS NULL;
```

---

## 🔄 **SCHEMA MIGRATION PLAN**

### Phase 2: Add Agency Foreign Keys to Core Tables

#### 2.1: Update `merchants` Table
```typescript
// In shared/schema.ts
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(), // NEW
  mid: text("mid").notNull(),
  legalName: text("legal_name"),
  dba: text("dba"),
  branchNumber: text("branch_number"),
  status: text("status"),
  statusCategory: text("status_category"),
  currentProcessor: text("current_processor"),
  partnerName: text("partner_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueAgencyMid: unique().on(table.agencyId, table.mid), // NEW: Unique MID per agency
}));
```

**Migration SQL:**
```sql
-- Step 1: Add column (nullable first)
ALTER TABLE merchants ADD COLUMN agency_id INTEGER;

-- Step 2: Set all existing records to Agency #1
UPDATE merchants SET agency_id = 1;

-- Step 3: Add foreign key constraint
ALTER TABLE merchants 
ADD CONSTRAINT merchants_agency_id_fk 
FOREIGN KEY (agency_id) REFERENCES agencies(id);

-- Step 4: Make it NOT NULL
ALTER TABLE merchants ALTER COLUMN agency_id SET NOT NULL;

-- Step 5: Update unique constraint (drop old, add new)
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_mid_unique;
ALTER TABLE merchants ADD CONSTRAINT merchants_agency_id_mid_unique UNIQUE (agency_id, mid);
```

#### 2.2: Update `monthly_data` Table
```typescript
export const monthlyData = pgTable("monthly_data", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(), // NEW
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  processorId: integer("processor_id").references(() => processors.id).notNull(),
  month: text("month").notNull(),
  // ... rest of fields
});
```

**Migration SQL:**
```sql
ALTER TABLE monthly_data ADD COLUMN agency_id INTEGER;
UPDATE monthly_data SET agency_id = 1;
ALTER TABLE monthly_data 
ADD CONSTRAINT monthly_data_agency_id_fk 
FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE monthly_data ALTER COLUMN agency_id SET NOT NULL;
```

#### 2.3: Update `mid_role_assignments` Table
```typescript
export const midRoleAssignments = pgTable("mid_role_assignments", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(), // NEW
  mid: text("mid").notNull(),
  merchantName: text("merchant_name").notNull(),
  // ... rest of fields
}, (table) => ({
  uniqueAgencyMid: unique().on(table.agencyId, table.mid), // NEW
}));
```

**Migration SQL:**
```sql
ALTER TABLE mid_role_assignments ADD COLUMN agency_id INTEGER;
UPDATE mid_role_assignments SET agency_id = 1;
ALTER TABLE mid_role_assignments 
ADD CONSTRAINT mid_role_assignments_agency_id_fk 
FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE mid_role_assignments ALTER COLUMN agency_id SET NOT NULL;

-- Update unique constraint
ALTER TABLE mid_role_assignments DROP CONSTRAINT IF EXISTS mid_role_assignments_mid_unique;
ALTER TABLE mid_role_assignments 
ADD CONSTRAINT mid_role_assignments_agency_id_mid_unique 
UNIQUE (agency_id, mid);
```

#### 2.4: Update `assignments` Table
```typescript
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(), // NEW
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  month: text("month").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Migration SQL:**
```sql
ALTER TABLE assignments ADD COLUMN agency_id INTEGER;
UPDATE assignments SET agency_id = 1;
ALTER TABLE assignments 
ADD CONSTRAINT assignments_agency_id_fk 
FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE assignments ALTER COLUMN agency_id SET NOT NULL;
```

#### 2.5: Update `audit_issues` Table
```typescript
export const auditIssues = pgTable("audit_issues", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(), // NEW
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  month: text("month").notNull(),
  issueType: text("issue_type").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Migration SQL:**
```sql
ALTER TABLE audit_issues ADD COLUMN agency_id INTEGER;
UPDATE audit_issues SET agency_id = 1;
ALTER TABLE audit_issues 
ADD CONSTRAINT audit_issues_agency_id_fk 
FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE audit_issues ALTER COLUMN agency_id SET NOT NULL;
```

#### 2.6: Update `file_uploads` Table
```typescript
export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(), // NEW
  filename: text("filename").notNull(),
  processorId: integer("processor_id").references(() => processors.id),
  month: text("month").notNull(),
  type: text("type").notNull(),
  recordsProcessed: integer("records_processed").default(0),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  validationResults: jsonb("validation_results"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});
```

**Migration SQL:**
```sql
ALTER TABLE file_uploads ADD COLUMN agency_id INTEGER;
UPDATE file_uploads SET agency_id = 1;
ALTER TABLE file_uploads 
ADD CONSTRAINT file_uploads_agency_id_fk 
FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE file_uploads ALTER COLUMN agency_id SET NOT NULL;
```

#### 2.7: Update `upload_progress` Table
```typescript
export const uploadProgress = pgTable("upload_progress", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(), // NEW
  month: text("month").notNull(),
  processorId: integer("processor_id").references(() => processors.id),
  processorName: text("processor_name").notNull(),
  uploadStatus: text("upload_status").default("needs_upload"),
  leadSheetStatus: text("lead_sheet_status").default("needs_upload"),
  compilationStatus: text("compilation_status").default("pending"),
  assignmentStatus: text("assignment_status").default("pending"),
  auditStatus: text("audit_status").default("pending"),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  uniqueAgencyMonthProcessor: unique().on(table.agencyId, table.month, table.processorId), // NEW
}));
```

**Migration SQL:**
```sql
ALTER TABLE upload_progress ADD COLUMN agency_id INTEGER;
UPDATE upload_progress SET agency_id = 1;
ALTER TABLE upload_progress 
ADD CONSTRAINT upload_progress_agency_id_fk 
FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE upload_progress ALTER COLUMN agency_id SET NOT NULL;

-- Update unique constraint
ALTER TABLE upload_progress DROP CONSTRAINT IF EXISTS upload_progress_month_processor_id_unique;
ALTER TABLE upload_progress 
ADD CONSTRAINT upload_progress_agency_id_month_processor_id_unique 
UNIQUE (agency_id, month, processor_id);
```

#### 2.8: Update `no_mid_declarations` Table
```typescript
export const noMidDeclarations = pgTable("no_mid_declarations", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(), // NEW
  processorId: integer("processor_id").references(() => processors.id).notNull(),
  month: text("month").notNull(),
  declaredBy: text("declared_by").notNull(),
  reason: text("reason"),
  declaredAt: timestamp("declared_at").defaultNow().notNull(),
}, (table) => ({
  uniqueAgencyProcessorMonth: unique().on(table.agencyId, table.processorId, table.month), // NEW
}));
```

**Migration SQL:**
```sql
ALTER TABLE no_mid_declarations ADD COLUMN agency_id INTEGER;
UPDATE no_mid_declarations SET agency_id = 1;
ALTER TABLE no_mid_declarations 
ADD CONSTRAINT no_mid_declarations_agency_id_fk 
FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE no_mid_declarations ALTER COLUMN agency_id SET NOT NULL;

-- Update unique constraint
ALTER TABLE no_mid_declarations DROP CONSTRAINT IF EXISTS no_mid_declarations_processor_id_month_unique;
ALTER TABLE no_mid_declarations 
ADD CONSTRAINT no_mid_declarations_agency_id_processor_id_month_unique 
UNIQUE (agency_id, processor_id, month);
```

---

## 🔧 **BACKEND CODE UPDATES**

### Phase 3: Update All Database Queries

#### 3.1: Storage Layer Updates
Every query in `server/storage.ts` needs to filter by agencyId:

```typescript
// BEFORE
async getMerchants(): Promise<Merchant[]> {
  return await db.select().from(merchants).orderBy(merchants.dba);
}

// AFTER
async getMerchants(agencyId: number): Promise<Merchant[]> {
  return await db
    .select()
    .from(merchants)
    .where(eq(merchants.agencyId, agencyId))
    .orderBy(merchants.dba);
}
```

#### 3.2: Service Layer Updates
All services need agencyId context:

```typescript
// ResidualsWorkflowService.ts
export class ResidualsWorkflowService {
  async getUnassignedMerchants(month: string, agencyId: number) {
    // Filter by agency
    const merchants = await db
      .select()
      .from(merchants)
      .where(
        and(
          eq(merchants.agencyId, agencyId),
          // ... other conditions
        )
      );
  }
}
```

#### 3.3: Route Middleware
Add agency context to all routes:

```typescript
// Middleware to extract agencyId from authenticated user
export const requireAgencyContext = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user.id))
    .limit(1);
  
  if (!user[0]?.agencyId) {
    return res.status(403).json({ error: "No agency association" });
  }
  
  req.agencyId = user[0].agencyId;
  next();
};

// Apply to routes
router.get("/api/merchants", requireAuth, requireAgencyContext, async (req, res) => {
  const merchants = await storage.getMerchants(req.agencyId);
  res.json(merchants);
});
```

---

## 🚨 **SHARED vs TENANT-SPECIFIC RESOURCES**

### Shared Resources (No Agency Scoping)
These should remain global across all agencies:

1. **processors** table
   - Reason: Payment processors are industry-standard entities
   - Access: All agencies see same processor list
   
2. **roles** table (consider carefully)
   - Option A: Keep global - standard role types
   - Option B: Make tenant-specific - custom role names
   - Recommendation: Keep global for standard types

3. **vendors** table
   - Reason: Login portals are industry-standard
   - Access: All agencies see same vendor list

### Tenant-Specific Resources
Everything else must be scoped to agencies:
- merchants
- monthly_data
- assignments
- audit_issues
- file_uploads
- upload_progress
- mid_role_assignments
- no_mid_declarations
- reports (if custom per agency)

---

## 📝 **COMPLETE MIGRATION SCRIPT**

### Complete SQL Migration Script
```sql
-- ====================================
-- ISO HUB MULTI-TENANT MIGRATION
-- ====================================

BEGIN;

-- Step 1: Create First Tenant - Tracer C2FS
INSERT INTO agencies (
  id,
  company_name,
  contact_name,
  email,
  status,
  admin_username,
  primary_color,
  secondary_color,
  accent_color,
  is_whitelabel,
  created_at
) VALUES (
  1,
  'Tracer C2FS',
  'System Administrator',
  'admin@tracerc2fs.com',
  'active',
  'admin',
  '#FFD700',
  '#000000',
  '#FFFFFF',
  true,  -- White-label enabled
  NOW()
);

-- Step 2: Link existing users to Agency #1
UPDATE users SET agency_id = 1 WHERE agency_id IS NULL;

-- Step 3: Add agency_id to all core tables

-- merchants
ALTER TABLE merchants ADD COLUMN agency_id INTEGER;
UPDATE merchants SET agency_id = 1;
ALTER TABLE merchants ADD CONSTRAINT merchants_agency_id_fk FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE merchants ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_mid_unique;
ALTER TABLE merchants ADD CONSTRAINT merchants_agency_id_mid_unique UNIQUE (agency_id, mid);

-- monthly_data
ALTER TABLE monthly_data ADD COLUMN agency_id INTEGER;
UPDATE monthly_data SET agency_id = 1;
ALTER TABLE monthly_data ADD CONSTRAINT monthly_data_agency_id_fk FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE monthly_data ALTER COLUMN agency_id SET NOT NULL;

-- mid_role_assignments
ALTER TABLE mid_role_assignments ADD COLUMN agency_id INTEGER;
UPDATE mid_role_assignments SET agency_id = 1;
ALTER TABLE mid_role_assignments ADD CONSTRAINT mid_role_assignments_agency_id_fk FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE mid_role_assignments ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE mid_role_assignments DROP CONSTRAINT IF EXISTS mid_role_assignments_mid_unique;
ALTER TABLE mid_role_assignments ADD CONSTRAINT mid_role_assignments_agency_id_mid_unique UNIQUE (agency_id, mid);

-- assignments
ALTER TABLE assignments ADD COLUMN agency_id INTEGER;
UPDATE assignments SET agency_id = 1;
ALTER TABLE assignments ADD CONSTRAINT assignments_agency_id_fk FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE assignments ALTER COLUMN agency_id SET NOT NULL;

-- audit_issues
ALTER TABLE audit_issues ADD COLUMN agency_id INTEGER;
UPDATE audit_issues SET agency_id = 1;
ALTER TABLE audit_issues ADD CONSTRAINT audit_issues_agency_id_fk FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE audit_issues ALTER COLUMN agency_id SET NOT NULL;

-- file_uploads
ALTER TABLE file_uploads ADD COLUMN agency_id INTEGER;
UPDATE file_uploads SET agency_id = 1;
ALTER TABLE file_uploads ADD CONSTRAINT file_uploads_agency_id_fk FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE file_uploads ALTER COLUMN agency_id SET NOT NULL;

-- upload_progress
ALTER TABLE upload_progress ADD COLUMN agency_id INTEGER;
UPDATE upload_progress SET agency_id = 1;
ALTER TABLE upload_progress ADD CONSTRAINT upload_progress_agency_id_fk FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE upload_progress ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE upload_progress DROP CONSTRAINT IF EXISTS upload_progress_month_processor_id_unique;
ALTER TABLE upload_progress ADD CONSTRAINT upload_progress_agency_id_month_processor_id_unique UNIQUE (agency_id, month, processor_id);

-- no_mid_declarations
ALTER TABLE no_mid_declarations ADD COLUMN agency_id INTEGER;
UPDATE no_mid_declarations SET agency_id = 1;
ALTER TABLE no_mid_declarations ADD CONSTRAINT no_mid_declarations_agency_id_fk FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE no_mid_declarations ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE no_mid_declarations DROP CONSTRAINT IF EXISTS no_mid_declarations_processor_id_month_unique;
ALTER TABLE no_mid_declarations ADD CONSTRAINT no_mid_declarations_agency_id_processor_id_month_unique UNIQUE (agency_id, processor_id, month);

-- Step 4: Create OAuth credentials table for cloud storage integrations
CREATE TABLE agency_oauth_credentials (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL REFERENCES agencies(id),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('dropbox', 'onedrive', 'google_drive')),
  
  -- OAuth Credentials (encrypted in application layer)
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  
  -- Token Management
  token_type VARCHAR(20),
  expires_at TIMESTAMP,
  scope TEXT,
  
  -- Connection Status
  is_active BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  last_connected TIMESTAMP,
  last_refreshed TIMESTAMP,
  
  -- Metadata
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  
  -- Error Handling
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT agency_oauth_credentials_agency_id_provider_unique UNIQUE (agency_id, provider)
);

-- Create indexes for OAuth table
CREATE INDEX idx_agency_oauth_credentials_agency_id ON agency_oauth_credentials(agency_id);
CREATE INDEX idx_agency_oauth_credentials_provider ON agency_oauth_credentials(provider);
CREATE INDEX idx_agency_oauth_credentials_active ON agency_oauth_credentials(is_active, is_connected);

COMMIT;
```

**Migration Summary:**
- Created **Tracer C2FS** as first tenant (Agency ID = 1)
- Migrated **719 merchants** to Tracer C2FS
- Migrated **716 monthly data records** to Tracer C2FS
- Migrated **132 assignments** to Tracer C2FS
- Added agency_id to 8 core tables
- Created OAuth credentials table for Dropbox, OneDrive, and Google Drive
- Established data isolation for future multi-tenant operations

---

## ✅ **TESTING & VALIDATION**

### Post-Migration Verification Checklist

1. **Data Integrity**
   - [ ] All 719 merchants have agency_id = 1
   - [ ] All 716 monthly_data records have agency_id = 1
   - [ ] All 132 assignments have agency_id = 1
   - [ ] No orphaned records

2. **Query Validation**
   - [ ] All API endpoints filter by agencyId
   - [ ] Dashboard shows correct data for Agency #1
   - [ ] Reports filter by agency
   - [ ] Role assignments scoped correctly

3. **Multi-Agency Testing**
   - [ ] Create Agency #2
   - [ ] Upload test data for Agency #2
   - [ ] Verify data isolation (Agency #1 can't see Agency #2 data)
   - [ ] Test user switching between agencies

4. **Performance Testing**
   - [ ] Query performance with agency filters
   - [ ] Index optimization on agency_id columns
   - [ ] Large dataset testing (1000+ merchants per agency)

---

## 🎯 **ROLLOUT PLAN**

### Phase A: Preparation (Week 1)
- Backup entire database
- Test migration script on development environment
- Update schema.ts with new agency_id fields
- Update all storage methods

### Phase B: Schema Migration (Week 2)
- Run migration script on production during maintenance window
- Verify data integrity
- Test all API endpoints

### Phase C: Code Deployment (Week 3)
- Deploy updated backend with agency filters
- Update frontend to handle agency context
- Test end-to-end workflows

### Phase D: Validation (Week 4)
- Monitor production for issues
- Performance tuning
- Create Agency #2 as first real multi-tenant test

---

## 🔐 **SECURITY CONSIDERATIONS**

### Row-Level Security
After migration, implement additional security:

1. **Database-Level RLS** (PostgreSQL)
   ```sql
   ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY agency_isolation ON merchants
   FOR ALL
   USING (agency_id = current_setting('app.current_agency_id')::integer);
   ```

2. **Application-Level Validation**
   - Always validate agencyId from authenticated user
   - Never trust client-provided agencyId
   - Log cross-agency access attempts

3. **Super Admin Override**
   - Allow SuperAdmin role to query across agencies
   - Audit all cross-agency queries
   - Implement agency switching for support

---

## 📊 **IMPACT ASSESSMENT**

### Database Changes
- **Tables Modified:** 8 core tables + agency_id
- **Records Affected:** 1,500+ total records
- **Constraints Added:** 8 foreign keys + 4 unique constraints

### Code Changes
- **Backend Files:** ~20 files need updates
- **Storage Methods:** ~50 methods need agencyId parameter
- **Routes:** ~30 routes need middleware
- **Frontend:** Minimal changes (agency context from auth)

### Performance Impact
- **Additional Indexes Needed:** 8 indexes on agency_id columns
- **Query Complexity:** +1 JOIN per query (minimal impact)
- **Estimated Performance:** <5% overhead with proper indexing

---

## 🚀 **NEXT STEPS**

### Immediate Actions
1. **Review & Approve** this migration plan
2. **Schedule Migration** for low-traffic maintenance window
3. **Backup Database** before any changes
4. **Test Script** on development environment
5. **Update Documentation** for multi-tenant operations

### Long-Term Improvements
1. **Agency Onboarding** - Streamline new tenant setup
2. **Data Migration Tools** - Help agencies import existing data
3. **White-Label Enhancement** - Full branding per agency
4. **Agency Analytics** - Cross-agency insights for SuperAdmins
5. **Billing Integration** - Usage-based pricing per agency

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** Post-Migration  
**Owner:** Technical Team

*This plan ensures zero data loss and complete isolation for the multi-tenant transformation.*
