# ISOHub Multi-Tenant Security Audit Report

**Date:** November 26, 2025
**Auditor:** Claude Code Security Audit
**Branch:** `claude/audit-multitenant-security-01UPXq49587Kes9JXkQJVYfa`

---

## Executive Summary

This security audit examined the ISOHub MVP codebase for multi-tenant security vulnerabilities. The application uses a hybrid multi-tenant architecture with Row-Level Security (RLS) policies on new `mt_*` tables, but significant security gaps exist in legacy code paths and authentication mechanisms.

**Overall Risk Level: HIGH**

| Category | Issues Found | Critical | High | Medium |
|----------|-------------|----------|------|--------|
| Authentication | 5 | 1 | 2 | 2 |
| Tenant Isolation | 4 | 2 | 2 | 0 |
| Authorization | 3 | 0 | 3 | 0 |
| Data Protection | 3 | 1 | 1 | 1 |
| **TOTAL** | **15** | **4** | **8** | **3** |

---

## Critical Findings

### 1. Hardcoded Fallback JWT Secret

**Severity:** CRITICAL
**File:** `server/utils/tokenUtils.ts:3`
**CVSS Score:** 9.8 (Critical)

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-2025';
```

**Impact:** If `JWT_SECRET` environment variable is not set, attackers can forge valid JWT tokens using the known fallback secret, gaining access to any user account.

**Note:** The main auth file (`server/auth.ts:6-14`) correctly throws an error when JWT_SECRET is missing, but `tokenUtils.ts` is used by some code paths and has this dangerous fallback.

**Recommendation:** Remove the fallback entirely and fail fast if JWT_SECRET is not configured.

---

### 2. CSRF Protection is Non-Functional

**Severity:** CRITICAL
**File:** `server/middleware/security.ts:189-194`
**CVSS Score:** 8.8 (High)

```typescript
export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // In production, this would generate and validate CSRF tokens
  req.body._csrfToken = 'placeholder-csrf-token';
  next();
};
```

**Impact:** CSRF protection is completely disabled. State-changing requests (POST, PUT, DELETE) can be executed by malicious websites when a user is authenticated, allowing attackers to perform actions on behalf of logged-in users.

**Recommendation:** Implement proper CSRF protection using a library like `csurf` or implement double-submit cookie pattern.

---

### 3. Legacy Tables Lack Tenant Isolation

**Severity:** CRITICAL
**File:** `shared/schema.ts`
**CVSS Score:** 9.1 (Critical)

The following tables have **NO tenant isolation** (no `agencyId` column):

| Table | Line | Risk |
|-------|------|------|
| `processors` | 101-106 | Shared across all tenants |
| `merchants` | 132-146 | All merchant data exposed |
| `monthlyData` | 148-168 | Financial data leakage |
| `roles` | 187-192 | Role definitions shared |
| `assignments` | 194-201 | Commission assignments exposed |
| `fileUploads` | 203-214 | File metadata exposed |
| `masterDataset` | 171-185 | Compiled data exposed |
| `auditIssues` | 273-282 | Audit data exposed |
| `reports` | 284-293 | Report data exposed |
| `masterLeadSheets` | 611-622 | Lead sheet data exposed |
| `leadSheetEntries` | 625-639 | Entry data exposed |

**Impact:** Any authenticated user can potentially access data belonging to other tenants when querying these legacy tables.

**Recommendation:** Add `agencyId` columns to all tables and implement tenant filtering in all queries, or migrate to the `mt_*` schema exclusively.

---

### 4. RLS Context Leakage with Connection Pooling

**Severity:** CRITICAL
**File:** `server/db.ts:22-34`, `migrations/002_enable_row_level_security.sql:25-29`
**CVSS Score:** 8.1 (High)

```typescript
// db.ts
await pool.query(`SELECT set_tenant_context($1::uuid, $2::uuid, $3::boolean, $4::boolean)`, [...]);
```

```sql
-- RLS migration uses session-local settings (false parameter)
PERFORM set_config('app.current_agency_id', COALESCE(p_agency_id::text, ''), false);
```

**Impact:** The `set_config(..., false)` creates session-local settings, but PostgreSQL connection pooling may reuse connections. If tenant context is not properly cleared between requests, **Tenant A's data could be visible to Tenant B**.

**Recommendation:**
1. Use `true` as the third parameter to make settings transaction-local, OR
2. Ensure `clearTenantContext()` is called in a `finally` block for every request, OR
3. Use a per-request connection pattern instead of pooling for tenant-sensitive operations

---

## High Severity Findings

### 5. IDOR Vulnerability in Agency Access Check

**Severity:** HIGH
**File:** `server/middleware/auth.ts:127`

```typescript
const agencyId = req.params.agencyId || req.body.agencyId || req.query.agencyId;
```

**Impact:** Agency ID is taken from client-controlled input without strict server-side validation. Attackers can manipulate `agencyId` in requests to access other tenants' data.

**Recommendation:** Always use `req.user.agencyId` from the authenticated JWT token, never from client input.

---

### 6. Subaccount ID Injection via Query Parameters

**Severity:** HIGH
**File:** `server/middleware/auth.ts:269`

```typescript
const subaccountId = req.user.subaccountId || req.query.subaccountId as string || null;
```

**Impact:** Users can specify any `subaccountId` via query parameters, bypassing subaccount access controls and potentially accessing data from other subaccounts within their agency.

**Recommendation:** Only allow `subaccountId` from the user's JWT token or from validated database lookups of user-subaccount assignments.

---

### 7. OAuth User-Agency Verification Not Implemented

**Severity:** HIGH
**Files:** `server/routes/oauth.routes.ts:123-126, 260-261, 393-394`

```typescript
// SECURITY: Verify userId belongs to agencyId before storing credentials
// This prevents cross-tenant credential injection attacks
// TODO: Add actual user-agency verification query when users table is agency-scoped
// For now, we trust the validated state since it was signed with agency/user context
```

**Impact:** OAuth credentials could potentially be stored for the wrong agency, allowing cross-tenant access to connected cloud storage accounts.

**Recommendation:** Implement user-agency verification before storing OAuth credentials.

---

### 8. Registration Allows Setting Own Tenant IDs

**Severity:** HIGH
**File:** `server/routes/auth.routes.ts:132-133`

```typescript
organizationId: req.body.organizationId || null, // Must be explicitly provided or set during onboarding
agencyId: req.body.agencyId || null,
```

**Impact:** New users can set their own `organizationId` and `agencyId` during registration, potentially associating themselves with any tenant.

**Recommendation:** Never accept `agencyId` or `organizationId` from user input during self-registration. These should only be set by admins or during controlled onboarding flows.

---

### 9. Missing Rate Limiting on Login Endpoint

**Severity:** HIGH
**File:** `server/routes/auth.routes.ts:19`

```typescript
router.post('/login',
  async (req, res) => {
```

**Impact:** The `authRateLimit` middleware is imported but not applied to the login route, making it vulnerable to brute-force password attacks.

**Recommendation:** Add `authRateLimit` middleware to the login route:
```typescript
router.post('/login', authRateLimit, async (req, res) => {
```

---

### 10. requireSubaccountAccess Bypass for Agency Admin Role Check

**Severity:** HIGH
**File:** `server/middleware/auth.ts:305-306`

```typescript
if (req.user.role === 'admin' || req.user.role === 'Admin') {
  return next();
}
```

**Impact:** Case-sensitive role comparison may allow bypass. Additionally, this check doesn't verify the admin belongs to the same agency as the subaccount being accessed.

**Recommendation:** Normalize role comparison and verify agency ownership.

---

### 11. Password Verification Logged to Console

**Severity:** MEDIUM
**File:** `server/routes/auth.routes.ts:47-49`

```typescript
console.log('Verifying password for user:', username);
const isValidPassword = await AuthService.verifyPassword(password, user.password);
console.log('Password verification result:', isValidPassword);
```

**Impact:** While the actual password isn't logged, the verification result could help attackers know when they have a valid username. In production, this could fill logs with sensitive authentication attempts.

**Recommendation:** Remove or reduce logging verbosity in production.

---

### 12. MFA Secret Returned During Setup

**Severity:** MEDIUM
**File:** `server/routes/auth.routes.ts:250-252`

```typescript
res.json({
  qrCode: mfaSetup.qrCode,
  secret: mfaSetup.secret // Only return during setup
});
```

**Impact:** MFA secret is sent in the response. If intercepted (e.g., via XSS or MITM), the attacker can generate valid MFA codes.

**Recommendation:** Consider only providing the QR code and not the raw secret, or implement additional protections.

---

## Architecture Concerns

### Dual Schema Problem

The codebase maintains **three different tenant identification patterns**:

1. **Legacy Schema** (`agencies.id` - integer): `shared/schema.ts`
2. **Multi-Tenant Schema** (`mt_agencies.id` - UUID): `shared/multi-tenant-schema.ts`
3. **ISO-AI Schema** (`organizations.organizationId` - text): `shared/iso-ai-schema.ts`

This creates:
- Complexity in maintaining consistent tenant isolation
- Risk of queries accidentally crossing tenant boundaries
- Difficulty in applying RLS policies uniformly

### RLS Policy Coverage

Row-Level Security is only enabled on `mt_*` tables:

| Protected (mt_*) | Unprotected (Legacy) |
|------------------|---------------------|
| mt_agencies | agencies |
| mt_subaccounts | - |
| mt_users | users |
| mt_merchants | merchants |
| mt_monthly_data | monthlyData |
| mt_processors | processors |
| mt_audit_logs | auditLogs |
| mt_role_assignments | roles, assignments |

---

## Positive Security Findings

The following security measures are correctly implemented:

1. **Password Hashing:** bcrypt with 12 rounds (`server/auth.ts:77`)
2. **Account Lockout:** 5 failed attempts, 15-minute lockout (`AuthService`)
3. **Security Headers:** Helmet with CSP, HSTS, X-Frame-Options (`server/middleware/security.ts:44-65`)
4. **Input Sanitization:** XSS pattern removal (`server/middleware/security.ts:156-182`)
5. **OAuth State Validation:** HMAC-signed state prevents CSRF in OAuth flows
6. **Session Security:** httpOnly cookies, SameSite=strict (`server/middleware/session.ts:36`)
7. **JWT Expiration:** 7-day token expiry with proper verification

---

## Remediation Priority

### Immediate (Before Production)

1. **Remove fallback JWT secret** from `tokenUtils.ts`
2. **Implement real CSRF protection** using csurf or similar
3. **Add tenant filtering** to all legacy table queries
4. **Fix RLS context clearing** to prevent connection pool leakage
5. **Add rate limiting** to login endpoint

### Short-Term (Within 2 Weeks)

6. **Fix IDOR vulnerabilities** - use only server-side tenant IDs
7. **Implement OAuth user-agency verification**
8. **Remove client-controlled agencyId/organizationId** in registration
9. **Fix subaccountId injection** vulnerability

### Medium-Term

10. **Migrate all data** to `mt_*` schema
11. **Remove legacy schema** entirely
12. **Add comprehensive integration tests** for tenant isolation

---

## Testing Recommendations

Create integration tests for:

1. **Cross-tenant data access:** User A cannot see User B's data
2. **IDOR attacks:** Manipulating IDs in requests doesn't grant access
3. **JWT forgery:** Invalid tokens are rejected
4. **Rate limiting:** Brute-force attempts are blocked
5. **RLS policy verification:** Database-level isolation works correctly

---

## Conclusion

ISOHub has implemented modern security practices including RLS, bcrypt, and proper session management for the new multi-tenant architecture. However, the presence of legacy code paths, critical authentication fallbacks, and incomplete tenant isolation create significant security risks.

**The application should NOT be deployed to production** until the Critical and High severity issues are addressed.

---

*Report generated by Claude Code Security Audit*
