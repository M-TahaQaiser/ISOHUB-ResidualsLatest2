-- Migration to add all legacy columns that may be missing from the database
-- This ensures schema.ts matches the actual database structure

-- =====================================================
-- VENDORS TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'contact_phone') THEN
        ALTER TABLE vendors ADD COLUMN contact_phone VARCHAR(50);
    END IF;
END $$;

-- =====================================================
-- MERCHANTS TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'agency_id') THEN
        ALTER TABLE merchants ADD COLUMN agency_id INTEGER REFERENCES agencies(id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'branch_id') THEN
        ALTER TABLE merchants ADD COLUMN branch_id TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'partner_type') THEN
        ALTER TABLE merchants ADD COLUMN partner_type TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'notes') THEN
        ALTER TABLE merchants ADD COLUMN notes TEXT;
    END IF;
END $$;

-- =====================================================
-- MONTHLY_DATA TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_data' AND column_name = 'agent_net') THEN
        ALTER TABLE monthly_data ADD COLUMN agent_net DECIMAL(12, 2);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_data' AND column_name = 'column_i') THEN
        ALTER TABLE monthly_data ADD COLUMN column_i TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_data' AND column_name = 'agency_id') THEN
        ALTER TABLE monthly_data ADD COLUMN agency_id INTEGER REFERENCES agencies(id);
    END IF;
END $$;

-- =====================================================
-- MASTER_DATASET TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_dataset' AND column_name = 'agency_id') THEN
        ALTER TABLE master_dataset ADD COLUMN agency_id INTEGER REFERENCES agencies(id);
    END IF;
END $$;

-- =====================================================
-- MID_ROLE_ASSIGNMENTS TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mid_role_assignments' AND column_name = 'agent') THEN
        ALTER TABLE mid_role_assignments ADD COLUMN agent TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mid_role_assignments' AND column_name = 'agent_percentage') THEN
        ALTER TABLE mid_role_assignments ADD COLUMN agent_percentage DECIMAL(5, 2);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mid_role_assignments' AND column_name = 'agency_id') THEN
        ALTER TABLE mid_role_assignments ADD COLUMN agency_id INTEGER REFERENCES agencies(id);
    END IF;
END $$;

-- =====================================================
-- UPLOAD_PROGRESS TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upload_progress' AND column_name = 'agency_id') THEN
        ALTER TABLE upload_progress ADD COLUMN agency_id INTEGER REFERENCES agencies(id);
    END IF;
END $$;

-- =====================================================
-- AUDIT_ISSUES TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_issues' AND column_name = 'agency_id') THEN
        ALTER TABLE audit_issues ADD COLUMN agency_id INTEGER REFERENCES agencies(id);
    END IF;
END $$;

-- =====================================================
-- FILE_UPLOADS TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'agency_id') THEN
        ALTER TABLE file_uploads ADD COLUMN agency_id INTEGER REFERENCES agencies(id);
    END IF;
END $$;

-- =====================================================
-- ASSIGNMENTS TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'agency_id') THEN
        ALTER TABLE assignments ADD COLUMN agency_id INTEGER REFERENCES agencies(id);
    END IF;
END $$;

-- =====================================================
-- VALIDATION_ERRORS TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'validation_errors' AND column_name = 'merchant_mid') THEN
        ALTER TABLE validation_errors ADD COLUMN merchant_mid VARCHAR(100);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'validation_errors' AND column_name = 'processor') THEN
        ALTER TABLE validation_errors ADD COLUMN processor VARCHAR(100);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'validation_errors' AND column_name = 'error_type') THEN
        ALTER TABLE validation_errors ADD COLUMN error_type VARCHAR(100);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'validation_errors' AND column_name = 'severity') THEN
        ALTER TABLE validation_errors ADD COLUMN severity VARCHAR(20);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'validation_errors' AND column_name = 'month') THEN
        ALTER TABLE validation_errors ADD COLUMN month VARCHAR(7);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'validation_errors' AND column_name = 'detected_at') THEN
        ALTER TABLE validation_errors ADD COLUMN detected_at TIMESTAMP;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'validation_errors' AND column_name = 'resolved') THEN
        ALTER TABLE validation_errors ADD COLUMN resolved BOOLEAN;
    END IF;
END $$;

-- =====================================================
-- OAUTH_STATES TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oauth_states' AND column_name = 'nonce') THEN
        ALTER TABLE oauth_states ADD COLUMN nonce TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oauth_states' AND column_name = 'agency_id') THEN
        ALTER TABLE oauth_states ADD COLUMN agency_id INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oauth_states' AND column_name = 'user_id') THEN
        ALTER TABLE oauth_states ADD COLUMN user_id INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oauth_states' AND column_name = 'consumed') THEN
        ALTER TABLE oauth_states ADD COLUMN consumed BOOLEAN;
    END IF;
END $$;

-- =====================================================
-- PRE_APPLICATIONS TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_applications' AND column_name = 'agent_id') THEN
        ALTER TABLE pre_applications ADD COLUMN agent_id VARCHAR(100);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_applications' AND column_name = 'business_name') THEN
        ALTER TABLE pre_applications ADD COLUMN business_name VARCHAR(255);
    END IF;
END $$;

-- =====================================================
-- SHORT_URLS TABLE
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'short_urls' AND column_name = 'agent_name') THEN
        ALTER TABLE short_urls ADD COLUMN agent_name TEXT;
    END IF;
END $$;

-- =====================================================
-- MT_MONTHLY_DATA TABLE (Multi-tenant)
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_monthly_data' AND column_name = 'subaccount_id') THEN
        ALTER TABLE mt_monthly_data ADD COLUMN subaccount_id INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_monthly_data' AND column_name = 'merchant_id') THEN
        ALTER TABLE mt_monthly_data ADD COLUMN merchant_id INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_monthly_data' AND column_name = 'processor_id') THEN
        ALTER TABLE mt_monthly_data ADD COLUMN processor_id INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_monthly_data' AND column_name = 'year') THEN
        ALTER TABLE mt_monthly_data ADD COLUMN year TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_monthly_data' AND column_name = 'volume') THEN
        ALTER TABLE mt_monthly_data ADD COLUMN volume DECIMAL(15, 2);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_monthly_data' AND column_name = 'transactions') THEN
        ALTER TABLE mt_monthly_data ADD COLUMN transactions INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_monthly_data' AND column_name = 'total_revenue') THEN
        ALTER TABLE mt_monthly_data ADD COLUMN total_revenue DECIMAL(15, 2);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_monthly_data' AND column_name = 'net_revenue') THEN
        ALTER TABLE mt_monthly_data ADD COLUMN net_revenue DECIMAL(15, 2);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_monthly_data' AND column_name = 'updated_at') THEN
        ALTER TABLE mt_monthly_data ADD COLUMN updated_at TIMESTAMP;
    END IF;
END $$;

-- =====================================================
-- MT_AUDIT_LOGS TABLE (Multi-tenant)
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_audit_logs' AND column_name = 'subaccount_id') THEN
        ALTER TABLE mt_audit_logs ADD COLUMN subaccount_id INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_audit_logs' AND column_name = 'user_id') THEN
        ALTER TABLE mt_audit_logs ADD COLUMN user_id INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_audit_logs' AND column_name = 'resource_type') THEN
        ALTER TABLE mt_audit_logs ADD COLUMN resource_type TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_audit_logs' AND column_name = 'resource_id') THEN
        ALTER TABLE mt_audit_logs ADD COLUMN resource_id TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_audit_logs' AND column_name = 'previous_values') THEN
        ALTER TABLE mt_audit_logs ADD COLUMN previous_values JSONB;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_audit_logs' AND column_name = 'new_values') THEN
        ALTER TABLE mt_audit_logs ADD COLUMN new_values JSONB;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_audit_logs' AND column_name = 'ip_address') THEN
        ALTER TABLE mt_audit_logs ADD COLUMN ip_address TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_audit_logs' AND column_name = 'user_agent') THEN
        ALTER TABLE mt_audit_logs ADD COLUMN user_agent TEXT;
    END IF;
END $$;

-- =====================================================
-- MT_SUBACCOUNTS TABLE (Multi-tenant)
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_subaccounts' AND column_name = 'email') THEN
        ALTER TABLE mt_subaccounts ADD COLUMN email TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_subaccounts' AND column_name = 'settings') THEN
        ALTER TABLE mt_subaccounts ADD COLUMN settings JSONB;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_subaccounts' AND column_name = 'is_active') THEN
        ALTER TABLE mt_subaccounts ADD COLUMN is_active BOOLEAN;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_subaccounts' AND column_name = 'updated_at') THEN
        ALTER TABLE mt_subaccounts ADD COLUMN updated_at TIMESTAMP;
    END IF;
END $$;

-- =====================================================
-- MT_MERCHANTS TABLE (Multi-tenant)
-- =====================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_merchants' AND column_name = 'subaccount_id') THEN
        ALTER TABLE mt_merchants ADD COLUMN subaccount_id INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_merchants' AND column_name = 'processor_id') THEN
        ALTER TABLE mt_merchants ADD COLUMN processor_id INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_merchants' AND column_name = 'dba_name') THEN
        ALTER TABLE mt_merchants ADD COLUMN dba_name TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_merchants' AND column_name = 'legal_name') THEN
        ALTER TABLE mt_merchants ADD COLUMN legal_name TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_merchants' AND column_name = 'metadata') THEN
        ALTER TABLE mt_merchants ADD COLUMN metadata JSONB;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mt_merchants' AND column_name = 'updated_at') THEN
        ALTER TABLE mt_merchants ADD COLUMN updated_at TIMESTAMP;
    END IF;
END $$;
