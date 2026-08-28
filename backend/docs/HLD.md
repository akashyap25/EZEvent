# EZEvent — High Level Design (HLD)

## 1. System Overview

EZEvent is a full-stack event management platform that enables organizers to create, manage, and monetize events while providing attendees with discovery, registration, and real-time engagement tools.

**Scale Target:** 10K concurrent users, 100K registered users, 50K events

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│                                                                          │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│   │   React SPA      │  │   PWA (Mobile)   │  │   OAuth Providers    │ │
│   │   Vite + Tailwind│  │   Service Worker │  │   Google/GitHub      │ │
│   │   Lazy-loaded    │  │   Offline Cache  │  │                      │ │
│   └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘ │
└────────────┼─────────────────────┼──────────────────────────┼───────────┘
             │ HTTPS               │                          │
             ▼                     ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      GATEWAY / REVERSE PROXY (Nginx)                      │
│   ┌─────────────┬──────────────┬─────────────────┬───────────────────┐  │
│   │ Rate Limit  │  CORS        │  SSL/TLS        │  Load Balancing   │  │
│   │ (Redis)     │  Security    │  Termination    │  (Round Robin)    │  │
│   └─────────────┴──────────────┴─────────────────┴───────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                      APPLICATION LAYER (Node.js / Express)                │
│                                                                          │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────────────┐ │
│   │   Auth    │ │   Events  │ │  Orders   │ │   Real-time            │ │
│   │  OTP/JWT  │ │  CRUD     │ │  Stripe   │ │   Socket.IO + Redis    │ │
│   └───────────┘ └───────────┘ └───────────┘ └────────────────────────┘ │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────────────┐ │
│   │    AI     │ │  Search   │ │  Notify   │ │   Organizations        │ │
│   │  Gemini   │ │  Full-text│ │  Push/SMS │ │   Multi-tenant         │ │
│   └───────────┘ └───────────┘ └───────────┘ └────────────────────────┘ │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────────────┐ │
│   │ Job Queue │ │ Analytics │ │  Support  │ │   Observability        │ │
│   │ Async     │ │ Engagement│ │  Tickets  │ │   Sentry + Metrics     │ │
│   └───────────┘ └───────────┘ └───────────┘ └────────────────────────┘ │
└───────┬──────────────┬─────────────┬──────────────────┬─────────────────┘
        │              │             │                  │
        ▼              ▼             ▼                  ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌───────────────┐
│  MongoDB     │ │  Redis   │ │  Cloudinary  │ │  External     │
│  Atlas       │ │  Cache + │ │  CDN/Media   │ │  APIs         │
│  (21 models) │ │  Pub/Sub │ │              │ │  Stripe,Gemini│
│              │ │  Adapter │ │              │ │  Twilio,SMTP  │
└──────────────┘ └──────────┘ └──────────────┘ └───────────────┘
```

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite 7 + TailwindCSS | SPA with lazy-loaded routes |
| Backend | Express.js 4 + Node.js 20 | REST API + WebSocket server |
| Database | MongoDB Atlas (Mongoose 8) | Primary data store (21 collections) |
| Cache | Redis + node-cache fallback | Rate limiting, sessions, Socket.IO adapter |
| Real-time | Socket.IO 4 | Chat, notifications, live updates |
| Payments | Stripe | Checkout, webhooks, refunds |
| AI | Google Gemini | Description/task/tag generation |
| Email | Nodemailer (SMTP) | Transactional emails, OTP delivery |
| SMS | Twilio | OTP delivery, event reminders |
| Push | Web Push (VAPID) | Browser push notifications |
| Media | Cloudinary | Image upload, transformation, CDN |
| Observability | Sentry + custom metrics | Error tracking, APM, p95 latency |
| CI/CD | GitHub Actions | 5-gate pipeline, auto-deploy |
| Containers | Docker + Docker Compose | Dev/Prod environments |

## 4. Key Design Decisions

### 4.1 Authentication: OTP-based (not link-based)
- Registration: OTP sent to both email + phone
- Password reset: 3-step OTP flow (email/SMS → verify → new password)
- JWT with 15-min access + 7-day refresh tokens
- Rate limiting + account lockout after 5 failures

### 4.2 Multi-tenancy: Organization model
- Each org has roles: owner, admin, manager, member
- Plan-based limits (events, members, storage)
- Org-level branding, domain verification, Slack integration

### 4.3 Background Processing: In-process job queue
- Non-blocking email/SMS/notification delivery
- Retry with exponential backoff (3 attempts)
- Dead-letter queue for failed jobs
- Upgradeable to BullMQ when Redis is configured

### 4.4 Caching Strategy
- Redis for production (rate limits, sessions, Socket.IO pub/sub)
- node-cache fallback for development
- Stale-while-revalidate for event listings

### 4.5 Bundle Optimization
- Code-split: 36 lazy chunks, ~600KB initial load
- jsPDF/html2canvas loaded only on PDF download
- MUI loaded only on event edit page

## 5. Data Flow: Event Registration

```
User clicks "Get Tickets"
        │
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  POST /orders   │────▶│  Stripe Checkout│
│  CheckoutModal  │     │  Create order   │     │  Session        │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                              ┌────────────────────────────┘
                              ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Stripe Webhook │────▶│  Update Order   │────▶│  Job Queue      │
│  payment_intent │     │  status=complete│     │  • Send email   │
│  .succeeded     │     │  Generate QR    │     │  • Send SMS     │
└─────────────────┘     └─────────────────┘     │  • Push notif   │
                                                 └─────────────────┘
```

## 6. Deployment Architecture

**Current CI (`.github/workflows/ci.yml`), 3 jobs, runs on every PR into `dev`/`master`:**
```
┌──── GitHub ─────┐
│ Pull request    │──── backend-checks:  npm ci → lint → boot-check → Jest (13 files, 74 tests)
│ into dev/master │──── frontend-checks: npm ci → lint → build
└─────────────────┘──── all-checks-passed: gate job, required by branch protection
```
No automated deploy step exists yet — merging to `dev`/`master` only proves the code is correct, it does not ship it anywhere. A deploy job (Render/Vercel for the free-tier track, or AWS for the stretch track) is planned — see `INTERVIEW_READINESS_PLAN.md` Phase 4.

Separately, two standalone scripts (not part of the Jest/CI gate, run manually against a live server) provide additional verification:
- `tests/integration-runner.js` — 43 assertions across 12 groups against a running instance
- `tests/security-audit.js` — 18 OWASP Top 10 checks (A01, A02, A03, A05, A07, A09)
- `tests/load-test.js` — configurable concurrent-user load test; confirmed the rate limiter correctly returns 429s under sustained concurrent load rather than degrading

```
DEV:  docker-compose.dev.yml  → MongoDB + Redis + Backend + Frontend
PROD: docker-compose.prod.yml → Backend + Redis (MongoDB Atlas external)
```

## 7. Scalability Path

| Users | Architecture | Changes Needed |
|-------|-------------|----------------|
| 0-1K | Single server | Current setup |
| 1K-10K | Single server + Redis | Add REDIS_URL (Socket.IO adapter activates) |
| 10K-50K | 2-3 instances + LB | Add Nginx load balancer, Redis required |
| 50K-100K | Microservices | Split auth, events, notifications into separate services |
| 100K+ | Kubernetes | Container orchestration, horizontal pod autoscaling |

## 8. Security Layers

1. **Network:** Nginx + SSL/TLS + rate limiting (Redis-backed)
2. **Application:** Helmet, CSRF, XSS sanitization, input validation
3. **Authentication:** JWT + OTP + account lockout + token rotation
4. **Authorization:** RBAC (user/admin/moderator) + org roles + event ownership
5. **Data:** Passwords hashed (bcrypt 12), tokens hashed, PII scrubbed from logs
6. **Monitoring:** Sentry error tracking, request tracing, audit logs

## 9. Feature Tiering

For interview/portfolio purposes, features are split into flagship (deep, fully tested, primary demo material) and supporting (functional, not the focus). See `INTERVIEW_READINESS_PLAN.md` for the full rationale and hardening checklist.

| Tier | Features |
|------|----------|
| **Flagship (7)** | Event ticketing & payments (Stripe), real-time chat (Socket.IO + Redis adapter), multi-tenant Organizations + RBAC, search & analytics, QR check-in, SMS notifications (Twilio), push notifications (Web Push/VAPID) |
| **Supporting** | AI generation (Gemini), social share, calendar export, waitlist, support tickets, recurring events, event collaboration, event templates, engagement badges |

