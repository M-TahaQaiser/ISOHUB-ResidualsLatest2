# replit.md

## Overview
ISO Hub Residuals is a comprehensive merchant services residual tracking system designed for payment processing companies and agents. It enables data upload, residual payment tracking, role management, and AI-powered report generation. The system aims to modernize financial residual management, streamline operations, and provide intelligent analytics to offer a competitive advantage in the payment processing industry.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application uses a monorepo architecture with distinct client, server, and shared components, emphasizing type safety, developer experience, and scalability.

**UI/UX Decisions:**
- **Branding**: ISOHub's signature black, yellow, and white color scheme.
- **Design System**: Radix UI primitives, custom shadcn/ui components, and Tailwind CSS.
- **Responsiveness**: Mobile-first design with PWA capabilities.
- **Theming**: Dark/light theme system using CSS variables.
- **UI Enhancements**: Global keyboard shortcuts, saved filter presets, quick filter buttons, global search, interactive revenue trend charts, progress indicators, and chat heads for role assignments.

**Technical Implementations:**
- **Frontend**: React SPA with TypeScript, Vite, Wouter, React Hook Form (Zod), and TanStack Query.
- **Backend**: Express.js REST API with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **File Processing**: Multer for CSV uploads with custom parsing.
- **Email Service**: For notifications and report distribution.
- **Multi-tenancy**: GoHighLevel-style architecture with an organization-agency bridge for data isolation and `TenancyService` for ID resolution.
- **RBAC**: Comprehensive role-based access control with 6 role types and data filtering.
- **Dual Authentication**: JWT for regular users and session-based (httpOnly cookies) for business owner analytics, stored in PostgreSQL.
- **Security**: Enterprise-grade, compliant with USA financial regulations (GLBA, PCI DSS 4.0). Includes AES-256-GCM encryption for sensitive data, strong password policies, TOTP-based MFA, step-up re-authentication for high-risk operations, rate limiting, Helmet.js for security headers, Zod for input validation, CORS, secure secrets management, and audit logging.
- **Workflow**: Guided 4-step residuals processing (Upload → Auto-Compile → Assign → Audit) with progressive step locking and explicit database save confirmations.
- **Branded Tools**: URL shortener and whitelabeling for domain/email management.
- **Management Systems**: Master Lead Sheet for merchant inventory and lifecycle, and Monthly Audit System for data upload status.
- **Analytics Library**: Advanced reporting utilities for revenue concentration, merchant trends, and financial metrics.
- **Commission Data Pipeline**: Connects processor uploads, role assignments, and commission calculations using `monthlyData` and `midRoleAssignments` tables.
- **Multi-processor Support**: Handles data from various payment processors.
- **Intelligent Data Management**: MID Matching and Data Quality Auditing.
- **Flexible Role System**: Supports complex commission structures.
- **AI-Powered Reporting**: Natural language query interface for custom reports.
- **User Management**: CRUD operations with RBAC, email notifications, and Super Admin impersonation.
- **Agency Onboarding**: 8-step setup process including whitelabel configuration, company info, org chart, business profile, vendor selection, processor report setup, document hub, and dashboard tour.
- **Processor Column Mapping**: One-time setup for mapping report columns to system fields with auto-suggestions.
- **Personalized Links**: Dynamic URL generation for forms.
- **Vendor Portal**: Database for payment processing vendors.
- **Unified Reporting**: Consolidated reports interface with various types and filtering.
- **Residuals Dashboard**: Redesigned dashboard with monthly data selection and performance analytics.
- **Integrated Commission Assignment**: Role assignment within the 4-step residuals workflow.
- **ISO-AI Chat Assistant**: Full-featured AI chatbot powered by Anthropic Claude with streaming responses, guided flows, image analysis, chat organization, and knowledge base search.
- **Document Center (JACC Integration Phase 1)**: Knowledge base management system integrated into ISO-AI sidebar with document upload, semantic search (pgvector embeddings), approval workflow, role-based visibility, and multi-tenant isolation.
- **Advanced Analytics (TRACER C2 Integration)**: Revenue concentration analysis, merchant trend tracking, and business insights.
- **Business Owner Analytics Dashboard**: High-level executive dashboard with session-based authentication, showing total revenue, merchant counts, processor analytics, revenue trends, market share, and top merchants.
- **Enhanced Date Selection**: `MonthYearSelector` component going back to 1980 with quick select buttons.
- **Demo Data Generation**: Admin-only endpoints for seeding realistic 2-year demo data.
- **ISO-Sign (Electronic Signature System)**: DocuSign-like e-signature module with 6 database tables for envelope lifecycle, encrypted document storage, signed URLs, and an audit trail.
- **ISO-AI Tool-Calling Architecture**: Advanced AI system using Anthropic Claude with function calling, memory, and orchestration. Includes:
    - `ToolRegistry`: Central registry of 12 tools including merchant lookup, revenue data, assignments, knowledge base, ISO-Sign envelope status, pending signatures, onboarding progress, and step guidance.
    - `ToolDispatcher`: Executes tool calls with audit logging, sensitive data redaction, security context validation, and confidence scoring.
    - `MemoryStore`: Organization-scoped conversation memory for fact extraction, user preference tracking, and context injection.
    - `Orchestrator`: Multi-step workflow coordination for complex operations.
    - `ClaudeService Integration`: Enhanced `streamMessageWithTools()` method to handle tool calls and aggregate confidence scores.
    - `Frontend Integration`: ISOAI page and widget use `/api/jacc/messages/stream-with-tools` endpoint for tool-enabled AI responses.
- **Testing Infrastructure**: Vitest-based unit testing framework with path alias support:
    - Configuration: `vitest.config.ts` with `@shared` and `@` aliases
    - Test Location: `server/services/__tests__/*.test.ts`
    - Coverage: V8 provider with HTML/JSON reporters
    - Run: `npx vitest run` for all tests, `npx vitest run --watch` for development
- **Compliance & Observability**: Enterprise compliance dashboard and audit logging:
    - Endpoints: `/api/compliance/metrics`, `/api/compliance/audit-log`, `/api/compliance/summary`, `/api/compliance/data-inventory`
    - Metrics: 8 compliance controls (GLBA encryption, PCI DSS passwords, MFA, session security, rate limiting, CSRF, headers, validation)
    - Audit Sources: System events (authentication, security) and AI tool executions from ToolDispatcher
    - Integration: Authentication routes log successful/failed logins via `logAuditEvent()`

## External Dependencies
- **Database**: Neon serverless PostgreSQL.
- **AI Integration**: Anthropic Claude API, OpenAI API (GPT-4o).
- **Email Service**: SMTP integration.
- **Security**: `express-rate-limit`, `Helmet`.
- **Authentication**: JWT token handling.
- **Two-Factor Authentication**: `speakeasy`, `qrcode`.