-- Remove foreign key constraint from vendor_mappings table
-- The vendors table is reseeded on server restart which changes IDs

-- Drop and recreate the table without foreign key
DROP TABLE IF EXISTS vendor_mappings CASCADE;

CREATE TABLE vendor_mappings (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL,
  vendor_id INTEGER NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_category VARCHAR(50) NOT NULL,
  file_name VARCHAR(500),
  column_mappings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(agency_id, vendor_id)
);

-- Create indexes
CREATE INDEX idx_vendor_mappings_agency_id ON vendor_mappings(agency_id);
CREATE INDEX idx_vendor_mappings_vendor_id ON vendor_mappings(vendor_id);
CREATE INDEX idx_vendor_mappings_category ON vendor_mappings(vendor_category);
