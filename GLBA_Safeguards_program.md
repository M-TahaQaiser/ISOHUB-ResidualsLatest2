# GLBA Safeguards Program and Written Security Plan

## 0) Program Highlights (explicit asks answered)
- **Designated Security Officer:** Yes — see Section 2 for role, authority, and assignment requirements.
- **Risk Assessment:** Yes — see Section 3 for cadence, method, and required artifacts.

## 1) Purpose and Scope
- Document the Written Information Security Program (WISP) required by the GLBA Safeguards Rule for handling Social Security numbers, bank statements, and other NPI (non-public personal information).
- Applies to production systems, development/staging environments, backups, and third-party services that process or store customer data.

## 2) Designated Security Officer
- **Role:** Security & Privacy Officer responsible for GLBA alignment, risk management, vendor oversight, and incident response coordination.
- **Interim assignment (fill in):** `Security Officer: Jeremy Kean- 01-05-2025` — record name, role, and start date in the risk register and org chart.
- **Authority:** Can approve/deny launches, require mitigations, and pause deployments for critical security issues.
- **Standing responsibilities:** Maintain WISP, chair quarterly access reviews, own incident response, and sign off on risk assessments and encryption key rotations.

## 3) Risk Assessment (at least annually and after major changes)
- **Method:** NIST-inspired: identify assets, threats, vulnerabilities; score likelihood/impact; track mitigations in a risk register.
- **Cadence:** Annual formal assessment + ad-hoc for major product or infrastructure changes.
- **Inputs:** Architecture diagrams, data flows for SSN/bank data, access control lists, logging coverage, third-party service inventory.
- **Outputs:** Updated risk register, prioritized remediation plan, and sign-off by Security Officer.
- **Evidence to keep:** Meeting notes, updated diagrams, risk heatmap, remediation owners/dates, and Security Officer approval recorded in the register.

## 4) Administrative Safeguards
- Security awareness training for all staff handling NPI.
- Background checks for employees/contractors with production access.
- Enforced least-privilege and quarterly access reviews for AWS/DB/Admin panels.
- Vendor management: security reviews + DPAs for critical vendors (auth, storage, analytics, email, SMS).

## 5) Technical Safeguards
- **MFA:** Mandatory for all user roles and for all admin/ops access; block session issuance until MFA verified. Provide recovery codes and device revocation.
- **Step-Up Re-Authentication:** Secondary verification required for high-risk operations on sensitive NPI data:
  - **Protected Operations:** Pre-application submissions (SSN/EIN), secured document uploads (bank statements), commission exports (payroll data), user management (password resets, deletions, profile updates)
  - **Token Lifecycle:** 5-minute expiration, single-use enforcement for write operations, server-side storage with automatic cleanup
  - **Verification Methods:** Password confirmation or TOTP code (if MFA enabled)
  - **Implementation:** `requireReauth()` middleware applied to sensitive API endpoints with documented security rationale
  - **Replay Attack Prevention:** Automatic token consumption on use, preventing token reuse after sensitive operations
- **Encryption in transit:** HTTPS/TLS 1.2+ everywhere; HSTS enabled on public endpoints.
- **Encryption at rest:** Database and backups encrypted; field-level AES-256-GCM (via KMS/HSM) for SSN and bank account fields with key rotation policy.
- **Secrets management:** Use managed secrets/KMS; no secrets in code or CI logs; quarterly rotation. Environment variable encryption enforced.
- **Logging & monitoring:** Centralize auth/access logs; alert on suspicious access, MFA disable attempts, step-up auth failures, and decryption events.
- **Application security:** Input validation (Zod), rate limiting, Helmet headers, CSRF/XSS protection, and secure password policy (>=12 chars with complexity requirements, bcrypt with strong cost factor).

## 6) Physical Safeguards
- Rely on cloud provider data center controls (SOC 2/ISO 27001). Maintain facility access logs for any on-prem equipment.

## 7) Incident Response Plan (IRP)
- 24/7 on-call with defined severity levels, containment/eradication steps, evidence preservation, and post-incident reviews.
- Breach notification playbook for affected customers and regulators as required.

## 8) Testing and Verification
- Annual penetration test and vulnerability scan; remediate critical/high findings with tracking to closure.
- Tabletop exercises for IRP and ransomware scenarios at least annually.
- Change management with security sign-off for high-risk changes (auth, encryption, payments).

## 9) Documentation and Evidence
- Maintain records of: training completion, access reviews, vendor assessments, risk register updates, penetration tests, incident reports, and key rotations.

## 10) Landing Page Security Claims (truthful, evidence-backed)
- **Current claims:** RBAC, rate limiting, security headers (Helmet), HTTPS in transit, MFA capability, step-up re-authentication for sensitive operations.
- **Verified implementations:** 
  - AES-256-GCM field-level encryption for SSN/EIN/bank data (EncryptionService with unique IVs)
  - Step-up re-authentication with 5-minute tokens for write operations on NPI
  - Account lockout after 5 failed attempts
  - 12+ character password policy with complexity requirements
  - TOTP-based MFA with backup recovery codes
- **Claims gated by evidence:** SOC 2 Type II attestation, third-party penetration test results.