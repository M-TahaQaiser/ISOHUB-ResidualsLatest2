-- Migration: create month_approvals table

CREATE TABLE IF NOT EXISTS month_approvals (
  id BIGSERIAL PRIMARY KEY,
  month VARCHAR(7) NOT NULL,
  agency_id INTEGER NOT NULL,
  assignments_complete BOOLEAN NOT NULL DEFAULT FALSE,
  audit_complete BOOLEAN NOT NULL DEFAULT FALSE,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (month, agency_id)
);
