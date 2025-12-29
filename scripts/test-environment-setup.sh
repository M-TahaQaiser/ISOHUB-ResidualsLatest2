#!/bin/bash

# ============================================
# ISOHUB Multi-Tenant Test Environment Setup
# ============================================
#
# This script sets up a test database for safely running
# multi-tenant migrations before applying to production.
#
# Prerequisites:
# - PostgreSQL client installed (psql)
# - Docker installed (for local test DB) OR
# - Access to a test PostgreSQL instance
#
# Usage:
#   ./scripts/test-environment-setup.sh [options]
#
# Options:
#   --docker      Use Docker to create a test PostgreSQL container
#   --local       Use existing local PostgreSQL (default)
#   --clean       Drop existing test database and recreate
#   --migrate     Run migrations after setup
#   --verify      Run verification tests after migrations
#   --all         Run setup, migrate, and verify

set -e

# Configuration
TEST_DB_NAME="${TEST_DB_NAME:-isohub_test}"
TEST_DB_USER="${TEST_DB_USER:-isohub_test_user}"
TEST_DB_PASSWORD="${TEST_DB_PASSWORD:-test_password_$(openssl rand -hex 8)}"
TEST_DB_HOST="${TEST_DB_HOST:-localhost}"
TEST_DB_PORT="${TEST_DB_PORT:-5433}"
DOCKER_CONTAINER_NAME="isohub-test-db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
USE_DOCKER=false
CLEAN_DB=false
RUN_MIGRATE=false
RUN_VERIFY=false

for arg in "$@"; do
    case $arg in
        --docker)
            USE_DOCKER=true
            ;;
        --local)
            USE_DOCKER=false
            ;;
        --clean)
            CLEAN_DB=true
            ;;
        --migrate)
            RUN_MIGRATE=true
            ;;
        --verify)
            RUN_VERIFY=true
            ;;
        --all)
            RUN_MIGRATE=true
            RUN_VERIFY=true
            ;;
        *)
            log_warning "Unknown option: $arg"
            ;;
    esac
done

# Function to setup Docker PostgreSQL
setup_docker_db() {
    log_info "Setting up Docker PostgreSQL container..."

    # Check if container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${DOCKER_CONTAINER_NAME}$"; then
        if [ "$CLEAN_DB" = true ]; then
            log_info "Removing existing container..."
            docker rm -f $DOCKER_CONTAINER_NAME
        else
            log_info "Starting existing container..."
            docker start $DOCKER_CONTAINER_NAME
            sleep 3
            return
        fi
    fi

    # Create new container
    log_info "Creating new PostgreSQL container..."
    docker run -d \
        --name $DOCKER_CONTAINER_NAME \
        -e POSTGRES_USER=$TEST_DB_USER \
        -e POSTGRES_PASSWORD=$TEST_DB_PASSWORD \
        -e POSTGRES_DB=$TEST_DB_NAME \
        -p $TEST_DB_PORT:5432 \
        postgres:15-alpine

    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    sleep 5

    for i in {1..30}; do
        if docker exec $DOCKER_CONTAINER_NAME pg_isready -U $TEST_DB_USER > /dev/null 2>&1; then
            log_success "PostgreSQL is ready!"
            return
        fi
        sleep 1
    done

    log_error "PostgreSQL failed to start"
    exit 1
}

# Function to setup local PostgreSQL
setup_local_db() {
    log_info "Setting up local PostgreSQL database..."

    if [ "$CLEAN_DB" = true ]; then
        log_info "Dropping existing test database..."
        psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" 2>/dev/null || true
        psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U postgres -c "DROP USER IF EXISTS $TEST_DB_USER;" 2>/dev/null || true
    fi

    # Create user and database
    log_info "Creating test user and database..."
    psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U postgres <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$TEST_DB_USER') THEN
        CREATE USER $TEST_DB_USER WITH PASSWORD '$TEST_DB_PASSWORD';
    END IF;
END
\$\$;

SELECT 'CREATE DATABASE $TEST_DB_NAME OWNER $TEST_DB_USER' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$TEST_DB_NAME')\gexec

GRANT ALL PRIVILEGES ON DATABASE $TEST_DB_NAME TO $TEST_DB_USER;
EOF

    log_success "Local database setup complete!"
}

# Function to run migrations
run_migrations() {
    log_info "Running multi-tenant migrations..."

    # Set test database URL
    export TEST_DATABASE_URL="postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}:${TEST_DB_PORT}/${TEST_DB_NAME}"

    cd "$(dirname "$0")/../migrations"

    # Run DDL migrations
    log_info "Running 001_create_multi_tenant_tables.sql..."
    PGPASSWORD=$TEST_DB_PASSWORD psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER -d $TEST_DB_NAME -f 001_create_multi_tenant_tables.sql

    log_info "Running 002_enable_row_level_security.sql..."
    PGPASSWORD=$TEST_DB_PASSWORD psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER -d $TEST_DB_NAME -f 002_enable_row_level_security.sql

    log_success "DDL migrations complete!"

    # Run data migration (dry-run first)
    log_info "Running data migration in dry-run mode..."
    DATABASE_URL=$TEST_DATABASE_URL npx tsx 003_migrate_existing_data.ts --dry-run --verbose

    log_success "Migrations complete!"
}

# Function to verify migrations
verify_migrations() {
    log_info "Verifying multi-tenant migrations..."

    PGPASSWORD=$TEST_DB_PASSWORD psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER -d $TEST_DB_NAME <<EOF
-- Verify tables exist
SELECT 'Tables Check' as test;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'mt_%'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT 'RLS Check' as test;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'mt_%';

-- Verify policies exist
SELECT 'Policies Check' as test;
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'mt_%';

-- Verify indexes exist
SELECT 'Indexes Check' as test;
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'mt_%'
LIMIT 10;

-- Test tenant context function
SELECT 'Tenant Context Function Check' as test;
SELECT set_tenant_context('test-agency-id', 'test-subaccount-id');
SELECT current_setting('app.current_agency_id', true) as agency_id,
       current_setting('app.current_subaccount_id', true) as subaccount_id;
EOF

    log_success "Verification complete!"
}

# Function to generate environment file
generate_env_file() {
    local env_file="$(dirname "$0")/../.env.test"

    log_info "Generating test environment file: $env_file"

    cat > "$env_file" <<EOF
# ISOHUB Test Environment Configuration
# Generated: $(date)
#
# To use this configuration:
#   source .env.test
#   npm run test
#
# WARNING: This contains test credentials. Do not use in production!

DATABASE_URL=postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}:${TEST_DB_PORT}/${TEST_DB_NAME}
NODE_ENV=test
JWT_SECRET=test-jwt-secret-minimum-32-characters-long
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Multi-tenant test configuration
MT_DEFAULT_AGENCY_ID=test-agency-001
MT_ENABLE_AUDIT_LOGS=true
MT_ENABLE_RLS=true
EOF

    log_success "Environment file generated!"
    log_info "To use: source $env_file"
}

# Main execution
main() {
    log_info "============================================"
    log_info "ISOHUB Multi-Tenant Test Environment Setup"
    log_info "============================================"
    echo ""

    # Setup database
    if [ "$USE_DOCKER" = true ]; then
        setup_docker_db
    else
        setup_local_db
    fi

    # Generate env file
    generate_env_file

    # Run migrations if requested
    if [ "$RUN_MIGRATE" = true ]; then
        run_migrations
    fi

    # Verify if requested
    if [ "$RUN_VERIFY" = true ]; then
        verify_migrations
    fi

    echo ""
    log_success "============================================"
    log_success "Test environment setup complete!"
    log_success "============================================"
    echo ""
    log_info "Test Database Connection:"
    log_info "  Host: $TEST_DB_HOST"
    log_info "  Port: $TEST_DB_PORT"
    log_info "  Database: $TEST_DB_NAME"
    log_info "  User: $TEST_DB_USER"
    echo ""
    log_info "Connection String:"
    echo "  postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}:${TEST_DB_PORT}/${TEST_DB_NAME}"
    echo ""
    log_info "Next steps:"
    log_info "  1. Source the environment file: source .env.test"
    log_info "  2. Run migrations: ./scripts/test-environment-setup.sh --migrate"
    log_info "  3. Verify setup: ./scripts/test-environment-setup.sh --verify"
    log_info "  4. Run tests: npm run test"
}

main
