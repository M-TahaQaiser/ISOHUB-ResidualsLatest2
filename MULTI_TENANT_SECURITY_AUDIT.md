# ISOHUB Multi-Tenant Database Architecture & Security Audit

**Audit Date:** November 25, 2025
**Auditor:** Senior Platform Architect / Security Engineer
**Severity Rating:** CRITICAL - Immediate Action Required

---

## Executive Summary

This audit reveals **critical security vulnerabilities** in the ISOHUB platform that **completely break multi-tenant isolation**. The current implementation allows any authenticated (and in some cases, unauthenticated) user to access data belonging to ANY tenant in the system. These issues require immediate remediation before the platform can be considered production-ready.

### Critical Findings Overview

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 CRITICAL | 12 | Complete tenant isolation failures, unauthenticated endpoints |
| 🟠 HIGH | 8 | IDOR vulnerabilities, weak secrets, missing authorization |
| 🟡 MEDIUM | 6 | Performance issues, inconsistent patterns |
| 🟢 LOW | 4 | Best practice recommendations |

---

## Part 1: Current State Analysis

### 1.1 Database Schema Architecture

#### Current Tenant Model (Inconsistent)

The codebase has **THREE different tenant identification patterns** that are not properly integrated:

```
Pattern 1: agencies.id (serial integer)
├── Used by: users.agencyId, emailTracking.agencyId, auditLogs.agencyId
├── FK Relationship: Yes
└── Problem: Not consistently enforced in queries

Pattern 2: organizations.id (text, e.g., "org-86f76df1")
├── Used by: iso-ai-schema tables (agents, merchants, reports, commissions)
├── FK Relationship: Yes
└── Problem: Different table, different ID format

Pattern 3: organizations.organizationId (text unique)
├── Used by: onboarding-schema tables
├── FK Relationship: Via organizationId text column
└── Problem: Third pattern, adds confusion
```

#### Schema Files Analyzed

| File | Tables | Tenant Column | Issues |
|------|--------|---------------|--------|
| `shared/schema.ts` | ~50 tables | Mixed: `agencyId`, `organizationId` | Many tables have NO tenant column |
| `shared/iso-ai-schema.ts` | 7 tables | `organizationId` (text) | Different ID format than agencies |
| `shared/onboarding-schema.ts` | 6 tables | `organizationId` (text ref) | Proper FK relationships |
| `shared/audit-schema.ts` | 4 tables | **NONE** | 🔴 No tenant isolation at all! |

#### Tables Missing Tenant Columns

The following tables have **NO tenant isolation** and return data for ALL tenants:

```
🔴 CRITICAL - No tenant columns:
- processors          - All processors visible to all tenants
- merchants           - All merchants visible to all tenants
- monthlyData         - All financial data visible to all tenants
- roles               - All roles visible to all tenants
- assignments         - All assignments visible to all tenants
- fileUploads         - All uploads visible to all tenants
- auditIssues         - All audit issues visible to all tenants
- reports             - All reports visible to all tenants
- vendors             - All vendors visible to all tenants
- monthlyAudits       - All audits visible to all tenants
- validationErrors    - All errors visible to all tenants
- uploadSessions      - All sessions visible to all tenants
- userCorrections     - All corrections visible to all tenants
- masterDataset       - All datasets visible to all tenants
- midRoleAssignments  - All MID assignments visible to all tenants
```

### 1.2 Authentication & Authorization Issues

#### 🔴 CRITICAL: Hardcoded Organization ID in JWT

**File:** `server/auth.ts:13-14`

```typescript
// VULNERABILITY: Every user gets the same hardcoded organizationID
organizationID: 'org-86f76df1'
```

This means ALL users share the same organization in their JWT tokens, making tenant-based authorization impossible.

#### 🔴 CRITICAL: Weak/Fallback JWT Secrets

**File:** `server/auth.ts:5`
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'temp-secret-key-for-development';
```

**File:** `server/routes/agencies.routes.ts:337`
```typescript
process.env.JWT_SECRET || 'super-secret-impersonation-key'
```

If `JWT_SECRET` environment variable is not set, anyone can forge valid JWT tokens using the known fallback value.

#### 🔴 CRITICAL: Simple Auth Middleware Bypasses Security

**File:** `server/middleware/simpleAuth.ts:14-24`

```typescript
// VULNERABILITY: Creates mock user from HTTP headers - NO ACTUAL AUTH
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  req.user = {
    id: 1,
    username: req.headers['x-username'] as string || 'dev',
    role: req.headers['x-role'] as string || 'Admin',
    organizationId: req.headers['x-organization'] as string || 'org-86f76df1',
  };
  next();
};
```

An attacker can set `X-Role: Admin` header and gain admin access to ANY organization.

#### 🔴 CRITICAL: Unauthenticated API Endpoints

The following routes have **NO authentication middleware**:

**File:** `server/routes/users.routes.ts`
```
POST /api/users           - Create any user (NO AUTH)
GET  /api/users           - List ALL users (NO AUTH)
GET  /api/users/:id       - Get any user details (NO AUTH)
PATCH /api/users/:id      - Update any user (NO AUTH)
POST /api/users/:id/reset-password - Reset any user's password (NO AUTH)
DELETE /api/users/:id     - Delete any user (NO AUTH)
POST /api/users/bulk/create - Bulk create users (NO AUTH)
```

**File:** `server/routes/agencies.routes.ts`
```
POST /api/agencies        - Create agency (NO AUTH)
GET  /api/agencies        - List ALL agencies (NO AUTH)
GET  /api/agencies/:id    - Get any agency (NO AUTH)
PUT  /api/agencies/:id    - Update any agency (NO AUTH)
DELETE /api/agencies/:id  - Delete any agency (NO AUTH)
POST /api/agencies/:id/impersonate - IMPERSONATE ANY ADMIN (NO AUTH!) 🔴
```

#### 🔴 CRITICAL: Impersonation Without Authorization

**File:** `server/routes/agencies.routes.ts:312-355`

The impersonation endpoint allows ANY caller to generate a valid JWT token for any agency admin:

```typescript
router.post('/:id/impersonate', async (req, res) => {
  // NO AUTHENTICATION CHECK!
  const agencyId = parseInt(req.params.id);
  const [agency] = await db.select().from(agencies).where(eq(agencies.id, agencyId));

  const impersonationToken = jwt.sign({
    username: agency.adminUsername,
    agencyId: agency.id,
    // ... generates valid JWT for any admin
  }, process.env.JWT_SECRET || 'super-secret-impersonation-key');
});
```

### 1.3 Data Access Control Issues

#### 🔴 CRITICAL: No Tenant Filtering in Storage Layer

**File:** `server/storage.ts`

Every storage method returns ALL data across ALL tenants:

```typescript
// Returns ALL merchants in the system
async getMerchants(): Promise<Merchant[]> {
  return await db.select().from(merchants).orderBy(merchants.dba);
}

// Returns ALL monthly data for the month (all tenants)
async getMonthlyData(month: string): Promise<...> {
  return await db.select().from(monthlyData)
    .innerJoin(merchants, ...)
    .where(eq(monthlyData.month, month));  // No tenant filter!
}

// Returns ALL roles in the system
async getRoles(): Promise<Role[]> {
  return await db.select().from(roles).where(eq(roles.isActive, true));
}
```

#### 🟠 HIGH: Client-Controlled Tenant ID (IDOR)

**File:** `server/middleware/auth.ts:121`

```typescript
const agencyId = req.params.agencyId || req.body.agencyId || req.query.agencyId;
```

The tenant ID comes from client-controlled inputs (URL params, body, query). An attacker can simply change the agencyId to access any tenant's data.

### 1.4 CORS and CSRF Issues

#### 🟠 HIGH: CORS Wide Open

**File:** `server/middleware/security.ts:89-94`

```typescript
export const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  // ...
};
```

This allows any website to make authenticated requests to the API.

#### 🟠 HIGH: CSRF Protection Non-Functional

**File:** `server/middleware/security.ts:153-157`

```typescript
export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  req.body._csrfToken = 'placeholder-csrf-token';  // Never validated!
  next();
};
```

CSRF protection is completely placeholder - tokens are never validated.

### 1.5 SQL Query Analysis

#### Raw SQL Usage (Potential Injection Vectors)

**File:** `server/routes/residualsWorkflow.routes.ts`

Uses parameterized queries via Drizzle's `sql` template tag - **SAFE**:

```typescript
const merchantQuery = sql`
  SELECT ... FROM monthly_data md
  WHERE m.mid = ${mid} AND md.month = ${month}
`;
```

However, there's no tenant context in any of these queries.

#### Missing Tenant Context in All Queries

Every query in the codebase lacks tenant filtering:

```typescript
// Example: Gets ANY merchant by ID, regardless of tenant
const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));

// Should be:
const [merchant] = await db.select().from(merchants)
  .where(and(
    eq(merchants.id, id),
    eq(merchants.agencyId, currentUser.agencyId)
  ));
```

---

## Part 2: Pentesting Perspective Review

### 2.1 Attack Vectors Identified

#### Vector 1: Direct Data Access (No Auth Required)

```bash
# Get all users in the system
curl https://isohub.example.com/api/users

# Get all agencies
curl https://isohub.example.com/api/agencies

# Create admin user for any agency
curl -X POST https://isohub.example.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Attacker","lastName":"User","email":"attacker@evil.com","role":"Admin","agencyId":1}'
```

#### Vector 2: Impersonate Any Admin (No Auth Required)

```bash
# Generate valid JWT for any agency admin
curl -X POST https://isohub.example.com/api/agencies/1/impersonate

# Response includes valid JWT token:
# {"token":"eyJhbGciOiJIUzI1NiIs...","agencyAdmin":{"username":"admin"}}
```

#### Vector 3: IDOR - Access Any Tenant's Data

```bash
# Authenticated as tenant A, access tenant B's data
curl https://isohub.example.com/api/users?agencyId=2 \
  -H "Authorization: Bearer <tenant_a_token>"

# Change agency in request body
curl -X PATCH https://isohub.example.com/api/users/1 \
  -H "Authorization: Bearer <any_token>" \
  -d '{"agencyId":999}'
```

#### Vector 4: Privilege Escalation via Headers

```bash
# Bypass auth completely with simple auth middleware
curl https://isohub.example.com/api/admin/endpoint \
  -H "X-Role: Admin" \
  -H "X-Username: admin" \
  -H "X-Organization: org-86f76df1"
```

#### Vector 5: JWT Forgery (If ENV Not Set)

```javascript
// If JWT_SECRET env var is not set, forge valid tokens
const jwt = require('jsonwebtoken');
const forgedToken = jwt.sign(
  { id: 1, username: 'admin', role: 'superadmin' },
  'temp-secret-key-for-development',  // Known fallback
  { expiresIn: '7d' }
);
```

### 2.2 OWASP Top 10 Mapping

| OWASP Category | Status | Finding |
|---------------|--------|---------|
| A01:2021 Broken Access Control | 🔴 CRITICAL | Multiple IDOR, missing tenant checks |
| A02:2021 Cryptographic Failures | 🟠 HIGH | Weak JWT secrets, plaintext temp passwords |
| A03:2021 Injection | 🟢 LOW | Using parameterized queries (Drizzle) |
| A04:2021 Insecure Design | 🔴 CRITICAL | No multi-tenant architecture |
| A05:2021 Security Misconfiguration | 🟠 HIGH | CORS open, CSRF disabled |
| A06:2021 Vulnerable Components | 🟡 MEDIUM | Need dependency audit |
| A07:2021 Auth Failures | 🔴 CRITICAL | Missing auth on many endpoints |
| A08:2021 Data Integrity Failures | 🟡 MEDIUM | No request signing |
| A09:2021 Logging Failures | 🟡 MEDIUM | Audit logs exist but not enforced |
| A10:2021 SSRF | 🟢 LOW | Not applicable |

---

## Part 3: Unified Database Architecture Design

### 3.1 Proposed Tenant Hierarchy (GHL Model)

```
Super Admin (ISOHub Platform)
    │
    ├── Agency 1 (Top-level Tenant)
    │   ├── Subaccount 1A
    │   │   └── Users (subaccount scope)
    │   ├── Subaccount 1B
    │   │   └── Users (subaccount scope)
    │   └── Users (agency scope - can see all subaccounts)
    │
    ├── Agency 2 (Top-level Tenant)
    │   ├── Subaccount 2A
    │   └── Subaccount 2B
    │
    └── Agency N...
```

### 3.2 Core Tenant Tables (New Schema)

```sql
-- =====================================================
-- CORE MULTI-TENANT TABLES
-- =====================================================

-- Agencies (Top-Level Tenants)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,  -- URL-safe identifier
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),

    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#FFD700',
    secondary_color VARCHAR(7) DEFAULT '#000000',

    -- Configuration
    settings JSONB DEFAULT '{}',
    feature_flags JSONB DEFAULT '{}',

    -- Subscription
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    subscription_status VARCHAR(20) DEFAULT 'trial',

    -- Status
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subaccounts (Child Tenants under Agency)
CREATE TABLE subaccounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,  -- Unique within agency

    -- Configuration (inherits from agency but can override)
    settings JSONB DEFAULT '{}',
    feature_flags JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(agency_id, slug)
);

-- Users (Can belong to agency, subaccount, or both)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Authentication
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),

    -- Multi-Tenant Association
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE SET NULL,

    -- Role & Permissions
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '[]',

    -- Security
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    is_temporary_password BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Role definitions for users
CREATE TYPE user_role AS ENUM (
    'super_admin',      -- ISOHub platform admin (no agency)
    'agency_owner',     -- Full agency access
    'agency_admin',     -- Agency admin (can manage subaccounts)
    'agency_manager',   -- Agency manager (limited admin)
    'subaccount_admin', -- Full subaccount access
    'subaccount_user',  -- Standard subaccount user
    'partner'           -- External partner with limited access
);

-- User-Subaccount junction (users can access multiple subaccounts)
CREATE TABLE user_subaccount_access (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, subaccount_id)
);
```

### 3.3 Business Tables with Tenant Columns

```sql
-- =====================================================
-- BUSINESS TABLES (All require tenant columns)
-- =====================================================

-- Processors (Agency-scoped)
CREATE TABLE processors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(agency_id, name)
);

-- Merchants (Subaccount-scoped)
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE SET NULL,

    mid VARCHAR(100) NOT NULL,
    legal_name VARCHAR(255),
    dba VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',

    -- Processor association
    processor_id UUID REFERENCES processors(id),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(agency_id, mid)  -- MID unique within agency
);

-- Monthly Data (Subaccount-scoped)
CREATE TABLE monthly_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE SET NULL,

    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    processor_id UUID NOT NULL REFERENCES processors(id),
    month VARCHAR(7) NOT NULL,  -- "2025-05"

    transactions INTEGER DEFAULT 0,
    sales_amount DECIMAL(12,2) DEFAULT 0,
    income DECIMAL(12,2) DEFAULT 0,
    expenses DECIMAL(12,2) DEFAULT 0,
    net DECIMAL(12,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(agency_id, merchant_id, processor_id, month)
);

-- Unified Audit Log (All actions)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tenant context (nullable for super-admin actions)
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Action details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),

    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),

    -- Change data
    old_data JSONB,
    new_data JSONB,
    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit log queries
CREATE INDEX idx_audit_agency ON audit_logs(agency_id, created_at DESC);
CREATE INDEX idx_audit_subaccount ON audit_logs(subaccount_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
```

### 3.4 Row-Level Security (RLS) Policies

```sql
-- =====================================================
-- ROW-LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tenant tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- AGENCY-LEVEL POLICIES
-- =====================================================

-- Agencies: Users can only see their own agency
CREATE POLICY agency_isolation ON agencies
    FOR ALL
    USING (
        id = current_setting('app.current_agency_id')::uuid
        OR current_setting('app.is_super_admin')::boolean = true
    );

-- =====================================================
-- SUBACCOUNT-LEVEL POLICIES (Strict Isolation)
-- =====================================================

-- Subaccounts: Users see only subaccounts in their agency
CREATE POLICY subaccount_agency_isolation ON subaccounts
    FOR ALL
    USING (
        agency_id = current_setting('app.current_agency_id')::uuid
        OR current_setting('app.is_super_admin')::boolean = true
    );

-- Merchants: Subaccount isolation with agency rollup option
CREATE POLICY merchant_isolation ON merchants
    FOR ALL
    USING (
        -- Super admin sees all
        current_setting('app.is_super_admin')::boolean = true
        OR
        -- Agency admin sees all merchants in agency
        (
            agency_id = current_setting('app.current_agency_id')::uuid
            AND current_setting('app.is_agency_admin')::boolean = true
        )
        OR
        -- Subaccount user sees only their subaccount
        (
            agency_id = current_setting('app.current_agency_id')::uuid
            AND (
                subaccount_id = current_setting('app.current_subaccount_id')::uuid
                OR subaccount_id IS NULL
            )
        )
    );

-- Monthly Data: Same isolation as merchants
CREATE POLICY monthly_data_isolation ON monthly_data
    FOR ALL
    USING (
        current_setting('app.is_super_admin')::boolean = true
        OR
        (
            agency_id = current_setting('app.current_agency_id')::uuid
            AND current_setting('app.is_agency_admin')::boolean = true
        )
        OR
        (
            agency_id = current_setting('app.current_agency_id')::uuid
            AND (
                subaccount_id = current_setting('app.current_subaccount_id')::uuid
                OR subaccount_id IS NULL
            )
        )
    );

-- =====================================================
-- SESSION CONTEXT FUNCTIONS
-- =====================================================

-- Function to set tenant context (called at start of each request)
CREATE OR REPLACE FUNCTION set_tenant_context(
    p_agency_id UUID,
    p_subaccount_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_is_super_admin BOOLEAN DEFAULT FALSE,
    p_is_agency_admin BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_agency_id', COALESCE(p_agency_id::text, ''), false);
    PERFORM set_config('app.current_subaccount_id', COALESCE(p_subaccount_id::text, ''), false);
    PERFORM set_config('app.current_user_id', COALESCE(p_user_id::text, ''), false);
    PERFORM set_config('app.is_super_admin', p_is_super_admin::text, false);
    PERFORM set_config('app.is_agency_admin', p_is_agency_admin::text, false);
END;
$$ LANGUAGE plpgsql;

-- Function to clear tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context() RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_agency_id', '', false);
    PERFORM set_config('app.current_subaccount_id', '', false);
    PERFORM set_config('app.current_user_id', '', false);
    PERFORM set_config('app.is_super_admin', 'false', false);
    PERFORM set_config('app.is_agency_admin', 'false', false);
END;
$$ LANGUAGE plpgsql;
```

### 3.5 Application-Level Tenant Middleware

```typescript
// server/middleware/tenant.ts

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface TenantContext {
  agencyId: string | null;
  subaccountId: string | null;
  userId: string;
  isSuperAdmin: boolean;
  isAgencyAdmin: boolean;
}

export interface TenantRequest extends Request {
  tenant?: TenantContext;
}

/**
 * Middleware to establish tenant context from authenticated user.
 * MUST run after authentication middleware.
 */
export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  // User must be authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const tenantContext: TenantContext = {
    agencyId: req.user.agencyId || null,
    subaccountId: req.user.subaccountId || null,
    userId: req.user.id,
    isSuperAdmin: req.user.role === 'super_admin',
    isAgencyAdmin: ['agency_owner', 'agency_admin'].includes(req.user.role),
  };

  // Set PostgreSQL session variables for RLS
  await db.execute(sql`
    SELECT set_tenant_context(
      ${tenantContext.agencyId}::uuid,
      ${tenantContext.subaccountId}::uuid,
      ${tenantContext.userId}::uuid,
      ${tenantContext.isSuperAdmin},
      ${tenantContext.isAgencyAdmin}
    )
  `);

  req.tenant = tenantContext;
  next();
};

/**
 * Middleware to ensure user belongs to the requested agency.
 * Use for routes with :agencyId parameter.
 */
export const requireAgencyMatch = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  const requestedAgencyId = req.params.agencyId || req.body.agencyId;

  // Super admin can access any agency
  if (req.tenant?.isSuperAdmin) {
    return next();
  }

  // Regular users must match their agency
  if (req.tenant?.agencyId !== requestedAgencyId) {
    return res.status(403).json({ error: 'Access denied to this agency' });
  }

  next();
};

/**
 * Middleware to ensure user belongs to the requested subaccount.
 * Use for routes with :subaccountId parameter.
 */
export const requireSubaccountMatch = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  const requestedSubaccountId = req.params.subaccountId || req.body.subaccountId;

  // Super admin can access any subaccount
  if (req.tenant?.isSuperAdmin) {
    return next();
  }

  // Agency admin can access any subaccount in their agency
  if (req.tenant?.isAgencyAdmin) {
    // Verify subaccount belongs to user's agency (query will be filtered by RLS)
    return next();
  }

  // Regular users must match their subaccount
  if (req.tenant?.subaccountId !== requestedSubaccountId) {
    return res.status(403).json({ error: 'Access denied to this subaccount' });
  }

  next();
};
```

### 3.6 Index Strategy for Multi-Tenant Queries

```sql
-- =====================================================
-- INDEXES FOR MULTI-TENANT PERFORMANCE
-- =====================================================

-- Composite indexes with agency_id FIRST for tenant queries
CREATE INDEX idx_subaccounts_agency ON subaccounts(agency_id, status);
CREATE INDEX idx_users_agency ON users(agency_id, is_active);
CREATE INDEX idx_processors_agency ON processors(agency_id, is_active);
CREATE INDEX idx_merchants_agency ON merchants(agency_id, status);
CREATE INDEX idx_merchants_agency_subaccount ON merchants(agency_id, subaccount_id);
CREATE INDEX idx_monthly_data_agency_month ON monthly_data(agency_id, month);
CREATE INDEX idx_monthly_data_agency_subaccount_month ON monthly_data(agency_id, subaccount_id, month);

-- Indexes for common lookups within tenant
CREATE INDEX idx_merchants_mid ON merchants(agency_id, mid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Partial indexes for active records
CREATE INDEX idx_merchants_active ON merchants(agency_id, id) WHERE status = 'active';
CREATE INDEX idx_users_active ON users(agency_id, id) WHERE is_active = true;
```

---

## Part 4: Migration Roadmap

### 4.1 Phase 0: Immediate Security Hotfixes (BEFORE MIGRATION)

**Timeline: 1-2 days**
**Priority: CRITICAL - Do immediately**

| Task | File | Fix |
|------|------|-----|
| 1. Add authentication to user routes | `routes/users.routes.ts` | Add `authenticateToken` middleware |
| 2. Add authentication to agency routes | `routes/agencies.routes.ts` | Add `authenticateToken` middleware |
| 3. Remove impersonation endpoint | `routes/agencies.routes.ts` | Delete or properly secure lines 312-355 |
| 4. Remove JWT fallback secret | `server/auth.ts` | Throw error if JWT_SECRET not set |
| 5. Remove simple auth middleware | `middleware/simpleAuth.ts` | Delete file, ensure it's not imported |
| 6. Fix hardcoded organizationID | `server/auth.ts` | Use user's actual organizationId |
| 7. Restrict CORS in production | `middleware/security.ts` | Whitelist allowed origins |

```typescript
// Example: Fixed auth.ts
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export function generateToken(userData: any) {
  return jwt.sign({
    userID: userData.id,
    username: userData.username,
    organizationId: userData.organizationId,  // Use actual user data
    agencyId: userData.agencyId,
    role: userData.role
  }, JWT_SECRET, { expiresIn: '7d' });
}
```

### 4.2 Phase 1: Schema Migration

**Timeline: 1-2 weeks**

#### Step 1: Create New Unified Database

```bash
# Create new database on Railway
railway db:create isohub-unified-prod

# Generate migration files
npx drizzle-kit generate:pg --schema=./shared/unified-schema.ts
```

#### Step 2: Add Tenant Columns to Existing Tables

```sql
-- Migration: Add agency_id to existing tables
ALTER TABLE processors ADD COLUMN agency_id UUID;
ALTER TABLE merchants ADD COLUMN agency_id UUID;
ALTER TABLE merchants ADD COLUMN subaccount_id UUID;
ALTER TABLE monthly_data ADD COLUMN agency_id UUID;
ALTER TABLE monthly_data ADD COLUMN subaccount_id UUID;
-- ... repeat for all tables

-- Create default agency for existing data
INSERT INTO agencies (id, name, slug, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Agency', 'default', 'admin@isohub.io');

-- Backfill agency_id
UPDATE processors SET agency_id = '00000000-0000-0000-0000-000000000001';
UPDATE merchants SET agency_id = '00000000-0000-0000-0000-000000000001';
UPDATE monthly_data SET agency_id = '00000000-0000-0000-0000-000000000001';
-- ... repeat for all tables

-- Add NOT NULL constraints
ALTER TABLE processors ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE merchants ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE monthly_data ALTER COLUMN agency_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE processors ADD CONSTRAINT fk_processors_agency
  FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE merchants ADD CONSTRAINT fk_merchants_agency
  FOREIGN KEY (agency_id) REFERENCES agencies(id);
-- ... repeat for all tables
```

#### Step 3: Enable RLS

```sql
-- Enable RLS on all tables
ALTER TABLE processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Create policies (as defined in section 3.4)
```

### 4.3 Phase 2: Application Code Updates

**Timeline: 2-3 weeks**

#### Step 1: Update Storage Layer

```typescript
// storage.ts - Updated with tenant context

export class DatabaseStorage implements IStorage {
  // All methods now require tenant context

  async getMerchants(agencyId: string, subaccountId?: string): Promise<Merchant[]> {
    // RLS will filter, but we add explicit filter for clarity
    let query = db.select().from(merchants)
      .where(eq(merchants.agencyId, agencyId));

    if (subaccountId) {
      query = query.where(eq(merchants.subaccountId, subaccountId));
    }

    return await query.orderBy(merchants.dba);
  }

  async getMonthlyData(
    agencyId: string,
    month: string,
    subaccountId?: string
  ): Promise<MonthlyData[]> {
    let query = db.select().from(monthlyData)
      .where(and(
        eq(monthlyData.agencyId, agencyId),
        eq(monthlyData.month, month)
      ));

    if (subaccountId) {
      query = query.where(eq(monthlyData.subaccountId, subaccountId));
    }

    return await query;
  }

  // ... update all methods
}
```

#### Step 2: Update Route Handlers

```typescript
// routes/merchants.routes.ts - Updated

router.get('/',
  authenticateToken,  // Authentication
  tenantMiddleware,   // Set tenant context
  async (req: TenantRequest, res) => {
    // Tenant context is now available and RLS is active
    const merchants = await storage.getMerchants(
      req.tenant!.agencyId!,
      req.tenant!.subaccountId || undefined
    );
    res.json(merchants);
  }
);

router.post('/',
  authenticateToken,
  tenantMiddleware,
  requireAgencyMatch,  // Verify user can access this agency
  async (req: TenantRequest, res) => {
    const merchant = await storage.createMerchant({
      ...req.body,
      agencyId: req.tenant!.agencyId,
      subaccountId: req.tenant!.subaccountId
    });
    res.json(merchant);
  }
);
```

### 4.4 Phase 3: Data Migration

**Timeline: 1 week**

```typescript
// scripts/migrate-to-multi-tenant.ts

import { db } from '../server/db';
import { agencies, users, merchants, monthlyData } from '../shared/schema';

async function migrateToMultiTenant() {
  console.log('Starting multi-tenant migration...');

  // Step 1: Create agencies from existing organizations
  const existingOrgs = await db.select().from(organizations);
  for (const org of existingOrgs) {
    await db.insert(agencies).values({
      id: org.id,
      name: org.name,
      slug: org.organizationId,
      email: org.adminContactEmail,
      // ... map other fields
    });
  }

  // Step 2: Update users with new agency IDs
  const existingUsers = await db.select().from(users);
  for (const user of existingUsers) {
    // Map old organizationId to new agency UUID
    const agencyMapping = await getAgencyMapping(user.organizationId);
    await db.update(users)
      .set({ agencyId: agencyMapping.newAgencyId })
      .where(eq(users.id, user.id));
  }

  // Step 3: Migrate business data with tenant columns
  // ... similar process for merchants, monthlyData, etc.

  console.log('Migration complete!');
}
```

### 4.5 Phase 4: Validation & Cutover

**Timeline: 1 week**

#### Pre-Cutover Checklist

- [ ] All tables have `agency_id` column with NOT NULL constraint
- [ ] All tables have RLS policies enabled
- [ ] All API endpoints have authentication middleware
- [ ] All API endpoints have tenant context middleware
- [ ] All storage methods accept and filter by tenant
- [ ] JWT tokens include proper tenant claims
- [ ] Integration tests pass for tenant isolation
- [ ] Performance benchmarks acceptable
- [ ] Rollback procedure documented and tested

#### Tenant Isolation Test Suite

```typescript
// tests/tenant-isolation.test.ts

describe('Tenant Isolation', () => {
  it('should not allow Agency A to see Agency B merchants', async () => {
    // Create merchant as Agency A
    const merchantA = await createMerchant(agencyAToken, { name: 'Test Merchant' });

    // Try to access as Agency B - should fail
    const response = await request(app)
      .get(`/api/merchants/${merchantA.id}`)
      .set('Authorization', `Bearer ${agencyBToken}`);

    expect(response.status).toBe(404); // Not found (filtered by RLS)
  });

  it('should not allow subaccount users to see other subaccounts', async () => {
    // Create data in Subaccount 1
    const data1 = await createData(subaccount1Token, { value: 'test' });

    // Try to access as Subaccount 2 - should fail
    const response = await request(app)
      .get(`/api/data/${data1.id}`)
      .set('Authorization', `Bearer ${subaccount2Token}`);

    expect(response.status).toBe(404);
  });

  it('should allow agency admin to see all subaccounts', async () => {
    const response = await request(app)
      .get('/api/subaccounts')
      .set('Authorization', `Bearer ${agencyAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2); // Both subaccounts visible
  });
});
```

---

## Part 5: Security Hardening Checklist

### Immediate Fixes (Do Now)

- [ ] **Add authentication to all routes** - Every route must have `authenticateToken` middleware
- [ ] **Remove impersonation endpoint** - Delete `POST /api/agencies/:id/impersonate`
- [ ] **Remove fallback JWT secrets** - Throw error if `JWT_SECRET` not set
- [ ] **Remove simpleAuth middleware** - Delete file and all imports
- [ ] **Fix hardcoded organizationId** - Use actual user data in JWT
- [ ] **Configure CORS properly** - Whitelist production domains only
- [ ] **Implement real CSRF protection** - Use `csurf` or similar package

### Post-Migration Security Tests

- [ ] Penetration test: Attempt to access other tenant's data
- [ ] Penetration test: Attempt to escalate privileges
- [ ] Penetration test: Attempt to forge JWT tokens
- [ ] Penetration test: SQL injection attempts
- [ ] Audit log review: Verify all actions are logged
- [ ] Secret scanning: Ensure no secrets in code/logs

### Ongoing Security Monitoring

- [ ] Enable audit logging for all database changes
- [ ] Set up alerts for failed authentication attempts
- [ ] Monitor for unusual cross-tenant query patterns
- [ ] Regular dependency vulnerability scanning
- [ ] Quarterly security review and penetration testing

---

## Appendix A: File-by-File Vulnerability Summary

| File | Line(s) | Vulnerability | Severity | Fix |
|------|---------|---------------|----------|-----|
| `server/auth.ts` | 5 | JWT secret fallback | 🔴 CRITICAL | Remove fallback |
| `server/auth.ts` | 13-14 | Hardcoded organizationId | 🔴 CRITICAL | Use user data |
| `middleware/simpleAuth.ts` | 14-24 | Mock auth from headers | 🔴 CRITICAL | Delete file |
| `middleware/auth.ts` | 121 | Client-controlled agencyId | 🟠 HIGH | Use JWT claims only |
| `middleware/security.ts` | 89-94 | CORS wide open | 🟠 HIGH | Whitelist domains |
| `middleware/security.ts` | 153-157 | CSRF placeholder | 🟠 HIGH | Implement properly |
| `routes/users.routes.ts` | 23-454 | No auth on any route | 🔴 CRITICAL | Add middleware |
| `routes/agencies.routes.ts` | 40-433 | No auth on any route | 🔴 CRITICAL | Add middleware |
| `routes/agencies.routes.ts` | 312-355 | Unauth impersonation | 🔴 CRITICAL | Delete endpoint |
| `storage.ts` | 80-330 | No tenant filtering | 🔴 CRITICAL | Add tenant params |

---

## Appendix B: Environment Variables Required

```bash
# Required - Will throw error if missing
JWT_SECRET=<strong-random-256-bit-key>
DATABASE_URL=<postgresql-connection-string>
ENCRYPTION_KEY=<32-byte-hex-key>

# Recommended
NODE_ENV=production
SMTP_HOST=<email-server>
SMTP_USER=<email-user>
SMTP_PASSWORD=<email-password>

# Optional
CORS_ALLOWED_ORIGINS=https://app.isohub.io,https://admin.isohub.io
```

---

**END OF AUDIT REPORT**

*This document should be treated as confidential and shared only with authorized personnel involved in the remediation effort.*
