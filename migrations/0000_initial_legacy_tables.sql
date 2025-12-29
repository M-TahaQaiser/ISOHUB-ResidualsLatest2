-- Initial migration to create minimal legacy tables required by startup
-- This provides minimal `organizations` and `users` tables so subsequent
-- migrations and startup data seeding can run.

BEGIN;

-- Organizations (legacy)
CREATE TABLE IF NOT EXISTS organizations (
  id serial PRIMARY KEY,
  organization_id text NOT NULL,
  name text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  website varchar(255),
  admin_contact_name varchar(255),
  admin_contact_email varchar(255),
  admin_contact_phone varchar(50),
  industry varchar(100),
  status varchar(20) DEFAULT 'setup',
  activation_token varchar(255),
  token_expiry timestamp,
  welcome_email_sent boolean DEFAULT false,
  updated_at timestamp DEFAULT now(),
  primary_color varchar(7) DEFAULT '#FFD700',
  secondary_color varchar(7) DEFAULT '#000000',
  accent_color varchar(7) DEFAULT '#FFFFFF',
  logo_url varchar(500),
  domain_type varchar(20) DEFAULT 'standard',
  custom_domain varchar(255),
  subdomain_prefix varchar(100),
  business_profile jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS organizations_organization_id_unique ON organizations(organization_id);

-- Users (legacy)
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username text NOT NULL,
  password text NOT NULL,
  email text,
  role text DEFAULT 'Users/Reps' NOT NULL,
  agent_name text,
  partner_name text,
  first_name text,
  last_name text,
  organization_id text DEFAULT 'org-86f76df1' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  agency_id integer,
  permissions jsonb,
  mfa_enabled boolean DEFAULT false,
  mfa_secret text,
  last_login_at timestamp,
  failed_login_attempts integer DEFAULT 0,
  locked_until timestamp,
  is_temporary_password boolean DEFAULT false,
  bio text,
  profile_picture_url text,
  password_changed_at timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);

COMMIT;
