# EZEvent — Interview Preparation Guide

## Quick Pitch (30 seconds)
"EZEvent is a full-stack event management platform I built from scratch. It handles event creation, Stripe payments, real-time chat via Socket.IO, AI-powered content generation with Google Gemini, multi-tenant organizations, and OTP-based authentication. The backend has 283 API endpoints, 21 data models, and a 5-gate CI/CD pipeline. The frontend uses React 18 with code-splitting that reduced initial load from 1MB to 600KB."

---

## Architecture Questions

### Q: Walk me through the system architecture.
**A:** Three-tier architecture:
- **Frontend:** React SPA with Vite, TailwindCSS, lazy-loaded routes (36 chunks). PWA with service worker for offline ticket access.
- **Backend:** Express.js with 31 route files, 21 services. Middleware stack includes Sentry observability, rate limiting (Redis-backed), CORS, CSRF protection.
- **Data:** MongoDB Atlas (21 collections with compound indexes), Redis for caching/pub-sub/rate-limits, Cloudinary for media CDN.
- **Real-time:** Socket.IO with Redis adapter for multi-instance scaling.

### Q: How do you handle authentication?
**A:** OTP-based dual-channel verification:
1. **Registration:** User signs up → 6-digit OTP sent to both email (Nodemailer) and phone (Twilio) via background job queue → user verifies on `/verify-account` page → account activated.
2. **Login:** Email + password → JWT access token (15min) + refresh token (7d) stored in localStorage.
3. **Token refresh:** Axios interceptor catches 401 → calls refresh endpoint (with deduplication flag to prevent infinite loops) → retries original request.
4. **Password reset:** 3-step OTP flow with 10-minute expiry, rate-limited to 3 attempts.
5. **Security:** bcrypt-12 hashing, account lockout after 5 failures, all sessions killed on password change.

### Q: How does the payment system work?
**A:** Stripe Checkout Sessions:
1. User clicks "Get Tickets" → frontend shows CheckoutModal
2. `POST /api/orders` creates a pending order + Stripe checkout session
3. User pays on Stripe's hosted page
4. Stripe sends webhook (`checkout.session.completed`) to `/api/orders/webhook`
5. Webhook handler: updates order status, generates QR check-in token, queues confirmation email/SMS via job queue
6. Supports refunds, multi-tier tickets (General/VIP/Speaker), free events

### Q: Explain your caching strategy.
**A:** Dual-layer with graceful degradation:
- **Redis (production):** Rate limiting store, Socket.IO pub/sub adapter, session store, API response cache
- **node-cache (development):** In-memory fallback when Redis not configured
- **Service worker (frontend):** Network-first for tickets (offline venue access), stale-while-revalidate for event listings, cache-first for static assets
- **Suppressed warnings:** When Redis isn't configured, warnings are debug-level only (not spamming logs)

### Q: How do you handle background jobs?
**A:** Custom in-process job queue (`services/jobQueue.js`):
- 5 concurrent workers
- 3 retries with exponential backoff (2s → 4s → 8s)
- Dead-letter queue for permanently failed jobs
- Priority-based: email (5) > SMS (3) > push (2) > notification (1)
- Registration doesn't block on email delivery — OTP is queued async
- Upgradeable to BullMQ (just swap the implementation when Redis is available)

### Q: How does Socket.IO scale across multiple servers?
**A:** Redis adapter pattern:
- When `REDIS_URL` is set, Socket.IO automatically attaches `@socket.io/redis-adapter`
- All server instances subscribe to Redis pub/sub channels
- Events emitted on one instance are broadcast to all clients across all instances
- Fallback: in-memory adapter (single instance) when Redis not configured

---

## Database Questions

### Q: Describe your data model design.
**A:** 21 Mongoose models with:
- **Referential integrity:** All ObjectId refs have proper `ref` strings for `.populate()`
- **Indexes:** Compound indexes on frequent query patterns (e.g., `{organizer: 1, createdAt: -1}`)
- **Uniqueness:** Email, username, slug, ticketToken — all with unique constraints
- **Soft delete:** Organizations, tickets have `isDeleted + deletedAt`
- **Atomic operations:** Analytics uses `$inc` with `findOneAndUpdate` to prevent race conditions
- **TTL indexes:** Tokens and password resets auto-expire via MongoDB TTL

### Q: How did you handle the N+1 query problem?
**A:** 
- `.populate()` for related data (category, organizer) in single queries
- Compound indexes on `{event: 1, status: 1}` for filtered lookups
- `Promise.all()` for parallel independent queries (e.g., stats dashboard)
- Event analytics stored in a separate collection (one per event, `unique: true`) rather than embedded

### Q: What about database migrations?
**A:** `migrate-mongo` configured with:
- `npm run migrate:up/down/status/create`
- Migration files in `/migrations/` with timestamps
- Changelog collection tracks which migrations have run
- Initial migration establishes baseline indexes

---

## Frontend Questions

### Q: How did you optimize frontend performance?
**A:**
1. **Code splitting:** React.lazy() for all route-level components → 36 separate chunks
2. **Dynamic imports:** jsPDF (372KB) + html2canvas (194KB) only loaded when user clicks "Download PDF"
3. **MUI isolation:** MUI vendor chunk (222KB) only loads on the UpdateEvent page
4. **Chunk consolidation:** Merged small vendors (sweetalert + socket + stripe → single `vendor-ui` chunk) to reduce HTTP requests
5. **Result:** Initial load dropped from 1087KB to 600KB (-45%)

### Q: How do you handle state management?
**A:** Context API pattern (no Redux):
- `AuthContext` — user, tokens, login/register/logout, auto-refresh
- `ThemeContext` — dark/light mode toggle with localStorage persistence
- `ToastContext` — global notification system
- `I18nContext` — internationalization (language switching)
- Component-level state for form data, loading states

### Q: Describe your error handling strategy.
**A:**
- **Frontend:** ErrorBoundary at app level catches render crashes. apiService centralizes error extraction (`{ message, status }` format). Components show error states (not blank pages).
- **Backend:** Global `errorHandler` middleware formats all errors as `{ success: false, message }`. Sentry captures unhandled rejections + uncaught exceptions. Request timeout middleware (30s) prevents hung connections.
- **User-facing:** Settings page shows Swal alerts on save success/failure. Support page shows inline error messages. Protected routes redirect to sign-in (not blank screen).

---

## DevOps & Testing Questions

### Q: Describe your CI/CD pipeline.
**A:** 5-gate GitHub Actions pipeline:
1. **Gate 1 (Structure):** Validates all JSON files, checks required files exist, scans for leaked secrets
2. **Gate 2 (Backend):** Syntax-checks all 122+ .js files, runs `npm audit --production`, checks for dangerous patterns (eval, injection)
3. **Gate 3 (Frontend):** Production build must succeed, validates output, checks bundle size limits
4. **Gate 4 (Tests):** Spins up MongoDB service container, seeds data, runs 43 integration tests + 16 OWASP security checks
5. **Gate 5 (Deploy):** `dev` branch → DEV environment, `master` → PROD (requires approval)

Each gate blocks the next. Concurrent runs for same branch are auto-cancelled.

### Q: What testing do you have?
**A:**
- **Integration tests (43):** Covers all 12 endpoint groups (auth, events, bookmarks, tasks, orgs, support, search, notifications, waitlist, calendar, billing, security edge cases)
- **Security audit (16 checks):** OWASP A01 (access control), A02 (crypto), A03 (injection), A05 (misconfiguration), A07 (auth failures), A09 (logging)
- **Load testing:** 50 concurrent virtual users for 30 seconds. Pass criteria: error rate <1%, p95 <2s, RPS >10
- **Command:** `npm run test:integration` / `node tests/security-audit.js` / `npm run loadtest`

### Q: How do you handle environments?
**A:** Three-tier:
- **Development:** `.env.development` + local MongoDB + no Redis (graceful fallback)
- **Test:** `.env.test` + MongoDB service container in CI + in-memory everything
- **Production:** `.env.production` + MongoDB Atlas + Redis Cloud + Sentry + Stripe live keys
- `app.js` auto-loads the correct env file based on `NODE_ENV`

---

## Security Questions

### Q: How do you protect against common vulnerabilities?
**A:**
| Threat | Mitigation |
|--------|-----------|
| XSS | Helmet headers + input sanitization middleware |
| CSRF | CSRF token middleware on state-changing requests |
| SQL/NoSQL Injection | Mongoose schema validation + express-validator |
| Brute force | Rate limiting (Redis-backed) + account lockout |
| Token theft | 15-min expiry + refresh rotation + logout-all-devices |
| SSRF | Nodemailer upgraded to v9+ (patched CVE) |
| Dependency vulnerabilities | `npm audit` in CI (fails on high/critical) + overrides for transitive deps |

### Q: How do you handle sensitive data?
**A:**
- Passwords: bcrypt (cost 12), never returned in API responses
- Tokens: Hashed before storage, TTL auto-expiry
- PII: Stripped from Sentry events (auth headers, cookies removed in `beforeSend`)
- Secrets: Never in code — env vars only, `.gitignore` blocks all `.env.*` files
- Audit: `AuditLog` model tracks who did what

---

## Scalability & Design Pattern Questions

### Q: What design patterns did you use?
**A:**
- **MVC:** Controllers → Services → Models
- **Middleware chain:** Express middleware for cross-cutting concerns
- **Observer:** Socket.IO events for real-time updates
- **Strategy:** Caching strategies per resource type (network-first, stale-while-revalidate, cache-first)
- **Queue:** Job queue with priority and retry (producer/consumer pattern)
- **Adapter:** Socket.IO Redis adapter for horizontal scaling
- **Singleton:** Service instances (EmailService, CacheService)

### Q: What would you do differently if starting over?
**A:**
1. **TypeScript** from day one — better refactoring confidence at scale
2. **BullMQ from start** instead of in-process queue — proper job persistence
3. **tRPC or GraphQL** — better type safety between frontend/backend
4. **Zustand over Context** — less re-render overhead for global state
5. **Remove MUI** entirely — it adds 222KB for one page (EventForm)

---

## Key Metrics to Quote

| Metric | Value |
|--------|-------|
| Backend files | 122+ .js files |
| API endpoints | 283+ |
| Data models | 21 collections |
| Services | 21 |
| Route files | 31 |
| Test assertions | 43 integration + 16 security + load test |
| Initial bundle | 600KB (was 1087KB, -45%) |
| EventDetails chunk | 44KB (was 605KB, -93%) |
| npm vulnerabilities | 0 (all patched) |
| CI/CD gates | 5 sequential |
| Auth flow | OTP-based (email + SMS) |
