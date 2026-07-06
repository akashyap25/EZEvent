# EZEvent — Complete Project Guide

## 📋 READ THIS FIRST

This document tells you **what to do, in what order, and which doc to read** for everything from first setup to production deployment.

---

## ⚡ Quick Start (Local Development)

```bash
# 1. Backend
cd backend/eazy_event_server-master
cp .env.example .env.development
# Edit .env.development → fill MONGO_URI, SMTP_*, JWT_SECRET, etc.
npm install
npm run seed        # Seeds demo data for local testing
npm run dev         # Starts on http://localhost:5000

# 2. Frontend (new terminal)
cd frontend/Eazy_Event-main
echo "VITE_SERVER_URL=http://localhost:5000" > .env
npm install
npm run dev         # Starts on http://localhost:5174

# 3. Verify
# Open http://localhost:5174
# Use the demo credentials created by the seed script if enabled locally
```

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
| Demo accounts | Created locally by the seed script when enabled |

---

## 🏗️ Tech Stack

**Backend:** Node.js 20 · Express 4 · MongoDB (Mongoose 8) · Redis · Socket.IO · JWT + OTP Auth  
**Frontend:** React 18 · Vite 7 · TailwindCSS · Custom UI Components · PWA  
**Payments:** Stripe (Checkout + Webhooks)  
**AI:** Google Gemini (descriptions, tasks, tags, chatbot)  
**Comms:** Nodemailer + Twilio SMS + Web Push  
**DevOps:** Docker · GitHub Actions · Jenkins · Nginx · Let's Encrypt  
**Monitoring:** Sentry · Custom APM metrics at /health  
