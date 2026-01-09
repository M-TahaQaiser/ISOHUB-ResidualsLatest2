-- Drop and recreate vendors table with correct schema
DROP TABLE IF EXISTS vendors CASCADE;

-- Create vendors table with all required columns
CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Processors', 'Gateways', 'Hardware/Equipment', 'Internal')),
  description TEXT,
  logo_url VARCHAR(500),
  login_url VARCHAR(500),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  integration_notes TEXT,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index on category for faster filtering
CREATE INDEX idx_vendors_category ON vendors(category);

-- Create index on status for active vendors
CREATE INDEX idx_vendors_status ON vendors(status);
