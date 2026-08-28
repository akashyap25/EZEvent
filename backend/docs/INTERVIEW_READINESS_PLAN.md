# EZEvent — Interview-Readiness Roadmap

**Goal:** Turn EZEvent into a full-proof, industrial-grade, solo-built portfolio project for an SE1 → SDE role transition. Live, deployed, documented, and defensible in a system-design conversation — not just a big feature list.

**Core reframe:** the value here isn't the event-management premise — it's the engineering decisions behind it. Interviewers care about *why* you chose X over Y, how you handled scaling/consistency/security trade-offs, and whether the system actually works end-to-end in production, not how many features exist.

---

## 1. Scope: 7 Flagship Features

Everything else in the app stays functional but is explicitly de-prioritized for polish/testing depth.

| # | Flagship Feature | What it showcases |
|---|---|---|
| 1 | **Event ticketing & payments** (Stripe checkout + webhooks) | Transactional correctness, webhook idempotency, data consistency |
| 2 | **Real-time chat & notifications** (Socket.IO + Redis adapter) | Real-time systems design, horizontal scaling story |
| 3 | **Multi-tenant Organizations + RBAC** | Access control, multi-tenancy data modeling |
| 4 | **Search & Analytics** (full-text search + aggregation dashboards) | Query design, indexing, performance |
| 5 | **QR check-in** | Closes the full loop: discover → pay → ticket → attend → check-in |
| 6 | **SMS notifications** (Twilio) | Third-party API integration, delivery reliability, fallback handling |
| 7 | **Push notifications** (Web Push/VAPID) | Browser push protocol, subscription lifecycle management |

**De-prioritized (kept working, not a focus):** AI generation, social share, calendar export, waitlist, support tickets, recurring events, event collaboration, event templates, engagement badges.

---

## 2. Deployment Strategy

- **Budget:** free-tier first, ceiling of ~$5/mo. AWS credits explored as a stretch upgrade.
- **Track A (default, do this first):**
  - Frontend → Vercel (free tier)
  - Backend → Render (free tier web service)
  - Database → MongoDB Atlas (already in use, free M0 tier)
  - Redis → Upstash (free tier)
- **Track B (optional stretch, only if AWS credits secured):**
  - Migrate backend to AWS (ECS Fargate or EC2 + ALB) per the existing `backend/docs/AWS_HOSTING_PLAN.md`
  - Add Terraform for infra-as-code
  - Keep Track A documented as the "started here, migrated for X reason" story — a good interview anecdote in itself

---

## 3. Phases

### Phase 1 — Narrative & Scope Lock (Week 1) ✅ Complete
- [x] Write `backend/docs/ENGINEERING_DECISIONS.md`: why MongoDB over SQL, why Socket.IO+Redis adapter over polling, why JWT over sessions, why OTP-based auth, stated scaling assumptions (10K concurrent target already in HLD.md). This becomes the interview talking-points reference.
- [x] Freeze the 7 flagship features; label everything else as "supporting feature" in docs. (`HLD.md` §9 Feature Tiering)
- [x] Reconcile `backend/docs/HLD.md` and `backend/docs/LLD.md` against the current codebase — fixed stale frontend directory listings (deleted AI/Navbar files), corrected test counts (13 Jest files, 18 security checks, not 12/16), corrected the fictional "5-gate" CI/CD description to match the actual 3-job pipeline, and documented the app.js/server.js/routes split.

### Phase 2 — Flagship Feature Hardening (Weeks 2-3)
- [ ] For each of the 7 flagship features: expand automated tests, fix rough edges, manually verify the full happy path + 2-3 edge cases end-to-end.
- [ ] Chat: prove the Redis pub/sub adapter actually enables multi-instance scaling (spin up 2 backend instances, show a message routed cross-instance).
- [ ] Payments: verify Stripe webhook idempotency in `orderController.js`'s `handleStripeWebhook` — duplicate webhook delivery should not double-process an order.
- [ ] SMS: verify Twilio delivery failure handling (invalid number, carrier rejection) degrades gracefully without crashing the request that triggered it.
- [ ] Push: verify subscription expiry/unsubscribe is handled (stale VAPID subscriptions shouldn't cause repeated failures).

### Phase 3 — Testing & Quality Gates (Weeks 3-4)
- [ ] Add a frontend test suite (Vitest + React Testing Library) — currently zero frontend test coverage. Cover at least the 7 flagship flows' critical components.
- [ ] Add dependency vulnerability scanning to CI (`npm audit` or Dependabot/Snyk free tier).
- [ ] Add a backend coverage threshold gate (`jest --coverage`, minimum % focused on flagship modules) to CI.

### Phase 4 — Deployment & DevOps (Weeks 4-5)
- [ ] Provision Upstash Redis, Render backend service, Vercel frontend project.
- [ ] Extend `.github/workflows/ci.yml` with a `deploy` job gated behind `all-checks-passed`: auto-deploy `dev` → staging, `master` → production.
- [ ] Configure Sentry with a real production DSN (already integrated in code) + a free uptime monitor (UptimeRobot) against `/health`.
- [ ] Fill in real values in `DEPLOYMENT_GUIDE.md` (currently has placeholders).

### Phase 5 — AWS Stretch Goal (Weeks 6-8, optional)
- [ ] Follow `backend/docs/AWS_HOSTING_PLAN.md` to move the backend to ECS Fargate or EC2 behind an ALB.
- [ ] Add Terraform for the AWS resources.
- [ ] Document the Track A → Track B migration story.

### Phase 6 — Interview Packaging (Week 8, final)
- [ ] Rewrite root `README.md`: problem statement, rendered architecture diagrams (Mermaid/Excalidraw, not just ASCII), live demo link, screenshots/GIF of the 7 flagship flows, tech stack table, link to `ENGINEERING_DECISIONS.md`.
- [ ] Prepare a 3-5 minute demo script covering the 7 flagship flows in order.
- [ ] Prepare a Q&A doc anticipating system-design questions (scaling chat, payment consistency, multi-tenancy isolation, what you'd change at 10x scale).
- [ ] Draft 3-4 resume bullet points derived from what's actually built.

---

## 4. Relevant Files

- `backend/docs/HLD.md`, `backend/docs/LLD.md` — reconcile with current code (Phase 1)
- `backend/docs/WHATS_MISSING.md` — existing gap-tracker, keep using as checklist source of truth
- `backend/docs/AWS_HOSTING_PLAN.md` — execute in Phase 5
- `.github/workflows/ci.yml` — extend with deploy job (Phase 4)
- `DEPLOYMENT_GUIDE.md` — fill in real values once deployed
- Root `README.md` — final interview-facing rewrite (Phase 6)
- New: `frontend/vitest.config.js` + test files (Phase 3)
- New: `backend/docs/ENGINEERING_DECISIONS.md` (Phase 1)

---

## 5. Verification Criteria

1. Each flagship feature has passing automated tests demonstrating the specific hard problem it showcases (e.g., a test proving webhook idempotency, not just "order created").
2. CI pipeline auto-deploys on merge, and the live URL is reachable and functional after every merge to `dev`/`master`.
3. A cold reviewer (friend/mentor) can open the README, click the live link, and understand the architecture in under 5 minutes without asking you anything.

---

## 6. Key Decisions

- Narrowed to 7 flagship features (added SMS and Push notifications to the original 5); the rest stay functional but de-prioritized for polish/testing depth.
- Deployment: free-tier PaaS first (Vercel/Render/Atlas/Upstash); AWS migration is an optional Phase 5 stretch goal contingent on securing credits.
- Frontend testing is a new addition (currently zero coverage) — treated as a real gap to close, not optional.
