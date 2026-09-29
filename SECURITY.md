# Security Policy & Architecture

## Reporting a Vulnerability

If you discover a security vulnerability within SocietyPulse, please report it privately via email to `security@society.org`. We prioritize security issues promptly.

---

## Security Model & Architecture

SocietyPulse is engineered with enterprise defense-in-depth principles to protect resident privacy and housing society operational continuity.

### 1. Role-Based Access Control (RBAC)
- **Admin**: Full system authority — manage settings, reset demo data, assign committee members, configure SLAs.
- **Member (Committee)**: Triage, assign, resolve, comment, and inspect society complaints.
- **Demo (`demo` role)**:
  - Enabled strictly when `DEMO_MODE=true` in server environment variables.
  - Can view tickets and update ticket status and notes.
  - **Hard server-side restrictions**: Cannot manage users, cannot modify system settings, cannot delete data, cannot export sensitive records, and cannot view unmasked resident phone numbers.
- **Resident / Public**: Can submit complaints, track existing issues with valid ID, and use the sandbox AI triage demo. Public endpoints **never** return internal committee notes or resident contact numbers.

### 2. Edge Middleware & Security Headers
All inbound requests pass through `middleware.ts`:
- Route protection for `/dashboard/*`, `/admin/*`, `/api/admin/*`, and `/api/import/*`.
- **Content-Security-Policy**: `frame-ancestors 'none';` (clickjacking defense).
- **Strict-Transport-Security**: `max-age=31536000; includeSubDomains` (enforced HTTPS).
- **X-Content-Type-Options**: `nosniff` (MIME-sniffing prevention).
- **X-Frame-Options**: `DENY`.
- **Referrer-Policy**: `strict-origin-when-cross-origin`.

### 3. NoSQL Injection & Input Sanitization
- All request payloads, queries, and route parameters are validated using **Zod schemas**.
- NoSQL operator injection prevention:
  - Rejection of keys and query strings containing MongoDB `$` operators or `.`.
  - Mongoose parameterized queries used across all data models.
- Maximum length limits enforced on user inputs (e.g. 300 chars on triage demo, 500 chars on complaint text, 500 messages cap on chat imports).

### 4. Mass Assignment & IDOR Defense
- `PATCH /api/complaints/[id]` explicitly whitelists updatable attributes (`status`, `assignedTo`, `category`, `urgency`, `urgencyScore`, `internalNote`, `timelineNote`).
- Internal IDs and sensitive administrative fields (`_id`, `passwordHash`, `isDemo`) cannot be mass-assigned.

### 5. Secrets Management
- `.env*` files are strictly excluded via `.gitignore`.
- Only sanitized `.env.example` is committed.
- Environment variables are verified at boot time using `lib/env.ts` (Zod validation).
- Stack traces, raw database error objects, and API keys are caught and logged server-side only; never leaked to the client.

### 6. Rate Limiting & Denial of Service (DoS) Defense
- IP-based rate limiting on all public endpoints:
  - `/api/public/triage-demo`: 5 req/min.
  - `/api/complaints` (Submission): 15 req/10 min with honeypot spam traps and idempotency key deduplication.
  - `/api/track`: 30 req/min.
  - `/api/auth/login`: 10 req/min.
  - `/api/auth/demo-login`: 15 req/min.

### 7. Media & Attachment Security
- Uploaded images are validated via file magic bytes to prevent executable polyglots.
- Server-side size limit of 1 MB enforced.
- Files stored as raw binary buffers in an isolated MongoDB `Attachment` collection, served through access-controlled endpoints with proper `Content-Type` headers and EXIF metadata stripped.
