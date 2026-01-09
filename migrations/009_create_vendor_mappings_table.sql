-- Create vendor_mappings table to store column mappings for each vendor
CREATE TABLE IF NOT EXISTS vendor_mappings (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_category VARCHAR(50) NOT NULL,
  file_name VARCHAR(500),
  column_mappings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(agency_id, vendor_id)
);

-- Create index on agency_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_mappings_agency_id ON vendor_mappings(agency_id);

-- Create index on vendor_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_mappings_vendor_id ON vendor_mappings(vendor_id);

-- Create index on vendor_category for filtering by type
CREATE INDEX IF NOT EXISTS idx_vendor_mappings_category ON vendor_mappings(vendor_category);
