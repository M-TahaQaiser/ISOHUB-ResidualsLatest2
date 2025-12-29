-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."agency_status" AS ENUM('active', 'inactive', 'suspended', 'pending');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'bulk_operation');--> statement-breakpoint
CREATE TYPE "public"."merchant_status" AS ENUM('active', 'inactive', 'pending', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('starter', 'professional', 'enterprise', 'custom');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('superadmin', 'admin', 'manager', 'agent', 'viewer');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"month" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"agency_id" integer
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"filters" jsonb,
	"schedule" text,
	"last_run" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advanced_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"report_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"month_year" text,
	"processor" text,
	"agent_id" text,
	"report_data" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advanced_reports_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" serial PRIMARY KEY NOT NULL,
	"mid" text NOT NULL,
	"legal_name" text,
	"dba" text,
	"branch_number" text,
	"status" text,
	"status_category" text,
	"current_processor" text,
	"partner_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"agency_id" integer,
	CONSTRAINT "merchants_mid_unique" UNIQUE("mid")
);
--> statement-breakpoint
CREATE TABLE "agent_file_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"filename" text NOT NULL,
	"original_name" text,
	"file_type" text,
	"processor" text,
	"upload_date" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"status" text DEFAULT 'pending',
	"results" jsonb DEFAULT '{}'::jsonb,
	"user_id" text,
	"needs_audit" jsonb DEFAULT '[]'::jsonb,
	"rejected_merchants" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "monthly_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"processor_id" integer NOT NULL,
	"month" text NOT NULL,
	"transactions" integer DEFAULT 0,
	"sales_amount" numeric(12, 2) DEFAULT '0',
	"income" numeric(12, 2) DEFAULT '0',
	"expenses" numeric(12, 2) DEFAULT '0',
	"net" numeric(12, 2) DEFAULT '0',
	"bps" numeric(8, 4) DEFAULT '0',
	"percentage" numeric(8, 4) DEFAULT '0',
	"agent_net" numeric(12, 2) DEFAULT '0',
	"approval_date" timestamp,
	"group_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"column_i" text,
	"agency_id" integer
);
--> statement-breakpoint
CREATE TABLE "agent_merchants" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"merchant_name" text NOT NULL,
	"processor" text,
	"bank_split" numeric(5, 4) DEFAULT '0',
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_merchants_organization_id_agent_id_merchant_id_processor_" UNIQUE("organization_id","agent_id","merchant_id","processor")
);
--> statement-breakpoint
CREATE TABLE "iso_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company" text,
	"company_split" numeric(5, 4) DEFAULT '0',
	"manager" text,
	"manager_split" numeric(5, 4) DEFAULT '0',
	"agent_split" numeric(5, 4) DEFAULT '0',
	"user_id" text,
	"additional_splits" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "iso_agents_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"website" varchar(255),
	"admin_contact_name" varchar(255),
	"admin_contact_email" varchar(255),
	"admin_contact_phone" varchar(50),
	"industry" varchar(100),
	"status" varchar(20) DEFAULT 'setup',
	"activation_token" varchar(255),
	"token_expiry" timestamp,
	"welcome_email_sent" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now(),
	"primary_color" varchar(7) DEFAULT '#FFD700',
	"secondary_color" varchar(7) DEFAULT '#000000',
	"accent_color" varchar(7) DEFAULT '#FFFFFF',
	"logo_url" varchar(500),
	"domain_type" varchar(20) DEFAULT 'standard',
	"custom_domain" varchar(255),
	"subdomain_prefix" varchar(100),
	"business_profile" jsonb,
	CONSTRAINT "organizations_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_id" integer,
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cache_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" jsonb NOT NULL,
	"agency_id" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cache_entries_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "job_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"agency_id" integer,
	"user_id" integer,
	"attempts" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"scheduled_for" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'Users/Reps' NOT NULL,
	"agent_name" text,
	"partner_name" text,
	"first_name" text,
	"last_name" text,
	"organization_id" text DEFAULT 'org-86f76df1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"agency_id" integer,
	"permissions" jsonb,
	"mfa_enabled" boolean DEFAULT false,
	"mfa_secret" text,
	"last_login_at" timestamp,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"is_temporary_password" boolean DEFAULT false,
	"bio" text,
	"profile_picture_url" text,
	"password_changed_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "api_rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"requests" integer DEFAULT 0,
	"window_start" timestamp NOT NULL,
	"agency_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_id" integer,
	"user_id" integer,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_id" integer NOT NULL,
	"step_name" varchar(100) NOT NULL,
	"step_order" integer NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"completed_by_user_id" integer,
	"step_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_id" integer NOT NULL,
	"plan" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"billing_cycle" varchar(50) DEFAULT 'monthly',
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"next_billing_date" timestamp,
	"trial_ends_at" timestamp,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_agency_id_unique" UNIQUE("agency_id")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"logo_url" varchar(500),
	"login_url" varchar(500),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"status" varchar(20) DEFAULT 'active',
	"integration_notes" text,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendors_category_check" CHECK ((category)::text = ANY ((ARRAY['Processors'::character varying, 'Gateways'::character varying, 'Hardware/Equipment'::character varying, 'Internal'::character varying])::text[])),
	CONSTRAINT "vendors_status_check" CHECK ((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "short_urls" (
	"id" serial PRIMARY KEY NOT NULL,
	"short_code" varchar(10) NOT NULL,
	"original_url" text NOT NULL,
	"agency_code" varchar(50),
	"agent_name" varchar(100),
	"organization_id" varchar(50),
	"click_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"last_accessed_at" timestamp,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "short_urls_short_code_key" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "raw_data_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"processor" varchar(100) NOT NULL,
	"upload_timestamp" timestamp DEFAULT CURRENT_TIMESTAMP,
	"total_records" integer,
	"valid_records" integer,
	"validation_errors" jsonb,
	"raw_data" jsonb,
	"processed_by" varchar(100),
	"status" varchar(50) DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "pre_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"dba" varchar(255) NOT NULL,
	"business_contact_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"status" varchar(50) DEFAULT 'New',
	"organization_id" varchar(100),
	"agent_id" varchar(100),
	"submitted_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"business_type" varchar(100),
	"monthly_volume" numeric(12, 2),
	"average_ticket" numeric(10, 2),
	"notes" text,
	"form_link_sent_at" timestamp,
	"form_link_sent_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"business_name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "validation_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_mid" varchar(100),
	"processor" varchar(100),
	"error_type" varchar(100),
	"error_message" text,
	"severity" varchar(20),
	"month" varchar(7),
	"detected_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"resolved" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"step1_complete" boolean DEFAULT false,
	"step2_complete" boolean DEFAULT false,
	"step3_complete" boolean DEFAULT false,
	"step4_complete" boolean DEFAULT false,
	"step5_complete" boolean DEFAULT false,
	"step6_complete" boolean DEFAULT false,
	"step7_complete" boolean DEFAULT false,
	"instance_data" jsonb,
	"company_data" jsonb,
	"org_chart_data" jsonb,
	"business_profile_data" jsonb,
	"vendor_selection_data" jsonb,
	"docs_hub_data" jsonb,
	"tour_data" jsonb,
	"current_step" integer DEFAULT 1,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"activation_token" varchar(255) NOT NULL,
	"password_reset_token" varchar(255),
	"activation_expiry" timestamp NOT NULL,
	"password_reset_expiry" timestamp,
	"is_activated" boolean DEFAULT false,
	"activated_at" timestamp,
	"password_changed" boolean DEFAULT false,
	"password_changed_at" timestamp,
	"temp_password" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"role" varchar(50) DEFAULT 'Admin',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"vendor_id" integer NOT NULL,
	"category" varchar(50) NOT NULL,
	"selected_at" timestamp DEFAULT now() NOT NULL,
	"configuration_data" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" varchar(50) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"integration_data" jsonb,
	"sync_enabled" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_tours" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"tour_completed" boolean DEFAULT false,
	"completed_steps" jsonb DEFAULT '[]'::jsonb,
	"tour_type" varchar(50) DEFAULT 'admin',
	"completed_at" timestamp,
	"skipped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"processor_id" integer,
	"month" text NOT NULL,
	"type" text NOT NULL,
	"records_processed" integer DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"error_message" text,
	"validation_results" jsonb,
	"agency_id" integer
);
--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"website" varchar(255),
	"industry" varchar(100),
	"is_whitelabel" boolean DEFAULT false,
	"domain_type" varchar(20) DEFAULT 'standard',
	"custom_domain" varchar(255),
	"subdomain_prefix" varchar(100),
	"domain_status" varchar(20) DEFAULT 'pending',
	"ssl_status" varchar(20) DEFAULT 'pending',
	"dns_provider" varchar(100),
	"nameservers" jsonb DEFAULT '[]'::jsonb,
	"email_provider" varchar(50) DEFAULT 'isohub_smtp',
	"smtp_host" varchar(255),
	"smtp_port" integer,
	"smtp_username" varchar(255),
	"smtp_password" varchar(255),
	"from_email_address" varchar(255),
	"from_display_name" varchar(255),
	"primary_color" varchar(7) DEFAULT '#FFD700',
	"secondary_color" varchar(7) DEFAULT '#000000',
	"accent_color" varchar(7) DEFAULT '#FFFFFF',
	"logo_url" varchar(500),
	"description" text,
	"status" varchar(20) DEFAULT 'setup',
	"admin_username" varchar(100) NOT NULL,
	"temp_password" varchar(255),
	"welcome_email_sent" boolean DEFAULT false,
	"password_email_sent" boolean DEFAULT false,
	"email_delivery_tracking" jsonb,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"activation_token" varchar(100),
	"token_expiry" timestamp,
	"onboarding_completed" boolean DEFAULT false,
	"onboarding_completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "master_dataset" (
	"id" serial PRIMARY KEY NOT NULL,
	"mid" text NOT NULL,
	"merchant_name" text NOT NULL,
	"month" text NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0',
	"processor" text,
	"lead_sheet_users" text,
	"assignment_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"agency_id" integer,
	CONSTRAINT "master_dataset_mid_month_key" UNIQUE("mid","month")
);
--> statement-breakpoint
CREATE TABLE "master_lead_sheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"upload_date" timestamp DEFAULT now() NOT NULL,
	"month" text NOT NULL,
	"total_records" integer DEFAULT 0,
	"new_merchants" integer DEFAULT 0,
	"reappearing_merchants" integer DEFAULT 0,
	"processed_by" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mid_role_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"mid" text NOT NULL,
	"merchant_name" text NOT NULL,
	"agent" text,
	"agent_percentage" numeric(5, 2),
	"partner" text,
	"partner_percentage" numeric(5, 2),
	"sales_manager" text,
	"sales_manager_percentage" numeric(5, 2),
	"company" text,
	"company_percentage" numeric(5, 2),
	"association" text,
	"association_percentage" numeric(5, 2),
	"assignment_status" text DEFAULT 'pending' NOT NULL,
	"original_column_i" text,
	"first_assigned_month" text,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"agency_id" integer,
	CONSTRAINT "mid_role_assignments_mid_key" UNIQUE("mid")
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"nonce" varchar(64) PRIMARY KEY NOT NULL,
	"agency_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_oauth_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_id" integer NOT NULL,
	"provider" varchar(20) NOT NULL,
	"client_id" text,
	"client_secret" text,
	"access_token" text,
	"refresh_token" text,
	"token_type" varchar(20),
	"expires_at" timestamp,
	"scope" text,
	"is_active" boolean DEFAULT true,
	"is_connected" boolean DEFAULT false,
	"last_connected" timestamp,
	"last_refreshed" timestamp,
	"user_id" text,
	"user_name" text,
	"user_email" text,
	"last_error" text,
	"error_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agency_oauth_credentials_agency_id_provider_key" UNIQUE("agency_id","provider"),
	CONSTRAINT "agency_oauth_credentials_provider_check" CHECK ((provider)::text = ANY ((ARRAY['dropbox'::character varying, 'onedrive'::character varying, 'google_drive'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "role_assignment_workflow" (
	"id" serial PRIMARY KEY NOT NULL,
	"mid" text NOT NULL,
	"user_id" text NOT NULL,
	"role_type" text NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"assigned_by" text NOT NULL,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"agency_id" integer
);
--> statement-breakpoint
CREATE TABLE "upload_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"processor_id" integer,
	"processor_name" text NOT NULL,
	"upload_status" text DEFAULT 'needs_upload',
	"lead_sheet_status" text DEFAULT 'needs_upload',
	"compilation_status" text DEFAULT 'pending',
	"assignment_status" text DEFAULT 'pending',
	"audit_status" text DEFAULT 'pending',
	"last_updated" timestamp DEFAULT now(),
	"record_count" integer DEFAULT 0,
	"file_name" text,
	"file_size" integer,
	"agency_id" integer,
	CONSTRAINT "upload_progress_month_processor_id_key" UNIQUE("month","processor_id")
);
--> statement-breakpoint
CREATE TABLE "audit_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"month" text NOT NULL,
	"issue_type" text NOT NULL,
	"description" text NOT NULL,
	"priority" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"agency_id" integer
);
--> statement-breakpoint
CREATE TABLE "no_mid_declarations" (
	"id" serial PRIMARY KEY NOT NULL,
	"processor_id" integer NOT NULL,
	"month" text NOT NULL,
	"declared_by" text NOT NULL,
	"reason" text,
	"declared_at" timestamp DEFAULT now(),
	"agency_id" integer,
	CONSTRAINT "no_mid_declarations_processor_id_month_key" UNIQUE("processor_id","month")
);
--> statement-breakpoint
CREATE TABLE "user_agencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"agency_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_agencies_user_id_agency_id_key" UNIQUE("user_id","agency_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(100) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "mt_agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100),
	"email" varchar(255),
	"phone" varchar(50),
	"website" varchar(255),
	"logo_url" varchar(500),
	"status" "agency_status" DEFAULT 'active',
	"subscription_tier" "subscription_tier" DEFAULT 'starter',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "mt_agencies_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "mt_monthly_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"subaccount_id" uuid,
	"merchant_id" uuid,
	"processor_id" uuid,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"volume" numeric(15, 2) DEFAULT '0',
	"transactions" integer DEFAULT 0,
	"total_revenue" numeric(15, 2) DEFAULT '0',
	"net_revenue" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mt_monthly_data" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mt_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"subaccount_id" uuid,
	"user_id" varchar(100),
	"action" "audit_action" NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(100),
	"previous_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mt_audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mt_subaccounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mt_subaccounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mt_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"subaccount_id" uuid,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"role" "user_role" DEFAULT 'viewer',
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "mt_users_email_key" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "mt_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mt_processors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"subaccount_id" uuid,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mt_processors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mt_merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"subaccount_id" uuid,
	"processor_id" uuid,
	"mid" varchar(100),
	"dba_name" varchar(255),
	"legal_name" varchar(255),
	"status" "merchant_status" DEFAULT 'active',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mt_merchants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_data" ADD CONSTRAINT "monthly_data_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_data" ADD CONSTRAINT "monthly_data_processor_id_processors_id_fk" FOREIGN KEY ("processor_id") REFERENCES "public"."processors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_data" ADD CONSTRAINT "monthly_data_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activations" ADD CONSTRAINT "user_activations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_vendors" ADD CONSTRAINT "organization_vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_integrations" ADD CONSTRAINT "document_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_tours" ADD CONSTRAINT "dashboard_tours_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_processor_id_processors_id_fk" FOREIGN KEY ("processor_id") REFERENCES "public"."processors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_dataset" ADD CONSTRAINT "master_dataset_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_lead_sheets" ADD CONSTRAINT "master_lead_sheets_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mid_role_assignments" ADD CONSTRAINT "mid_role_assignments_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_oauth_credentials" ADD CONSTRAINT "agency_oauth_credentials_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment_workflow" ADD CONSTRAINT "role_assignment_workflow_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_progress" ADD CONSTRAINT "upload_progress_processor_id_fkey" FOREIGN KEY ("processor_id") REFERENCES "public"."processors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_progress" ADD CONSTRAINT "upload_progress_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_issues" ADD CONSTRAINT "audit_issues_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_issues" ADD CONSTRAINT "audit_issues_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "no_mid_declarations" ADD CONSTRAINT "no_mid_declarations_processor_id_fkey" FOREIGN KEY ("processor_id") REFERENCES "public"."processors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "no_mid_declarations" ADD CONSTRAINT "no_mid_declarations_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_agencies" ADD CONSTRAINT "user_agencies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_agencies" ADD CONSTRAINT "user_agencies_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_monthly_data" ADD CONSTRAINT "mt_monthly_data_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."mt_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_monthly_data" ADD CONSTRAINT "mt_monthly_data_subaccount_id_fkey" FOREIGN KEY ("subaccount_id") REFERENCES "public"."mt_subaccounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_monthly_data" ADD CONSTRAINT "mt_monthly_data_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."mt_merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_monthly_data" ADD CONSTRAINT "mt_monthly_data_processor_id_fkey" FOREIGN KEY ("processor_id") REFERENCES "public"."mt_processors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_audit_logs" ADD CONSTRAINT "mt_audit_logs_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."mt_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_audit_logs" ADD CONSTRAINT "mt_audit_logs_subaccount_id_fkey" FOREIGN KEY ("subaccount_id") REFERENCES "public"."mt_subaccounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_subaccounts" ADD CONSTRAINT "mt_subaccounts_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."mt_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_users" ADD CONSTRAINT "mt_users_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."mt_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_users" ADD CONSTRAINT "mt_users_subaccount_id_fkey" FOREIGN KEY ("subaccount_id") REFERENCES "public"."mt_subaccounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_processors" ADD CONSTRAINT "mt_processors_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."mt_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_processors" ADD CONSTRAINT "mt_processors_subaccount_id_fkey" FOREIGN KEY ("subaccount_id") REFERENCES "public"."mt_subaccounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_merchants" ADD CONSTRAINT "mt_merchants_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."mt_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_merchants" ADD CONSTRAINT "mt_merchants_subaccount_id_fkey" FOREIGN KEY ("subaccount_id") REFERENCES "public"."mt_subaccounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mt_merchants" ADD CONSTRAINT "mt_merchants_processor_id_fkey" FOREIGN KEY ("processor_id") REFERENCES "public"."mt_processors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_monthly_data_idx" ON "monthly_data" USING btree ("merchant_id" text_ops,"processor_id" text_ops,"month" int4_ops,"agency_id" text_ops);--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_mt_monthly_data_agency" ON "mt_monthly_data" USING btree ("agency_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_mt_audit_logs_agency" ON "mt_audit_logs" USING btree ("agency_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_mt_subaccounts_agency" ON "mt_subaccounts" USING btree ("agency_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_mt_users_agency" ON "mt_users" USING btree ("agency_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_mt_users_email" ON "mt_users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_mt_merchants_agency" ON "mt_merchants" USING btree ("agency_id" uuid_ops);
*/