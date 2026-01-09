-- Create lead_sheet_mappings table to store column mappings for lead sheets
CREATE TABLE IF NOT EXISTS lead_sheet_mappings (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL,
  file_name VARCHAR(500),
  column_mappings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(agency_id)
);

-- Create index on agency_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_lead_sheet_mappings_agency_id ON lead_sheet_mappings(agency_id);
