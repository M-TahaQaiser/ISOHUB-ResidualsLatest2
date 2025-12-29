-- ============================================================
-- ISOHUB Multi-Tenant Migration: 002 - Enable Row Level Security
-- ============================================================
-- This migration enables RLS on all multi-tenant tables and creates
-- policies for proper tenant isolation.
--
-- Run this AFTER creating tables and BEFORE data migration.
-- ============================================================

BEGIN;

-- ============================================================
-- SESSION CONTEXT FUNCTIONS
-- ============================================================

-- Function to set tenant context (called at start of each request)
CREATE OR REPLACE FUNCTION set_tenant_context(
  p_agency_id UUID DEFAULT NULL,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context() RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_agency_id', '', false);
  PERFORM set_config('app.current_subaccount_id', '', false);
  PERFORM set_config('app.current_user_id', '', false);
  PERFORM set_config('app.is_super_admin', 'false', false);
  PERFORM set_config('app.is_agency_admin', 'false', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current agency ID safely
CREATE OR REPLACE FUNCTION current_agency_id() RETURNS UUID AS $$
DECLARE
  agency_id TEXT;
BEGIN
  agency_id := current_setting('app.current_agency_id', true);
  IF agency_id IS NULL OR agency_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN agency_id::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get current subaccount ID safely
CREATE OR REPLACE FUNCTION current_subaccount_id() RETURNS UUID AS $$
DECLARE
  subaccount_id TEXT;
BEGIN
  subaccount_id := current_setting('app.current_subaccount_id', true);
  IF subaccount_id IS NULL OR subaccount_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN subaccount_id::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(current_setting('app.is_super_admin', true)::BOOLEAN, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to check if current user is agency admin
CREATE OR REPLACE FUNCTION is_agency_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(current_setting('app.is_agency_admin', true)::BOOLEAN, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE mt_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_user_subaccount_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_api_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AGENCY POLICIES
-- ============================================================

-- Agencies: Super admin sees all, others see only their agency
DROP POLICY IF EXISTS mt_agencies_select_policy ON mt_agencies;
CREATE POLICY mt_agencies_select_policy ON mt_agencies
  FOR SELECT
  USING (
    is_super_admin() = true
    OR id = current_agency_id()
  );

DROP POLICY IF EXISTS mt_agencies_insert_policy ON mt_agencies;
CREATE POLICY mt_agencies_insert_policy ON mt_agencies
  FOR INSERT
  WITH CHECK (is_super_admin() = true);

DROP POLICY IF EXISTS mt_agencies_update_policy ON mt_agencies;
CREATE POLICY mt_agencies_update_policy ON mt_agencies
  FOR UPDATE
  USING (
    is_super_admin() = true
    OR (id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_agencies_delete_policy ON mt_agencies;
CREATE POLICY mt_agencies_delete_policy ON mt_agencies
  FOR DELETE
  USING (is_super_admin() = true);

-- ============================================================
-- SUBACCOUNT POLICIES
-- ============================================================

DROP POLICY IF EXISTS mt_subaccounts_select_policy ON mt_subaccounts;
CREATE POLICY mt_subaccounts_select_policy ON mt_subaccounts
  FOR SELECT
  USING (
    is_super_admin() = true
    OR agency_id = current_agency_id()
  );

DROP POLICY IF EXISTS mt_subaccounts_insert_policy ON mt_subaccounts;
CREATE POLICY mt_subaccounts_insert_policy ON mt_subaccounts
  FOR INSERT
  WITH CHECK (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_subaccounts_update_policy ON mt_subaccounts;
CREATE POLICY mt_subaccounts_update_policy ON mt_subaccounts
  FOR UPDATE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_subaccounts_delete_policy ON mt_subaccounts;
CREATE POLICY mt_subaccounts_delete_policy ON mt_subaccounts
  FOR DELETE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

-- ============================================================
-- USER POLICIES
-- ============================================================

DROP POLICY IF EXISTS mt_users_select_policy ON mt_users;
CREATE POLICY mt_users_select_policy ON mt_users
  FOR SELECT
  USING (
    is_super_admin() = true
    OR agency_id = current_agency_id()
  );

DROP POLICY IF EXISTS mt_users_insert_policy ON mt_users;
CREATE POLICY mt_users_insert_policy ON mt_users
  FOR INSERT
  WITH CHECK (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_users_update_policy ON mt_users;
CREATE POLICY mt_users_update_policy ON mt_users
  FOR UPDATE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
    OR id = current_setting('app.current_user_id', true)::UUID -- Users can update themselves
  );

DROP POLICY IF EXISTS mt_users_delete_policy ON mt_users;
CREATE POLICY mt_users_delete_policy ON mt_users
  FOR DELETE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

-- ============================================================
-- MERCHANT POLICIES (Subaccount Isolation)
-- ============================================================

DROP POLICY IF EXISTS mt_merchants_select_policy ON mt_merchants;
CREATE POLICY mt_merchants_select_policy ON mt_merchants
  FOR SELECT
  USING (
    is_super_admin() = true
    OR (
      agency_id = current_agency_id()
      AND (
        is_agency_admin() = true
        OR subaccount_id IS NULL
        OR subaccount_id = current_subaccount_id()
      )
    )
  );

DROP POLICY IF EXISTS mt_merchants_insert_policy ON mt_merchants;
CREATE POLICY mt_merchants_insert_policy ON mt_merchants
  FOR INSERT
  WITH CHECK (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_merchants_update_policy ON mt_merchants;
CREATE POLICY mt_merchants_update_policy ON mt_merchants
  FOR UPDATE
  USING (
    is_super_admin() = true
    OR (
      agency_id = current_agency_id()
      AND (
        is_agency_admin() = true
        OR subaccount_id = current_subaccount_id()
      )
    )
  );

DROP POLICY IF EXISTS mt_merchants_delete_policy ON mt_merchants;
CREATE POLICY mt_merchants_delete_policy ON mt_merchants
  FOR DELETE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

-- ============================================================
-- MONTHLY DATA POLICIES (Subaccount Isolation)
-- ============================================================

DROP POLICY IF EXISTS mt_monthly_data_select_policy ON mt_monthly_data;
CREATE POLICY mt_monthly_data_select_policy ON mt_monthly_data
  FOR SELECT
  USING (
    is_super_admin() = true
    OR (
      agency_id = current_agency_id()
      AND (
        is_agency_admin() = true
        OR subaccount_id IS NULL
        OR subaccount_id = current_subaccount_id()
      )
    )
  );

DROP POLICY IF EXISTS mt_monthly_data_insert_policy ON mt_monthly_data;
CREATE POLICY mt_monthly_data_insert_policy ON mt_monthly_data
  FOR INSERT
  WITH CHECK (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_monthly_data_update_policy ON mt_monthly_data;
CREATE POLICY mt_monthly_data_update_policy ON mt_monthly_data
  FOR UPDATE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_monthly_data_delete_policy ON mt_monthly_data;
CREATE POLICY mt_monthly_data_delete_policy ON mt_monthly_data
  FOR DELETE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

-- ============================================================
-- PROCESSOR POLICIES
-- ============================================================

DROP POLICY IF EXISTS mt_processors_select_policy ON mt_processors;
CREATE POLICY mt_processors_select_policy ON mt_processors
  FOR SELECT
  USING (
    is_super_admin() = true
    OR agency_id = current_agency_id()
  );

DROP POLICY IF EXISTS mt_processors_insert_policy ON mt_processors;
CREATE POLICY mt_processors_insert_policy ON mt_processors
  FOR INSERT
  WITH CHECK (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_processors_update_policy ON mt_processors;
CREATE POLICY mt_processors_update_policy ON mt_processors
  FOR UPDATE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_processors_delete_policy ON mt_processors;
CREATE POLICY mt_processors_delete_policy ON mt_processors
  FOR DELETE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

-- ============================================================
-- ROLE ASSIGNMENTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS mt_role_assignments_select_policy ON mt_role_assignments;
CREATE POLICY mt_role_assignments_select_policy ON mt_role_assignments
  FOR SELECT
  USING (
    is_super_admin() = true
    OR (
      agency_id = current_agency_id()
      AND (
        is_agency_admin() = true
        OR subaccount_id IS NULL
        OR subaccount_id = current_subaccount_id()
        OR user_id = current_setting('app.current_user_id', true)::UUID
      )
    )
  );

DROP POLICY IF EXISTS mt_role_assignments_insert_policy ON mt_role_assignments;
CREATE POLICY mt_role_assignments_insert_policy ON mt_role_assignments
  FOR INSERT
  WITH CHECK (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_role_assignments_update_policy ON mt_role_assignments;
CREATE POLICY mt_role_assignments_update_policy ON mt_role_assignments
  FOR UPDATE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

DROP POLICY IF EXISTS mt_role_assignments_delete_policy ON mt_role_assignments;
CREATE POLICY mt_role_assignments_delete_policy ON mt_role_assignments
  FOR DELETE
  USING (
    is_super_admin() = true
    OR (agency_id = current_agency_id() AND is_agency_admin() = true)
  );

-- ============================================================
-- AUDIT LOG POLICIES
-- ============================================================

DROP POLICY IF EXISTS mt_audit_logs_select_policy ON mt_audit_logs;
CREATE POLICY mt_audit_logs_select_policy ON mt_audit_logs
  FOR SELECT
  USING (
    is_super_admin() = true
    OR agency_id = current_agency_id()
  );

-- Audit logs are insert-only (no updates/deletes)
DROP POLICY IF EXISTS mt_audit_logs_insert_policy ON mt_audit_logs;
CREATE POLICY mt_audit_logs_insert_policy ON mt_audit_logs
  FOR INSERT
  WITH CHECK (true); -- Always allow inserts for audit purposes

-- ============================================================
-- API RATE LIMITS POLICIES
-- ============================================================

DROP POLICY IF EXISTS mt_api_rate_limits_all_policy ON mt_api_rate_limits;
CREATE POLICY mt_api_rate_limits_all_policy ON mt_api_rate_limits
  FOR ALL
  USING (true); -- Rate limits need to work for all requests

COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Row Level Security enabled successfully' AS status;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'mt_%'
ORDER BY tablename, policyname;
