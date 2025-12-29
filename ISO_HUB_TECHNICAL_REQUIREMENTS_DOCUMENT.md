# ISO Hub Technical Requirements Document
**Version**: 1.0  
**Date**: July 30, 2025  
**Author**: Technical Architecture Team  
**Purpose**: Comprehensive technical specification for ISO Hub multi-tenant platform

---

## Executive Summary

ISO Hub is a comprehensive multi-tenant SAAS platform serving the merchant services industry with three integrated components:
1. **ISO Hub Core** - Client onboarding, pre-applications, and document management
2. **ISO Hub Residuals** - Financial data processing and commission tracking
3. **ISO Hub AI** - Intelligent document processing and merchant analysis

The platform serves payment processing companies, agents, and partners with role-based access control, whitelabel capabilities, and enterprise-grade security.

---

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript, Vite build system, Wouter routing
- **Backend**: Express.js + TypeScript, RESTful API architecture  
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations
- **Styling**: Tailwind CSS + shadcn/ui component library
- **State Management**: TanStack Query for server state
- **Authentication**: JWT tokens with role-based access control
- **Deployment**: Replit infrastructure with automated scaling

### Core Design Principles
- **Multi-tenancy**: Complete data isolation between organizations
- **Type Safety**: End-to-end TypeScript implementation
- **Mobile-First**: Progressive Web App with responsive design
- **Role-Based Security**: Granular permissions across user hierarchies
- **API-First**: Backend services expose RESTful endpoints
- **Data Integrity**: Comprehensive validation and audit systems

---

## 1. ISO Hub Core Platform

### 1.1 Authentication & User Management
```typescript
// User Role Hierarchy
enum UserRole {
  SUPER_ADMIN = 'super_admin',    // Platform administrator
  ADMIN = 'admin',                // Organization administrator  
  MANAGER = 'manager',            // Department manager
  TEAM_LEADER = 'team_leader',    // Team lead
  AGENT = 'agent',                // Sales agent/rep
  PARTNER = 'partner'             // External partner
}
```

**Key Features:**
- JWT-based authentication with 2-hour token expiration
- Multi-factor authentication (MFA) with QR codes
- Password policy enforcement and account lockout
- Super admin impersonation for support scenarios

### 1.2 Multi-Tenant Organization System
**Database Schema:**
```sql
-- Core organization table
agencies(
  id: UUID PRIMARY KEY,
  name: VARCHAR(255),
  agency_code: VARCHAR(20) UNIQUE, -- e.g., "TRM-2025-001"
  domain_config: JSONB,           -- Whitelabel domain settings
  branding: JSONB,                -- Colors, logos, themes
  subscription_tier: ENUM,
  status: ENUM('active', 'suspended', 'trial'),
  created_at: TIMESTAMP
)

-- User-organization relationships
agency_users(
  id: UUID PRIMARY KEY,
  agency_id: UUID REFERENCES agencies(id),
  user_id: UUID REFERENCES users(id),
  role: user_role_enum,
  permissions: JSONB,
  is_active: BOOLEAN DEFAULT true
)
```

### 1.3 Pre-Application System

**Personalized Link Generation:**
- Format: `https://isohub.io/{agencyCode}/{fullname}`
- Example: `https://isohub.io/TRM-2025-001/john-smith`
- Agency codes auto-generated: Business initials + year + sequence

**Form Processing Flow:**
1. **Link Generation**: Agent creates personalized link for prospect
2. **Form Submission**: Prospect completes pre-application form
3. **Data Capture**: Form data stored with agent association
4. **Email Notifications**: Automated emails to agent and prospect
5. **Status Tracking**: Application moves through approval pipeline

**Technical Implementation:**
```typescript
// Pre-application form handler
POST /form-submit/:agencyCode/:fullname
{
  businessName: string,
  contactInfo: ContactDetails,
  businessDetails: BusinessInfo,
  processingNeeds: ProcessingRequirements,
  agentCode: string // Derived from URL
}
```

### 1.4 Secured Document Portal

**Access Control:**
- Unique secure links: `https://isohub.io/secured/{name}/documents`
- Time-limited access with expiration dates
- Document encryption at rest and in transit
- Access logging and audit trails

**Document Management:**
- Multi-format support (PDF, DOC, images)
- Version control and document history
- Digital signatures and approval workflows
- Automated document categorization

### 1.5 Login Portal System

**Vendor Categories:**
```typescript
interface VendorCategory {
  processors: Vendor[],      // Payment processors
  gateways: Vendor[],        // Payment gateways  
  hardware: Vendor[],        // POS/terminal equipment
  internal: Vendor[]         // Internal business tools
}
```

**Vendor Data Structure:**
```sql
vendors(
  id: UUID PRIMARY KEY,
  name: VARCHAR(255),
  category: vendor_category_enum,
  logo_url: VARCHAR(500),
  portal_url: VARCHAR(500),
  contact_info: JSONB,
  credentials_required: BOOLEAN,
  status: ENUM('active', 'inactive')
)
```

---

## 2. ISO Hub Residuals System

### 2.1 Data Ingestion Architecture

**Processor Integration:**
The system handles CSV/Excel files from multiple payment processors:
- Payment Advisors, Clearent, Global Payments TSYS
- Merchant Lynx, Micamp Solutions, Shift4, TRX
- PayBright, First Data, Fiserv Omaha

**File Processing Pipeline:**
```typescript
// CSV Processing Service
class ProcessorFileHandler {
  parseFile(file: File, processorType: ProcessorType): MerchantRecord[]
  validateData(records: MerchantRecord[]): ValidationResult
  crossReference(records: MerchantRecord[], leadSheet: LeadSheet): MatchResult
  insertBatch(records: MerchantRecord[]): DatabaseResult
}
```

### 2.2 Database Schema - Residuals Core

```sql
-- Merchant master table
merchants(
  id: UUID PRIMARY KEY,
  mid: VARCHAR(50) UNIQUE,          -- Merchant ID (primary key across processors)
  branch_id: VARCHAR(50),           -- Branch identifier for cross-referencing
  business_name: VARCHAR(255),
  processor_id: UUID REFERENCES processors(id),
  status: merchant_status_enum,
  created_at: TIMESTAMP
)

-- Monthly financial data
monthly_data(
  id: UUID PRIMARY KEY,
  merchant_id: UUID REFERENCES merchants(id),
  processor_id: UUID REFERENCES processors(id),
  month: DATE,                      -- YYYY-MM-01 format
  revenue: DECIMAL(10,2),          -- Residual amount
  volume: DECIMAL(15,2),           -- Processing volume
  transaction_count: INTEGER,
  fees: DECIMAL(10,2),
  net_income: DECIMAL(10,2)
)

-- Lead sheet tracking (for cross-referencing)
lead_sheets(
  id: UUID PRIMARY KEY,
  month: DATE,
  merchant_mid: VARCHAR(50),
  branch_id: VARCHAR(50),          -- Used for MID/Branch cross-reference
  application_status: ENUM('pending', 'approved', 'declined'),
  agent_assigned: UUID REFERENCES users(id),
  upload_date: TIMESTAMP
)
```

### 2.3 MID Cross-Referencing System

**Cross-Reference Logic:**
1. **Primary Match**: Direct MID matching across processors
2. **Branch ID Match**: Secondary matching using branch identifiers
3. **Business Name Fuzzy Match**: Algorithmic name matching for edge cases
4. **Manual Resolution**: Admin interface for unmatched records

```typescript
interface CrossReferenceEngine {
  findMatches(newRecord: MerchantRecord): MatchCandidate[]
  validateMatch(candidate: MatchCandidate): MatchConfidence
  mergeRecords(existing: MerchantRecord, new: MerchantRecord): MerchantRecord
  flagAmbiguous(records: MerchantRecord[]): AuditItem[]
}
```

### 2.4 Commission Split System

**Role Assignment Architecture:**
```sql
-- Commission roles (5 standard roles)
roles(
  id: UUID PRIMARY KEY,
  name: VARCHAR(100),               -- "Agent", "Sales Manager", "Partner", etc.
  description: TEXT,
  is_active: BOOLEAN DEFAULT true
)

-- Assignment of users to roles
role_assignments(
  id: UUID PRIMARY KEY,
  merchant_id: UUID REFERENCES merchants(id),
  user_id: UUID REFERENCES users(id),
  role_id: UUID REFERENCES roles(id),
  percentage: DECIMAL(5,2),         -- Must total 100% per merchant
  effective_date: DATE,
  created_by: UUID REFERENCES users(id)
)

-- Validation constraint: SUM(percentage) = 100 per merchant
```

**Split Logic Implementation:**
```typescript
class CommissionSplitEngine {
  validateSplit(assignments: RoleAssignment[]): ValidationResult {
    const total = assignments.reduce((sum, a) => sum + a.percentage, 0)
    return { isValid: total === 100, total, missing: 100 - total }
  }
  
  calculatePayouts(merchantRevenue: number, assignments: RoleAssignment[]): Payout[] {
    return assignments.map(a => ({
      userId: a.user_id,
      amount: merchantRevenue * (a.percentage / 100),
      percentage: a.percentage
    }))
  }
}
```

### 2.5 Seven-Step Workflow System

**Step 1-2: File Upload & Validation**
- Green/red status indicators per processor/month
- Real-time validation during upload
- Duplicate detection and error reporting

**Step 3: Data Compilation**
- Cross-processor data aggregation
- MID deduplication and merging
- Master dataset generation

**Step 4: Role Assignment Logic** 
- Column I role identification from spreadsheets
- Automatic user mapping where possible
- Manual assignment interface for exceptions

**Step 5: Admin Assignment Interface**
- Percentage-based commission splits
- 100% validation across all roles
- Bulk assignment tools for efficiency

**Step 6: Audit Tool Integration**
- Data inconsistency detection
- Missing assignment alerts
- Revenue reconciliation checks

**Step 7: Permission-Based Reporting**
- Role-filtered data access
- Agent-specific revenue views
- Comprehensive report generation

### 2.6 Reporting Engine

**Report Types:**
```typescript
enum ReportType {
  AGENT_SUMMARY = 'agent_summary',
  PROCESSOR_BREAKDOWN = 'processor_breakdown', 
  MONTHLY_TRENDS = 'monthly_trends',
  COMMISSION_SPLITS = 'commission_splits',
  AUDIT_EXCEPTIONS = 'audit_exceptions',
  PARTNER_PAYOUTS = 'partner_payouts'
}
```

**Role-Based Data Filtering:**
```typescript
class ReportAccessController {
  filterDataByRole(data: MerchantRecord[], userRole: UserRole, userId: string): MerchantRecord[] {
    switch(userRole) {
      case UserRole.AGENT:
        return data.filter(record => record.assignedAgentId === userId)
      case UserRole.MANAGER:
        return data.filter(record => record.teamManagerId === userId)
      case UserRole.ADMIN:
        return data // Full access
      default:
        return []
    }
  }
}
```

---

## 3. ISO Hub AI System

### 3.1 AI Architecture Overview

**Core AI Components:**
- **Document Intelligence**: OCR and data extraction
- **JACC AI Assistant**: Multi-model orchestration system
- **Competitive Intelligence**: Market analysis and insights
- **Voice Processing**: Speech-to-text and analysis (planned)

### 3.2 Database Schema - AI System

```sql
-- AI Organizations (separate from main agencies)
iso_ai_organizations(
  id: UUID PRIMARY KEY,
  name: VARCHAR(255),
  api_key: VARCHAR(255) UNIQUE,
  usage_quota: INTEGER,
  current_usage: INTEGER DEFAULT 0,
  settings: JSONB
)

-- AI Agents/Representatives
iso_ai_agents(
  id: UUID PRIMARY KEY,
  organization_id: UUID REFERENCES iso_ai_organizations(id),
  name: VARCHAR(255),
  email: VARCHAR(255),
  role: agent_role_enum,
  portfolio_size: INTEGER DEFAULT 0,
  performance_metrics: JSONB
)

-- Merchant Portfolio Management
iso_ai_merchants(
  id: UUID PRIMARY KEY,
  organization_id: UUID REFERENCES iso_ai_organizations(id),
  agent_id: UUID REFERENCES iso_ai_agents(id),
  business_name: VARCHAR(255),
  industry: VARCHAR(100),
  risk_score: DECIMAL(3,2),
  processing_volume: DECIMAL(15,2),
  ai_insights: JSONB
)

-- AI Processing Reports
iso_ai_reports(
  id: UUID PRIMARY KEY,
  organization_id: UUID REFERENCES iso_ai_organizations(id),
  report_type: ai_report_type_enum,
  generated_by: UUID REFERENCES iso_ai_agents(id),
  content: JSONB,
  confidence_score: DECIMAL(3,2),
  processing_time_ms: INTEGER
)
```

### 3.3 JACC AI Assistant System

**Multi-Model Architecture:**
```typescript
interface AIModelOrchestrator {
  models: {
    claude4: ClaudeAPI,           // Primary reasoning
    gpt4o: OpenAIAPI,            // Document analysis  
    perplexity: PerplexityAPI    // Real-time research
  }
  
  processQuery(query: string, context: DocumentContext): AIResponse
  selectOptimalModel(queryType: QueryType): AIModel
  combineResponses(responses: AIResponse[]): ConsolidatedResponse
}
```

**Document Intelligence Pipeline:**
1. **OCR Processing**: Extract text from PDFs, images, scanned documents
2. **Classification**: Categorize document types (applications, statements, contracts)
3. **Data Extraction**: Pull structured data from unstructured documents
4. **Validation**: Cross-reference extracted data with known patterns
5. **Insight Generation**: Generate business insights and recommendations

### 3.4 Agent Management System

**Portfolio Tracking:**
```typescript
interface AgentPortfolio {
  merchantCount: number,
  totalVolume: number,
  averageTicket: number,
  riskDistribution: RiskMetrics,
  growthTrends: TrendData,
  performanceScore: number
}
```

**Performance Analytics:**
- Merchant acquisition rates
- Portfolio growth metrics  
- Risk assessment accuracy
- Client retention statistics
- Revenue generation tracking

---

## 4. Integration Architecture

### 4.1 Inter-System Communication

**Shared User Authentication:**
All three systems share a common authentication layer with JWT tokens containing organization and role information.

**Data Synchronization:**
```typescript
interface CrossSystemSync {
  syncMerchantData(hubMerchant: Merchant): Promise<AIAnalysis>
  updateAgentAssignments(residualData: Assignment[]): Promise<void>
  shareDocumentInsights(aiInsights: DocumentAnalysis[]): Promise<void>
}
```

### 4.2 API Gateway Architecture

**Unified API Structure:**
```
/api/core/*          - ISO Hub Core endpoints
/api/residuals/*     - Residuals system endpoints  
/api/ai/*            - AI system endpoints
/api/shared/*        - Cross-system shared services
```

### 4.3 Security & Compliance

**Data Protection:**
- AES-256 encryption for sensitive data
- TLS 1.3 for all communications
- SOC 2 Type II compliance preparation
- GDPR/CCPA privacy controls

**Access Controls:**
- Role-based permissions (RBAC)
- API rate limiting by organization
- Audit logging for all operations
- Data retention policies

---

## 5. Deployment & Operations

### 5.1 Infrastructure Requirements

**Production Specifications:**
- **Database**: PostgreSQL 15+ with connection pooling
- **Application**: Node.js 20+ with PM2 process management
- **Frontend**: Static assets served via CDN
- **Monitoring**: Health checks, metrics collection, error tracking

### 5.2 Scaling Considerations

**Multi-Tenant Scaling:**
- Database sharding by organization ID
- Horizontal API server scaling
- CDN distribution for static assets
- Background job processing queues

### 5.3 Backup & Recovery

**Data Protection:**
- Daily automated database backups
- Point-in-time recovery capabilities
- Cross-region backup replication
- Disaster recovery procedures

---

## 6. Development Guidelines

### 6.1 Code Standards

- **TypeScript Strict Mode**: Enabled across all codebases
- **ESLint/Prettier**: Automated code formatting
- **Test Coverage**: Minimum 80% coverage for business logic
- **API Documentation**: OpenAPI 3.0 specifications

### 6.2 Database Migrations

```bash
# Drizzle ORM migration commands
npm run db:generate    # Generate migration files
npm run db:push       # Push schema changes to database
npm run db:migrate    # Run pending migrations
```

### 6.3 Environment Configuration

```typescript
// Required environment variables
interface EnvironmentConfig {
  DATABASE_URL: string,
  JWT_SECRET: string,
  OPENAI_API_KEY: string,
  SMTP_CONFIG: SMTPSettings,
  REPLIT_DOMAIN: string
}
```

---

## Conclusion

The ISO Hub platform represents a comprehensive solution for merchant services management, combining client onboarding, financial tracking, and AI-powered insights into a unified multi-tenant system. The architecture prioritizes data integrity, security, and scalability while maintaining clear separation of concerns across the three core components.

This technical specification provides the foundation for development team handoffs, system maintenance, and future feature development within the ISO Hub ecosystem.

---

**Document Control:**
- **Next Review Date**: August 30, 2025
- **Stakeholders**: Development Team, Product Management, Architecture Review Board
- **Classification**: Internal Technical Documentation