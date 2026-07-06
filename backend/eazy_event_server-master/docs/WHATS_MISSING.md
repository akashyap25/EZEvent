# EZEvent — What's Missing & Post-Deployment Checklist

---

## ⚡ QUICK START: Follow This Order

**To get the app fully working end-to-end, follow these steps IN ORDER:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: MongoDB Atlas                                    [2 min]       │
│  → Part 3: Database Setup                                               │
│  → Without this: NOTHING works                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Email (Gmail App Password or Mailtrap)           [2 min]       │
│  → Part 3: Email Setup                                                  │
│  → Without this: OTP delivery fails, registration incomplete            │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Stripe (Test Mode keys)                          [2 min]       │
│  → Part 3: Stripe Setup                                                 │
│  → Without this: "Get Tickets" button errors                            │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Google Gemini AI key                             [1 min]       │
│  → Part 3: AI Setup                                                     │
│  → Without this: AI features show errors                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ APP IS FULLY FUNCTIONAL FOR DEMO (Steps 1-4 done)                   │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 5: Redis (optional)                                 [3 min]       │
│  → Part 3: Redis Setup                                                  │
│  → Adds: persistent rate limiting, multi-instance Socket.IO, caching    │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 6: Twilio SMS (optional)                            [5 min]       │
│  → Part 3: Twilio Setup                                                 │
│  → Adds: SMS OTP delivery (email OTP works alone)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 7: Sentry (optional)                                [2 min]       │
│  → Set SENTRY_DSN from sentry.io                                        │
│  → Adds: production error monitoring + alerting                         │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 8: Cloudinary (optional)                            [2 min]       │
│  → Set CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET                     │
│  → Adds: image upload for event banners                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ APP IS PRODUCTION READY (Steps 1-8 done)                            │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 9: Deploy                                                         │
│  → Part 5: Complete End-to-End Setup                                    │
│  → Or see: DEPLOYMENT_GUIDE.md                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 10: Post-Deployment                                               │
│  → Part 4: Post-Deployment Checklist                                    │
│  → Day 1, Week 1, Monthly tasks                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Total time from zero to fully working: ~20 minutes**

**Which docs to read:**
- Setting up services → THIS FILE (Part 3)
- Deploying to server → `DEPLOYMENT_GUIDE.md`
- Understanding architecture → `docs/HLD.md`
- Interview preparation → `docs/INTERVIEW_PREP.md`

---

## Part 1: Features That Exist But Don't Work Yet (Need Configuration)

These features are **coded and integrated** but require external service setup to function:

---

### 🔴 Critical (App breaks without these)

| Feature | Status | What's Missing | How to Fix |
|---------|--------|---------------|------------|
| **Email delivery** (OTP, verification, password reset) | Code complete, SMTP fails | No valid SMTP credentials configured | Set `SMTP_USER` + `SMTP_PASS` in `.env`. Use Gmail App Password or Mailtrap (dev) or SendGrid (prod). See [Email Setup](#email-setup). |
| **MongoDB connection** | Works (Atlas free tier) | Currently uses shared test cluster | Create dedicated clusters for dev/prod. See [Database Setup](#database-setup). |

---

### 🟡 Important (Features degraded without these)

| Feature | Status | What's Missing | How to Fix |
|---------|--------|---------------|------------|
| **Redis** (caching, rate limiting, Socket.IO scaling) | Falls back to in-memory | No Redis server configured | Set `REDIS_URL=redis://host:6379`. Free: Redis Cloud (30MB free). See [Redis Setup](#redis-setup). |
| **Stripe payments** | Code complete, webhooks wired | No Stripe API keys | Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`. See [Stripe Setup](#stripe-setup). |
| **SMS (Twilio)** | Code complete, service skips | No Twilio credentials | Set `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`. See [Twilio Setup](#twilio-setup). |
| **Google Gemini AI** | Routes exist, returns error | No API key | Set `GOOGLE_GEMINI_API_KEY`. Free: 15 req/min on AI Studio. See [AI Setup](#ai-setup). |
| **Push notifications** | Service exists, skips silently | No VAPID keys | Run `npx web-push generate-vapid-keys` → set `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`. |
| **Image uploads (Cloudinary)** | Route exists | No Cloudinary credentials | Set `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`. |
| **Sentry error tracking** | Code integrated, skips | No DSN configured | Set `SENTRY_DSN` from sentry.io project. |
| **OAuth (Google/GitHub login)** | Passport strategies configured | No OAuth client IDs | Create OAuth apps on Google Cloud Console + GitHub Developer Settings. |

---

### 🟢 Optional (Nice-to-have, not blocking)

| Feature | Status | What's Missing |
|---------|--------|---------------|
| Custom domain verification | Route exists | DNS verification logic needs actual domain |
| Slack integration | Webhook URL field exists | Needs Slack app created + webhook URL |
| Social media sharing | Share URLs generated | No actual social app IDs for rich previews |
| Recurring events | Service exists | Needs cron job scheduler (e.g., node-cron) in production |

---

## Part 2: Code That Needs Completion

| Item | File | What's Incomplete | Priority |
|------|------|-------------------|----------|
| **EventForm.jsx** still uses MUI | `Components/Events/EventForm.jsx` | Should be rewritten with custom UI components to eliminate 222KB MUI chunk | Medium |
| **Checkout.jsx** (dead code) | `Components/General/Checkout.jsx` | Old checkout component, replaced by CheckoutButton. Should be deleted. | Low |
| **Navbar.jsx** (dead code) | `Components/Navbar/Navbar.jsx` | Old navbar, replaced by Header.jsx. Should be deleted. | Low |
| **EventCard "like" button** | `Components/Events/EventCard.jsx` | Toggles local state only — doesn't persist to API. Should call bookmark endpoint. | Medium |
| **Admin dashboard** | `Pages/AdminDashboard.jsx` | Basic stats only. Missing: user management, event moderation, reports. | Low |
| **Internationalization** | `contexts/I18nContext.jsx` | Context exists but no actual translations loaded. English-only. | Low |

---

## Part 3: Setup Guides

### <a name="email-setup"></a>Email Setup

**Development (Mailtrap — catches all emails):**
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<get from mailtrap.io inbox>
SMTP_PASS=<get from mailtrap.io inbox>
SMTP_FROM=dev@ezevent.com
```
1. Go to [mailtrap.io](https://mailtrap.io) → Sign up free
2. Create inbox → Get SMTP credentials
3. All emails are caught (never actually delivered)

**Production (Gmail with App Password):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<16-char app password>
SMTP_FROM=EZEvent <your-email@gmail.com>
```
1. Enable 2FA on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate app password for "Mail" → "Other (EZEvent)"
4. Limit: 500 emails/day

**Production (SendGrid — recommended for scale):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key_here
SMTP_FROM=noreply@yourdomain.com
```

### <a name="database-setup"></a>Database Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create cluster:
   - **Dev:** M0 (free), name: `ezevent-dev`
   - **Prod:** M10+ (dedicated), name: `ezevent-prod`
3. Database Access → Create user (separate for dev/prod)
4. Network Access → Add `0.0.0.0/0` (or specific server IPs for prod)
5. Connect → Get connection string:
   ```
   mongodb+srv://USER:PASS@cluster.mongodb.net/eazy_event_dev
   mongodb+srv://USER:PASS@cluster.mongodb.net/eazy_event_prod
   ```
6. After first deployment, run: `npm run seed` (dev only)
7. Run migrations: `npm run migrate:up`

### <a name="redis-setup"></a>Redis Setup

**Option A: Redis Cloud (free 30MB):**
1. Go to [redis.com/try-free](https://redis.com/try-free/)
2. Create database → Get connection URL
3. Set: `REDIS_URL=redis://default:PASSWORD@HOST:PORT`

**Option B: Local Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
# REDIS_URL=redis://localhost:6379
```

**What Redis enables:**
- Rate limiting persists across server restarts
- Socket.IO works across multiple server instances
- API response caching (faster reads)
- Session store (shared across instances)

### <a name="stripe-setup"></a>Stripe Setup

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → Sign up
2. **Test mode** (for development):
   - Developers → API Keys → Copy `pk_test_...` and `sk_test_...`
3. **Webhooks:**
   - Developers → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/orders/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`
   - Copy signing secret (`whsec_...`)
4. **Local testing:**
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:5000/api/orders/webhook
   ```
5. Set in `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
6. Frontend `.env`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### <a name="twilio-setup"></a>Twilio Setup

1. Go to [twilio.com](https://www.twilio.com) → Sign up (free trial: $15 credit)
2. Console → Get Account SID + Auth Token
3. Buy a phone number ($1/month) or use trial number
4. Set:
   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   ```
5. **Trial limitations:** Can only send to verified numbers. Upgrade for production.

### <a name="ai-setup"></a>AI (Google Gemini) Setup

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click "Create API Key" → Select project
3. Copy key → Set: `GOOGLE_GEMINI_API_KEY=AI...`
4. **Free tier:** 15 requests/minute, 1500/day
5. **What it powers:**
   - AI event description generator
   - AI task suggestions
   - AI tag generator
   - Event chatbot

---

## Part 4: Post-Deployment (PD) Checklist

### Immediate (Day 1 after deploy)

- [ ] Verify `/health` endpoint returns 200 with metrics
- [ ] Test registration flow end-to-end (OTP must arrive)
- [ ] Test login with demo accounts
- [ ] Test event creation → ticket purchase (Stripe test mode)
- [ ] Verify WebSocket connection (open chat on event page)
- [ ] Check Sentry receives test error (`GET /api/test-error` if added)
- [ ] Verify rate limiting works (hit endpoint 101 times rapidly)
- [ ] Check logs are not flooding (Redis warnings suppressed)
- [ ] Run `npm run test:integration` against production API
- [ ] Run `node tests/security-audit.js` against production

### Week 1

- [ ] Monitor Sentry for unexpected errors
- [ ] Check `/health` metrics: p95 latency < 500ms
- [ ] Verify email deliverability (check spam folders)
- [ ] Test OTP on multiple email providers (Gmail, Outlook, Yahoo)
- [ ] Test mobile responsiveness on real devices
- [ ] Run `npm run loadtest` with `LOAD_TEST_URL=https://yourapi.com`
- [ ] Set up uptime monitoring (UptimeRobot, Better Uptime, etc.)
- [ ] Configure MongoDB Atlas alerts (connections, storage, slow queries)
- [ ] Review audit logs for suspicious activity
- [ ] Verify backup schedule on MongoDB Atlas

### Week 2-4

- [ ] Analyze real user behavior (which pages are slow?)
- [ ] Review Sentry error trends (recurring issues)
- [ ] Check Redis memory usage (stay under plan limit)
- [ ] Review rate limit hit counts (too strict or too lenient?)
- [ ] Set up scheduled database backups (if not Atlas-managed)
- [ ] Create runbook for common issues (restart procedure, rollback)
- [ ] Set up Slack/Discord alerts for production errors
- [ ] Performance audit: compare metrics vs pre-launch baseline

### Monthly Ongoing

- [ ] Run `npm audit` and update dependencies
- [ ] Review and rotate secrets (JWT_SECRET, API keys)
- [ ] Check certificate expiry (SSL)
- [ ] Review MongoDB indexes (slow query log)
- [ ] Clean up expired tokens/sessions (`npm run seed` has cleanup)
- [ ] Review storage usage (Cloudinary, MongoDB)
- [ ] Update documentation if architecture changes

---

## Part 5: Complete End-to-End Setup (Dev → Prod)

### Developer Machine (5 minutes)

```bash
# 1. Clone
git clone https://github.com/YOUR_USER/eazy-event.git
cd eazy-event

# 2. Backend setup
cd backend/eazy_event_server-master
cp .env.example .env.development
# Edit .env.development with your Mailtrap + Atlas credentials (minimum)
npm install

# 3. Seed database
npm run seed

# 4. Start backend
npm run dev
# → Server running on http://localhost:5000

# 5. Frontend setup (new terminal)
cd frontend/Eazy_Event-main
echo "VITE_SERVER_URL=http://localhost:5000" > .env
npm install
npm run dev
# → Frontend running on http://localhost:5174

# 6. Verify
open http://localhost:5174
# Login: admin@demo.com / Demo@123!
```

### Docker (2 minutes)

```bash
# Full stack in one command:
docker compose -f docker-compose.dev.yml up
# → Backend: 5000, Frontend: 5174, MongoDB: 27017, Redis: 6379
```

### Production Deployment (30 minutes)

```bash
# 1. Server setup (Ubuntu 22.04 recommended)
sudo apt update && sudo apt install docker.io docker-compose-plugin nginx certbot -y

# 2. Clone repo
git clone https://github.com/YOUR_USER/eazy-event.git
cd eazy-event

# 3. Configure production env
cp backend/eazy_event_server-master/.env.example backend/eazy_event_server-master/.env.production
# Edit with REAL production values:
#   - MONGO_URI (Atlas prod cluster)
#   - JWT_SECRET (openssl rand -base64 64)
#   - STRIPE keys (live mode)
#   - SMTP credentials
#   - REDIS_URL
#   - SENTRY_DSN
#   - GOOGLE_GEMINI_API_KEY

# 4. Frontend env
echo "VITE_SERVER_URL=https://api.yourdomain.com" > frontend/Eazy_Event-main/.env
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_live_..." >> frontend/Eazy_Event-main/.env

# 5. Deploy
docker compose -f docker-compose.prod.yml up -d --build

# 6. Setup Nginx + SSL
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# 7. Run migrations
docker exec -it eazy-event-backend npm run migrate:up

# 8. Seed initial data (optional)
docker exec -it eazy-event-backend npm run seed

# 9. Verify
curl https://api.yourdomain.com/health
# Should return: {"status":"OK","metrics":{...},"jobQueue":{...}}

# 10. Run production tests
LOAD_TEST_URL=https://api.yourdomain.com node tests/security-audit.js
```

### CI/CD (Automatic after setup)

Once GitHub repo is configured with environments + secrets:
- Every push to `dev` → auto-deploys to DEV after all 5 gates pass
- Every push to `master` → auto-deploys to PROD after approval

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed GitHub setup.

---

## Summary: Minimum Viable Configuration

To get the app **fully working** with all user-facing features, you need at minimum:

| Service | Required For | Free Tier Available |
|---------|-------------|:---:|
| MongoDB Atlas | Database | ✅ M0 (512MB) |
| Gmail App Password | Email/OTP delivery | ✅ (500/day) |
| Stripe Test Mode | Payments | ✅ (test mode unlimited) |
| Google Gemini | AI features | ✅ (15 req/min) |

**Optional but recommended for production:**

| Service | Required For | Free Tier |
|---------|-------------|:---------:|
| Redis Cloud | Caching, scaling | ✅ (30MB) |
| Twilio | SMS OTP | $15 trial credit |
| Sentry | Error monitoring | ✅ (5K errors/month) |
| Cloudinary | Image uploads | ✅ (25 credits/month) |

**Total cost for production with all features: ~$0-5/month** (using free tiers)
