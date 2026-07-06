# EZEvent — Complete Project Guide

## 📋 READ THIS FIRST

This document tells you **what to do, in what order, and which doc to read** for everything from first setup to production deployment.

---

## 🚀 MASTER PROCESS (Follow Top to Bottom)

```
╔══════════════════════════════════════════════════════════════════════════╗
║  PHASE 1: LOCAL SETUP (20 minutes)                                      ║
║                                                                          ║
║  1. Clone & install deps           → See "Quick Start" below            ║
║  2. Setup MongoDB Atlas (free)     → docs/WHATS_MISSING.md, Part 3      ║
║  3. Setup Email (Gmail/Mailtrap)   → docs/WHATS_MISSING.md, Part 3      ║
║  4. Setup Stripe (test keys)       → docs/WHATS_MISSING.md, Part 3      ║
║  5. Setup Gemini AI key            → docs/WHATS_MISSING.md, Part 3      ║
║  6. Start servers & test           → See "Quick Start" below            ║
║                                                                          ║
║  ✅ Result: App fully working locally                                    ║
╠══════════════════════════════════════════════════════════════════════════╣
║  PHASE 2: GITHUB & CI/CD (15 minutes)                                   ║
║                                                                          ║
║  7. Create GitHub repo             → DEPLOYMENT_GUIDE.md, Section 4     ║
║  8. Setup environments + secrets   → DEPLOYMENT_GUIDE.md, Section 4     ║
║  9. Push code → CI runs            → DEPLOYMENT_GUIDE.md, Section 5     ║
║                                                                          ║
║  ✅ Result: Auto-tests on every push                                     ║
╠══════════════════════════════════════════════════════════════════════════╣
║  PHASE 3: DEPLOY TO DEV (30 minutes)                                    ║
║                                                                          ║
║  10. Create AWS EC2 (free tier)    → docs/AWS_HOSTING_PLAN.md, Steps 1-5║
║  11. Setup Nginx + SSL             → docs/AWS_HOSTING_PLAN.md, Step 4   ║
║  12. Deploy app + Redis            → docs/AWS_HOSTING_PLAN.md, Step 5   ║
║  13. Setup Jenkins CI/CD           → docs/AWS_HOSTING_PLAN.md, Step 6   ║
║  14. Verify: run tests against DEV → docs/WHATS_MISSING.md, Part 4      ║
║                                                                          ║
║  ✅ Result: DEV server live, auto-deploys on push to dev branch          ║
╠══════════════════════════════════════════════════════════════════════════╣
║  PHASE 4: DEPLOY TO PROD (15 minutes)                                   ║
║                                                                          ║
║  15. Create prod .env              → DEPLOYMENT_GUIDE.md, Section 3     ║
║  16. Point domain + SSL            → docs/AWS_HOSTING_PLAN.md, Step 4   ║
║  17. Push to master → auto-deploy  → Happens via Jenkins/GitHub Actions ║
║  18. Post-deployment checklist     → docs/WHATS_MISSING.md, Part 4      ║
║                                                                          ║
║  ✅ Result: Production live at yourdomain.com                            ║
╠══════════════════════════════════════════════════════════════════════════╣
║  PHASE 5: OPTIONAL ENHANCEMENTS                                         ║
║                                                                          ║
║  • Redis Cloud (scaling)           → docs/WHATS_MISSING.md, Part 3      ║
║  • Twilio SMS                      → docs/WHATS_MISSING.md, Part 3      ║
║  • Sentry monitoring               → Set SENTRY_DSN env var             ║
║  • Cloudinary images               → docs/WHATS_MISSING.md, Part 3      ║
║  • VAPID push notifications        → npx web-push generate-vapid-keys   ║
║                                                                          ║
║  ✅ Result: All features enabled                                         ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## ⚡ Quick Start (Local Development)

```bash
# 1. Backend
cd backend/eazy_event_server-master
cp .env.example .env.development
# Edit .env.development → fill MONGO_URI, SMTP_*, JWT_SECRET, etc.
npm install
npm run seed        # Seeds demo data (admin@demo.com / Demo@123!)
npm run dev         # Starts on http://localhost:5000

# 2. Frontend (new terminal)
cd frontend/Eazy_Event-main
echo "VITE_SERVER_URL=http://localhost:5000" > .env
npm install
npm run dev         # Starts on http://localhost:5174

# 3. Verify
# Open http://localhost:5174
# Login: admin@demo.com / Demo@123!
```

---

## 📁 Documentation Map

| Doc | What It Covers | When To Read |
|-----|---------------|--------------|
| **This file (README.md)** | Master process, quick start, doc map | First |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Env vars, GitHub setup, CI/CD pipeline, Docker, cloud deploy | Phase 2-4 |
| **[docs/WHATS_MISSING.md](backend/eazy_event_server-master/docs/WHATS_MISSING.md)** | API key setup (MongoDB, Stripe, Email, AI, SMS), post-deploy checklist | Phase 1 & 5 |
| **[docs/AWS_HOSTING_PLAN.md](backend/eazy_event_server-master/docs/AWS_HOSTING_PLAN.md)** | AWS deployment (<$10/mo), EC2, Nginx, Jenkins, cost traps | Phase 3-4 |
| **[docs/HLD.md](backend/eazy_event_server-master/docs/HLD.md)** | System architecture, tech stack, data flows, scalability | Interview prep |
| **[docs/LLD.md](backend/eazy_event_server-master/docs/LLD.md)** | Schema details, API endpoints, services, middleware, frontend arch | Interview prep |
| **[docs/INTERVIEW_PREP.md](backend/eazy_event_server-master/docs/INTERVIEW_PREP.md)** | Q&A format: 30+ technical questions with answers | Before interviews |
| **[docs/SECURITY_ARCHITECTURE.md](backend/eazy_event_server-master/docs/SECURITY_ARCHITECTURE.md)** | Security layers, OWASP coverage, auth flow | Security review |
| **[docs/COMPETITOR_ANALYSIS.md](backend/eazy_event_server-master/docs/COMPETITOR_ANALYSIS.md)** | Market positioning vs Eventbrite/Luma/Dreamcast | Business context |

---

## 🔑 Environment Variables (Minimum Required)

```env
# Backend (.env.development)
MONGO_URI=mongodb+srv://...              # From MongoDB Atlas (free)
JWT_SECRET=<64+ random chars>            # openssl rand -base64 64
SESSION_SECRET=<32+ random chars>        # openssl rand -base64 32
CSRF_SECRET=<32+ random chars>           # openssl rand -base64 32
SMTP_HOST=smtp.gmail.com                 # Or smtp.mailtrap.io for dev
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-password>                 # Google App Password
CLIENT_BASE_URL=http://localhost:5174
STRIPE_SECRET_KEY=sk_test_...            # From Stripe dashboard
GOOGLE_GEMINI_API_KEY=AI...              # From aistudio.google.com

# Frontend (.env)
VITE_SERVER_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🧪 Testing Commands

```bash
cd backend/eazy_event_server-master

# API Integration Tests (43 assertions, requires running server)
npm run test:integration

# OWASP Security Audit (18 checks)
node tests/security-audit.js

# Load Test (50 users, 30s)
npm run loadtest

# Database Migrations
npm run migrate:up
npm run migrate:status
```

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Backend files | 122+ .js |
| API endpoints | 283+ |
| Data models | 21 collections |
| Services | 21 |
| Frontend pages | 15+ |
| Integration tests | 43 assertions |
| Security checks | 18 OWASP |
| Initial bundle | ~500KB (was 1087KB) |
| Build time | ~15s |
| npm vulnerabilities | 0 |
| CI/CD gates | 5 sequential |
| Demo accounts | admin@demo.com / Demo@123! |

---

## 🏗️ Tech Stack

**Backend:** Node.js 20 · Express 4 · MongoDB (Mongoose 8) · Redis · Socket.IO · JWT + OTP Auth  
**Frontend:** React 18 · Vite 7 · TailwindCSS · Custom UI Components · PWA  
**Payments:** Stripe (Checkout + Webhooks)  
**AI:** Google Gemini (descriptions, tasks, tags, chatbot)  
**Comms:** Nodemailer + Twilio SMS + Web Push  
**DevOps:** Docker · GitHub Actions · Jenkins · Nginx · Let's Encrypt  
**Monitoring:** Sentry · Custom APM metrics at /health  
