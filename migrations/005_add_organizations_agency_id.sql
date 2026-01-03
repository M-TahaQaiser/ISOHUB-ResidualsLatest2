-- Migration: Add agency_id column to organizations table for multi-tenant data isolation
-- This links organizations to agencies for residuals data queries

-- Add agency_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'agency_id'
    ) THEN
        ALTER TABLE organizations ADD COLUMN agency_id INTEGER REFERENCES agencies(id);
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_agency_id ON organizations(agency_id);

-- Update existing organizations to link to default agency if available
UPDATE organizations 
SET agency_id = 1 
WHERE agency_id IS NULL 
AND EXISTS (SELECT 1 FROM agencies WHERE id = 1);
