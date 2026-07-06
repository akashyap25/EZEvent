# EZEvent — Security Architecture

## 1. Security Layers Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                        │
│   Nginx SSL/TLS termination, HSTS, rate limiting                │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: Application Security                                    │
│   Helmet, CORS, CSRF, XSS sanitization, request validation     │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: Authentication                                          │
│   OTP (email+SMS), JWT rotation, account lockout                │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: Authorization                                           │
│   RBAC, org roles, event ownership, resource scoping            │
├─────────────────────────────────────────────────────────────────┤
│ Layer 5: Data Protection                                         │
│   Encryption at rest (Atlas), bcrypt passwords, TTL tokens      │
├─────────────────────────────────────────────────────────────────┤
│ Layer 6: Observability & Response                                │
│   Sentry, audit logs, rate limit alerts, account lockout        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Authentication Security

### OTP-Based Verification
- **Registration:** 6-digit OTP → email + phone (dual channel)
- **Password Reset:** 3-step OTP (send → verify → reset)
- **OTP Expiry:** 10 minutes
- **Rate Limit:** Max 3 OTP requests per email per hour
- **Brute Force:** After 5 wrong attempts → account locked for 30 minutes

### JWT Token Security
| Token | Expiry | Storage | Rotation |
|-------|--------|---------|----------|
| Access | 15 minutes | localStorage | On refresh |
| Refresh | 7 days | localStorage | On use |

- Tokens blacklisted in `Token` collection on logout
- All tokens invalidated on password change (`logoutAllDevices`)
- Frontend: deduplication flag prevents infinite refresh loops
- Invalid/expired tokens cleaned by `cleanupService` (scheduled)

### Password Security
- Hashing: bcrypt with cost factor 12
- Minimum: 8 characters (enforced by `validatePassword()`)
- History: Prevents reuse of last 5 passwords
- Account lockout: 5 failed attempts → 30-minute lock

## 3. API Security

### Rate Limiting
```
General:    100 requests / 15 minutes / IP
Auth:       5 requests / 15 minutes / IP+email
Password:   3 requests / hour / email
```
- **Store:** Redis in production (persists across restarts), in-memory in dev
- **Headers:** Standard `X-RateLimit-*` headers returned

### Input Validation
- `express-validator` on all route inputs
- Mongoose schema validation (types, enums, maxlength, required)
- `title: maxlength 200`, `description: maxlength 10000`
- Phone: regex validation `/^[\+]?[1-9][\d]{0,15}$/`
- MongoID: validated before database queries

### CORS Configuration
```javascript
// Development: any localhost port allowed
// Production: only FRONTEND_URL + ADMIN_URL
origin: (origin, callback) => {
  if (!origin) return callback(null, true); // Mobile/Postman
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (isDevelopment && origin.includes('localhost')) return callback(null, true);
  return callback(new Error('Not allowed by CORS'));
}
```

### Request Security
- Body size limit: 10MB (configurable)
- Request timeout: 30 seconds
- DoS protection: Memory monitoring, connection limits
- CSRF tokens on state-changing requests

## 4. Data Security

### At Rest
- MongoDB Atlas: Encrypted at rest (AES-256)
- Passwords: bcrypt hash (never stored plain)
- Reset tokens: SHA-256 hash stored, raw returned to user only once
- OTPs: Stored plain (short-lived, 10min TTL)

### In Transit
- TLS 1.2+ enforced (Nginx)
- `Strict-Transport-Security` header (HSTS)
- API keys never exposed to frontend (server-side only)

### PII Handling
- Sentry `beforeSend`: strips Authorization headers, cookies
- API responses: passwords excluded via Mongoose `select('-password')`
- Audit logs: store action + resource ID, not full PII
- User deletion: soft delete (GDPR compliance window)

## 5. Dependency Security

### npm Audit
- `npm audit --production` runs in CI Gate 2
- Fails pipeline on **high** or **critical** severity
- `overrides` in package.json for transitive vulnerability fixes
- Current status: **0 vulnerabilities**

### Supply Chain
- `package-lock.json` committed (deterministic installs)
- `npm ci` used in CI (not `npm install`)
- Renovate/Dependabot recommended for auto-updates

## 6. Observability & Incident Response

### Error Tracking (Sentry)
- All unhandled rejections captured
- All uncaught exceptions captured (with graceful shutdown)
- Request context: method, path, user ID, trace ID
- PII scrubbed before send
- Sample rate: 10% in production (100% in dev)

### Metrics (Custom)
- Request count by status code and method
- Latency: average, p95, p99, max
- Error count by type
- Memory usage (heap, RSS)
- Available at `GET /health`

### Audit Logging
- `AuditLog` model: who, what, when, where (IP), which resource
- Covers: login, password change, event create/delete, org changes

## 7. OWASP Top 10 Coverage

| # | Vulnerability | Mitigation | Automated Check |
|---|---------------|------------|:---:|
| A01 | Broken Access Control | RBAC + ownership checks + ProtectedRoute | ✅ |
| A02 | Cryptographic Failures | bcrypt-12, JWT rotation, no plaintext secrets | ✅ |
| A03 | Injection | Mongoose ODM, express-validator, XSS sanitization | ✅ |
| A04 | Insecure Design | Rate limiting, account lockout, OTP expiry | ✅ |
| A05 | Security Misconfiguration | Helmet, no X-Powered-By, CORS whitelist | ✅ |
| A06 | Vulnerable Components | npm audit in CI, 0 vulnerabilities | ✅ |
| A07 | Auth Failures | OTP + lockout + token rotation | ✅ |
| A08 | Data Integrity | Webhook signature verification (Stripe) | ⚠️ |
| A09 | Security Logging | Sentry + audit logs + request tracing | ✅ |
| A10 | SSRF | Nodemailer v9+ (patched), URL validation | ✅ |

## 8. CI/CD Security Gates

```
Gate 1: Secret scanning (no API keys in source)
Gate 2: npm audit (fails on high/critical CVE)
Gate 2: Dangerous pattern detection (eval, unvalidated queries)
Gate 4: 16 automated OWASP security checks
Gate 5: Environment-level approval required for production deploy
```
