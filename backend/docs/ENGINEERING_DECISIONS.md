# EZEvent — Engineering Decisions

Reference doc for discussing this project's architecture in interviews. Each decision states the choice, the alternative considered, why it was made, and points to the actual code that backs it up — not aspirational description.

---

## 1. MongoDB (Mongoose) over a relational database

**Choice:** MongoDB Atlas with Mongoose ODM, 21 collections.

**Alternative considered:** PostgreSQL with a relational schema.

**Why:** Event data is naturally document-shaped and variably structured per event — `ticketTiers[]`, `customFields[]`, `polls[]`, `microsite{}` all live as embedded arrays/objects on a single `Event` document (see `backend/models/event.js`). Modeling this relationally would require several join tables (ticket_tiers, custom_fields, polls) for data that's always read and written together with its parent event — adding join overhead for no real transactional benefit, since these sub-documents don't need independent querying at scale. The trade-off accepted: weaker cross-collection referential integrity (enforced in application code via Mongoose refs + population, not DB-level foreign keys), which is acceptable because the write patterns are mostly single-document (create/update one event, one order) rather than multi-table transactions.

**Where this shows up:** `backend/models/event.js`, `backend/models/organization.js` (embedded `settings{}`, `usage{}`).

---

## 2. JWT (access + refresh) over server-side sessions

**Choice:** Stateless JWT access tokens (15 min) + refresh tokens (7 days), tracked in a `Token` collection for revocation.

**Alternative considered:** Traditional server-side sessions (cookie + session store).

**Why:** Stateless tokens let any backend instance authenticate a request without a shared session store lookup on every single request — only refresh/logout/blacklist operations touch the `Token` collection. This matters for the horizontal-scaling story: adding backend instances behind a load balancer doesn't require sticky sessions or a synchronized session store for the hot path (auth check on every request). The trade-off: token revocation isn't instant by default (a stolen access token is valid until it expires), mitigated by the short 15-minute access-token lifetime plus explicit blacklisting in the `Token` model for logout/refresh rotation.

**Where this shows up:** `backend/middlewares/secureAuth.js` (`generateTokenPair`, token verification), `backend/models/Token.js`.

---

## 3. OTP-based verification over magic-link email verification

**Choice:** 6-digit OTP codes for registration verification and password reset, sent via email (and optionally SMS).

**Alternative considered:** Clickable email verification links.

**Why:** OTP codes work the same way regardless of which device/browser the user opens the email on (no "I verified on my phone but I'm registering on my laptop" broken-session problem that link-based flows have when the session that initiated registration differs from the device that clicks the link). It also naturally extends to SMS delivery as a fallback channel without any additional design — the same code, same verification endpoint, just a different delivery service.

**Where this shows up:** `backend/routes/userRoutes.js` (`/verify-account-otp`, `/verify-reset-otp`), `backend/models/PasswordReset.js`, `backend/models/Token.js` (OTP storage with TTL expiry).

---

## 4. Socket.IO + Redis adapter over plain WebSockets or polling

**Choice:** Socket.IO for real-time chat/notifications, with a Redis pub/sub adapter that activates automatically when `REDIS_URL` is configured.

**Alternative considered:** Raw WebSockets (`ws` library) with manual reconnect/room logic, or HTTP polling.

**Why:** Socket.IO provides room management, automatic reconnection, and transport fallback (falls back to long-polling if WebSocket upgrade fails) out of the box, saving significant custom protocol code. The Redis adapter is the specific piece that makes this horizontally scalable: without it, a chat message sent to a user connected to backend instance A would never reach a recipient connected to instance B. With the adapter, Socket.IO publishes events to Redis, and every instance subscribed to that channel delivers to its own locally-connected sockets — this is what makes "add more backend instances" actually work for real-time features, not just for stateless HTTP routes.

**Where this shows up:** `backend/server.js` (Redis adapter setup, gated behind `REDIS_URL` presence), `backend/socket/chatSocket.js`.

---

## 5. In-process job queue (upgradeable to BullMQ) over always-on external queue

**Choice:** A lightweight in-process job queue with retry (exponential backoff, 3 attempts) and a dead-letter queue for permanently failed jobs, used for email/SMS/push delivery so these don't block the HTTP response.

**Alternative considered:** Always-require a dedicated queue (BullMQ + Redis) from day one.

**Why:** At small scale, an external queue is operational overhead (another service to run, monitor, and keep available) for a workload that's genuinely light. The in-process queue keeps the "send registration email" work off the critical path of the HTTP response (the client gets `201 Created` immediately, email delivery happens after) without adding an infrastructure dependency. Because Redis is already optional infrastructure in this system (see cache/rate-limit fallback below), the design explicitly notes this is upgradeable to BullMQ once Redis is a hard requirement — the retry/backoff/dead-letter semantics were designed to map onto that migration path.

**Where this shows up:** `backend/services/jobQueue.js`.

---

## 6. Redis as optional infrastructure, not a hard dependency

**Choice:** Redis is used for rate limiting, caching, and the Socket.IO adapter when `REDIS_URL` is set — but the app falls back to in-memory equivalents (`node-cache`, in-memory rate-limit store, single-instance Socket.IO) when it isn't.

**Alternative considered:** Require Redis unconditionally in all environments.

**Why:** This directly supports the free-tier-first deployment strategy (Track A: Render + Vercel + Atlas, no Redis) while still having a clear, already-built upgrade path (Track B/scale-up: add Upstash Redis, multi-instance Socket.IO immediately starts working via the adapter with no code changes). The "it just works either way" fallback pattern is also what made local development possible throughout this project without running a Redis container every time.

**Where this shows up:** `backend/middlewares/rateLimiting.js`, `backend/services/cacheService.js`, `backend/server.js`.

---

## 7. Modular app bootstrap: `app.js` / `server.js` / `routes/index.js`

**Choice:** `app.js` builds a pure Express app (middleware, route mounting, error handlers) and exports it with no side effects. `server.js` is the only file that calls `.listen()`, sets up Socket.IO, the Redis adapter, and graceful shutdown. `routes/index.js` centralizes all ~30 route-mount calls in one `mountRoutes(app)` function.

**Alternative considered:** The original single `app.js` that both configured Express and called `server.listen()` directly.

**Why:** Separating "build the app" from "run the app" is what makes the app importable and testable without side effects — Jest's Supertest-based tests `require('../app')` and never bind a real port, and the CI boot-check (`node -e "require('./app')"`) can verify the whole middleware/route chain wires up correctly in under a second without needing a graceful-shutdown handler to also fire. It also made the security fix in this project (removing an unauthenticated user-creation route) safe to verify in isolation, since `app.js` has no hidden coupling to process lifecycle.

**Where this shows up:** `backend/app.js`, `backend/server.js`, `backend/routes/index.js`.

---

## 8. Stated scaling assumptions

Design target: 10K concurrent users, 100K registered users, 50K events (see `HLD.md` §7 for the full scalability path table, 0-1K single server → 100K+ Kubernetes). The concrete decisions above (stateless JWT, optional Redis, Socket.IO adapter, in-process-to-BullMQ-upgradeable job queue) are what make the 1K→50K portion of that path achievable by adding instances/Redis rather than re-architecting.
