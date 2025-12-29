-- ============================================================
-- ISOHUB Multi-Tenant Migration: 001 - Create Core Tables
-- ============================================================
-- This migration creates the new multi-tenant tables with proper
-- tenant isolation columns and indexes.
--
-- Run this FIRST before data migration.
-- ============================================================

BEGIN;

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE agency_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('starter', 'professional', 'enterprise', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'agency_owner',
    'agency_admin',
    'agency_manager',
    'subaccount_admin',
    'subaccount_user',
    'rep',
    'partner',
    'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN 
    -- Enum exists, add missing values if needed
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agency_owner';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agency_admin';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agency_manager';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'subaccount_admin';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'subaccount_user';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'rep';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'partner';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'viewer';
    EXCEPTION
      WHEN others THEN null;
    END;
END $$;

DO $$ BEGIN
  CREATE TYPE merchant_status AS ENUM ('pending', 'active', 'inactive', 'terminated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'create', 'read', 'update', 'delete',
    'login', 'logout', 'export', 'import', 'permission_change'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- CORE MULTI-TENANT TABLES
-- ============================================================

-- Agencies (Top-Level Tenants)
CREATE TABLE IF NOT EXISTS mt_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  legal_name VARCHAR(255),

  -- Contact
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(255),

  -- Address
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',

  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#FFD700',
  secondary_color VARCHAR(7) DEFAULT '#000000',
  accent_color VARCHAR(7) DEFAULT '#FFFFFF',

  -- Configuration
  settings JSONB DEFAULT '{}',
  feature_flags JSONB DEFAULT '{}',

  -- Subscription
  subscription_tier subscription_tier DEFAULT 'starter',
  subscription_status agency_status DEFAULT 'trial',
  trial_ends_at TIMESTAMP,

  -- Limits
  max_subaccounts INTEGER DEFAULT 10,
  max_users INTEGER DEFAULT 50,
  max_storage_mb INTEGER DEFAULT 1000,

  -- Status
  status agency_status DEFAULT 'trial',
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS mt_agencies_email_idx ON mt_agencies(email);
CREATE INDEX IF NOT EXISTS mt_agencies_status_idx ON mt_agencies(status);

-- Subaccounts (Child Tenants)
CREATE TABLE IF NOT EXISTS mt_subaccounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent Agency (REQUIRED)
  agency_id UUID NOT NULL REFERENCES mt_agencies(id) ON DELETE CASCADE,

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,

  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Configuration
  settings JSONB DEFAULT '{}',
  feature_flags JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Unique slug per agency
  UNIQUE(agency_id, slug)
);

CREATE INDEX IF NOT EXISTS mt_subaccounts_agency_idx ON mt_subaccounts(agency_id);
CREATE INDEX IF NOT EXISTS mt_subaccounts_active_idx ON mt_subaccounts(agency_id, is_active);

-- Users (Multi-Tenant)
CREATE TABLE IF NOT EXISTS mt_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant Association
  agency_id UUID REFERENCES mt_agencies(id) ON DELETE CASCADE,
  subaccount_id UUID REFERENCES mt_subaccounts(id) ON DELETE SET NULL,

  -- Authentication
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  phone VARCHAR(50),
  timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Role & Permissions
  role user_role NOT NULL DEFAULT 'subaccount_user',
  permissions JSONB DEFAULT '[]',

  -- Security
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  is_temporary_password BOOLEAN DEFAULT false,
  password_changed_at TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS mt_users_agency_idx ON mt_users(agency_id);
CREATE INDEX IF NOT EXISTS mt_users_subaccount_idx ON mt_users(subaccount_id);
CREATE INDEX IF NOT EXISTS mt_users_agency_active_idx ON mt_users(agency_id, is_active);

-- User-Subaccount Access (Junction)
CREATE TABLE IF NOT EXISTS mt_user_subaccount_access (
  user_id UUID NOT NULL REFERENCES mt_users(id) ON DELETE CASCADE,
  subaccount_id UUID NOT NULL REFERENCES mt_subaccounts(id) ON DELETE CASCADE,

  role user_role DEFAULT 'subaccount_user',
  permissions JSONB DEFAULT '[]',

  granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  granted_by UUID REFERENCES mt_users(id),

  PRIMARY KEY (user_id, subaccount_id)
);

CREATE INDEX IF NOT EXISTS mt_user_subaccount_access_user_idx ON mt_user_subaccount_access(user_id);
CREATE INDEX IF NOT EXISTS mt_user_subaccount_access_subaccount_idx ON mt_user_subaccount_access(subaccount_id);

-- ============================================================
-- BUSINESS TABLES
-- ============================================================

-- Processors (Agency-scoped)
CREATE TABLE IF NOT EXISTS mt_processors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES mt_agencies(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,

  login_url VARCHAR(500),
  logo_url TEXT,

  settings JSONB DEFAULT '{}',
  field_mappings JSONB DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  UNIQUE(agency_id, name)
);

CREATE INDEX IF NOT EXISTS mt_processors_agency_idx ON mt_processors(agency_id);
CREATE INDEX IF NOT EXISTS mt_processors_active_idx ON mt_processors(agency_id, is_active);

-- Merchants (Subaccount-scoped)
CREATE TABLE IF NOT EXISTS mt_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES mt_agencies(id) ON DELETE CASCADE,
  subaccount_id UUID REFERENCES mt_subaccounts(id) ON DELETE SET NULL,

  mid VARCHAR(100) NOT NULL,
  legal_name VARCHAR(255),
  dba VARCHAR(255),
  business_type VARCHAR(100),

  email VARCHAR(255),
  phone VARCHAR(50),

  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),

  processor_id UUID REFERENCES mt_processors(id),

  status merchant_status DEFAULT 'pending',
  activated_at TIMESTAMP,
  terminated_at TIMESTAMP,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  UNIQUE(agency_id, mid)
);

CREATE INDEX IF NOT EXISTS mt_merchants_agency_idx ON mt_merchants(agency_id);
CREATE INDEX IF NOT EXISTS mt_merchants_subaccount_idx ON mt_merchants(subaccount_id);
CREATE INDEX IF NOT EXISTS mt_merchants_status_idx ON mt_merchants(agency_id, status);
CREATE INDEX IF NOT EXISTS mt_merchants_processor_idx ON mt_merchants(processor_id);

-- Monthly Data (Subaccount-scoped)
CREATE TABLE IF NOT EXISTS mt_monthly_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES mt_agencies(id) ON DELETE CASCADE,
  subaccount_id UUID REFERENCES mt_subaccounts(id) ON DELETE SET NULL,

  merchant_id UUID NOT NULL REFERENCES mt_merchants(id) ON DELETE CASCADE,
  processor_id UUID NOT NULL REFERENCES mt_processors(id),

  month VARCHAR(7) NOT NULL,

  transactions INTEGER DEFAULT 0,
  sales_amount DECIMAL(14, 2) DEFAULT 0,
  income DECIMAL(12, 2) DEFAULT 0,
  expenses DECIMAL(12, 2) DEFAULT 0,
  net DECIMAL(12, 2) DEFAULT 0,

  chargebacks INTEGER DEFAULT 0,
  chargeback_amount DECIMAL(12, 2) DEFAULT 0,
  refunds INTEGER DEFAULT 0,
  refund_amount DECIMAL(12, 2) DEFAULT 0,

  raw_data JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  UNIQUE(agency_id, merchant_id, processor_id, month)
);

CREATE INDEX IF NOT EXISTS mt_monthly_data_agency_month_idx ON mt_monthly_data(agency_id, month);
CREATE INDEX IF NOT EXISTS mt_monthly_data_subaccount_month_idx ON mt_monthly_data(subaccount_id, month);

-- Role Assignments
CREATE TABLE IF NOT EXISTS mt_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES mt_agencies(id) ON DELETE CASCADE,
  subaccount_id UUID REFERENCES mt_subaccounts(id) ON DELETE SET NULL,

  merchant_id UUID NOT NULL REFERENCES mt_merchants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES mt_users(id) ON DELETE SET NULL,

  role_type VARCHAR(50) NOT NULL,
  role_name VARCHAR(255),

  percentage DECIMAL(5, 2) NOT NULL,

  effective_from VARCHAR(7),
  effective_to VARCHAR(7),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS mt_role_assignments_agency_idx ON mt_role_assignments(agency_id);
CREATE INDEX IF NOT EXISTS mt_role_assignments_merchant_idx ON mt_role_assignments(merchant_id);
CREATE INDEX IF NOT EXISTS mt_role_assignments_user_idx ON mt_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS mt_role_assignments_active_idx ON mt_role_assignments(agency_id, is_active);

-- ============================================================
-- AUDIT & SECURITY TABLES
-- ============================================================

-- Audit Logs
CREATE TABLE IF NOT EXISTS mt_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agency_id UUID REFERENCES mt_agencies(id) ON DELETE SET NULL,
  subaccount_id UUID REFERENCES mt_subaccounts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES mt_users(id) ON DELETE SET NULL,

  action audit_action NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),

  ip_address VARCHAR(45),
  user_agent TEXT,
  request_path VARCHAR(500),
  request_method VARCHAR(10),

  old_data JSONB,
  new_data JSONB,
  metadata JSONB,

  success BOOLEAN DEFAULT true,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS mt_audit_logs_agency_idx ON mt_audit_logs(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mt_audit_logs_subaccount_idx ON mt_audit_logs(subaccount_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mt_audit_logs_user_idx ON mt_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mt_audit_logs_action_idx ON mt_audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS mt_audit_logs_resource_idx ON mt_audit_logs(resource_type, resource_id);

-- API Rate Limits
CREATE TABLE IF NOT EXISTS mt_api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agency_id UUID REFERENCES mt_agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES mt_users(id) ON DELETE CASCADE,

  identifier VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,

  requests INTEGER DEFAULT 0,
  window_start TIMESTAMP NOT NULL,

  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS mt_api_rate_limits_lookup_idx ON mt_api_rate_limits(identifier, endpoint, window_start);

COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Multi-tenant tables created successfully' AS status;
SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'mt_%' ORDER BY table_name;
