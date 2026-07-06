# EZEvent — Deployment & Environment Setup Guide

## Table of Contents
1. [Environment Overview](#environment-overview)
2. [Local Development Setup](#local-development-setup)
3. [Environment Variables Reference](#environment-variables-reference)
4. [GitHub Repository Setup](#github-repository-setup)
5. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Deployment (Azure/AWS/GCP)](#cloud-deployment)
8. [Obtaining API Keys](#obtaining-api-keys)
9. [Troubleshooting](#troubleshooting)

---

## Environment Overview

```
┌─────────────┐    PR/Push     ┌─────────────┐    Push to dev    ┌─────────────┐
│   LOCAL     │ ─────────────► │   CI/CD     │ ────────────────► │    DEV      │
│  Developer  │                │  (GitHub    │                   │  (Staging)  │
│  Machine    │                │   Actions)  │                   │  Server     │
└─────────────┘                └─────────────┘                   └─────────────┘
                                      │                                 
                                      │ Push to master                  
                                      ▼                                 
                               ┌─────────────┐                         
                               │    PROD     │                         
                               │ (Production)│                         
                               │   Server    │                         
                               └─────────────┘
```

| Environment | Branch | Database | Purpose |
|-------------|--------|----------|---------|
| **Local** | any | `eazy_event_dev` (Atlas or local) | Development & debugging |
| **DEV** | `dev` | `eazy_event_dev` (shared Atlas) | Integration testing, demo |
| **PROD** | `master` | `eazy_event_prod` (dedicated Atlas) | Live users, real payments |

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- Git
- MongoDB Atlas account (free tier works) OR local MongoDB
- (Optional) Docker Desktop

### Step 1: Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/eazy-event.git
cd eazy-event

# Backend
cd backend/eazy_event_server-master
npm install

# Frontend
cd ../../frontend/Eazy_Event-main
npm install
```

### Step 2: Create `.env.development`

Copy `.env.example` and fill in your values:

```bash
cd backend/eazy_event_server-master
cp .env.example .env.development
```

Edit `.env.development` with your values (see [Environment Variables Reference](#environment-variables-reference) below).

### Step 3: Start Development Servers

**Option A — Manual (two terminals):**
```bash
# Terminal 1: Backend
cd backend/eazy_event_server-master
npm run dev

# Terminal 2: Frontend
cd frontend/Eazy_Event-main
npm run dev
```

**Option B — Docker (single command):**
```bash
docker compose -f docker-compose.dev.yml up
```

### Step 4: Seed Demo Data
```bash
cd backend/eazy_event_server-master
npm run seed
```

### Step 5: Access
- Frontend: http://localhost:5174
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

---

## Environment Variables Reference

### Required for ALL environments

| Variable | Example Value | Where to Get It |
|----------|--------------|-----------------|
| `PORT` | `5000` | Choose any available port |
| `NODE_ENV` | `development` / `production` | Set based on environment |
| `CLIENT_BASE_URL` | `http://localhost:5174` | Your frontend URL |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/db` | [MongoDB Atlas](#1-mongodb-atlas) |
| `JWT_SECRET` | Random 64+ char string | Generate: `openssl rand -base64 64` |
| `SESSION_SECRET` | Random 32+ char string | Generate: `openssl rand -base64 32` |
| `CSRF_SECRET` | Random 32+ char string | Generate: `openssl rand -base64 32` |

### Required for Production

| Variable | Example Value | Where to Get It |
|----------|--------------|-----------------|
| `REDIS_URL` | `redis://host:6379` | Redis Cloud / AWS ElastiCache |
| `SMTP_HOST` | `smtp.gmail.com` | Your email provider |
| `SMTP_PORT` | `587` | Usually 587 (TLS) or 465 (SSL) |
| `SMTP_USER` | `noreply@yourdomain.com` | Your email account |
| `SMTP_PASS` | App-specific password | [Gmail App Password](#3-email-smtp) |
| `STRIPE_SECRET_KEY` | `sk_live_...` | [Stripe Dashboard](#2-stripe-payments) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | [Stripe Webhooks](#2-stripe-payments) |

### Optional (Enhanced Features)

| Variable | Feature It Enables | Where to Get It |
|----------|-------------------|-----------------|
| `GOOGLE_GEMINI_API_KEY` | AI description/task generation | [Google AI Studio](#4-google-gemini-ai) |
| `CLOUDINARY_CLOUD_NAME` | Image uploads & CDN | [Cloudinary](#5-cloudinary) |
| `CLOUDINARY_API_KEY` | Image uploads & CDN | [Cloudinary](#5-cloudinary) |
| `CLOUDINARY_API_SECRET` | Image uploads & CDN | [Cloudinary](#5-cloudinary) |
| `TWILIO_ACCOUNT_SID` | SMS notifications | [Twilio](#6-twilio-sms) |
| `TWILIO_AUTH_TOKEN` | SMS notifications | [Twilio](#6-twilio-sms) |
| `TWILIO_PHONE_NUMBER` | SMS notifications | [Twilio](#6-twilio-sms) |
| `VAPID_PUBLIC_KEY` | Push notifications | [Web Push](#7-push-notifications) |
| `VAPID_PRIVATE_KEY` | Push notifications | [Web Push](#7-push-notifications) |

### Frontend Variables (in `.env` at frontend root)

| Variable | Example Value | Notes |
|----------|--------------|-------|
| `VITE_SERVER_URL` | `http://localhost:5000` | Backend API URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | Stripe publishable key |

---

## GitHub Repository Setup

### Step 1: Create Repository

```bash
# Initialize git (if not already)
cd "New folder"
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/eazy-event.git
git branch -M master
git push -u origin master

# Create dev branch
git checkout -b dev
git push -u origin dev
```

### Step 2: Configure GitHub Environments

Go to: **Repository → Settings → Environments**

#### Create "development" Environment
1. Click **"New environment"** → Name: `development`
2. No protection rules needed
3. Add these **Environment Variables** (Settings → Variables):
   - `DEV_URL` = `https://dev.yourdomain.com`
4. Add these **Environment Secrets** (Settings → Secrets):
   - `DEV_MONGO_URI` = Your dev MongoDB connection string
   - `DEV_DEPLOY_HOST` = IP/hostname of dev server
   - `DEV_SSH_KEY` = SSH private key for deployment

#### Create "production" Environment
1. Click **"New environment"** → Name: `production`
2. ✅ Enable **"Required reviewers"** — add yourself
3. ✅ Enable **"Wait timer"** — set to 5 minutes (safety net)
4. Add **Environment Variables**:
   - `PROD_URL` = `https://yourdomain.com`
5. Add **Environment Secrets**:
   - `PROD_MONGO_URI` = Your production MongoDB connection string
   - `PROD_DEPLOY_HOST` = IP/hostname of prod server
   - `PROD_SSH_KEY` = SSH private key for deployment

### Step 3: Add Repository-Level Secrets

Go to: **Repository → Settings → Secrets and variables → Actions → Secrets**

| Secret Name | Value | Used By |
|-------------|-------|---------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | Frontend build |

### Step 4: Add Repository-Level Variables

Go to: **Repository → Settings → Secrets and variables → Actions → Variables**

| Variable Name | Value |
|---------------|-------|
| `VITE_SERVER_URL` | `https://api.yourdomain.com` |

---

## CI/CD Pipeline Setup

The pipeline is configured in `.github/workflows/ci.yml` with **5 sequential gates**. If any gate fails, the pipeline stops immediately — nothing deploys with broken code.

### Pipeline Architecture

```
  Push/PR
     │
     ▼
┌─────────────────────────────────────────┐
│  GATE 1: Project Structure              │
│  • Validate all JSON (package.json,     │
│    manifest.json, tsconfig, etc.)       │
│  • Check required files exist            │
│  • Scan for leaked secrets              │
│  ❌ STOPS if: invalid JSON, missing     │
│     files, secrets in source            │
└─────────────────┬───────────────────────┘
                  │ PASS
         ┌────────┴────────┐
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│ GATE 2: Backend │ │ GATE 3: Frontend│
│ • Syntax check  │ │ • npm run build │
│   ALL .js files │ │ • Validate HTML │
│ • npm audit     │ │ • Bundle size   │
│ • Code patterns │ │   limits check  │
│ ❌ Syntax error │ │ ❌ Build fails  │
│ ❌ High vuln    │ │ ❌ >5MB total   │
└────────┬────────┘ └────────┬────────┘
         │ PASS              │ PASS
         └────────┬──────────┘
                  ▼
┌─────────────────────────────────────────┐
│  GATE 4: Integration Tests              │
│  • Start MongoDB service container      │
│  • Seed demo data                        │
│  • Start backend server                  │
│  • Run 43 API assertions                 │
│  • Run 16 OWASP security checks         │
│  ❌ STOPS if: any test fails            │
└─────────────────┬───────────────────────┘
                  │ PASS
                  ▼
┌─────────────────────────────────────────┐
│  GATE 5: Deploy                          │
│  • dev branch → Deploy to DEV           │
│  • master branch → Deploy to PROD       │
│    (requires environment approval)      │
└─────────────────────────────────────────┘
```

### What Each Gate Checks

| Gate | Checks | Fails On |
|------|--------|----------|
| **1: Project Structure** | JSON validity, required files, secret scanning | Invalid `package.json`, missing `app.js`/`Dockerfile`, Stripe keys in code |
| **2: Backend Lint** | `node -c` on all 122+ .js files, `npm audit --production`, eval/injection patterns | Any syntax error, high/critical CVE, dangerous code patterns |
| **3: Frontend Build** | Full production build, output validation, size limits | Vite build error, missing `dist/index.html`, bundle >5MB |
| **4: Integration Tests** | 43 API endpoint assertions + 16 OWASP security checks | Any assertion failure, security violation |
| **5: Deploy** | Deploys artifacts to target environment | Only if all gates pass |

### Pipeline Triggers

| Event | What Happens |
|-------|--------------|
| **PR to `dev` or `master`** | Runs Gates 1-4 (no deploy) — PR status checks |
| **Push to `dev`** | Runs Gates 1-4 → Gate 5 deploys to DEV |
| **Push to `master`** | Runs Gates 1-4 → Gate 5 deploys to PROD (environment approval required) |
| **Concurrent pushes** | Previous pipeline run cancelled automatically |

### How to Use the Pipeline

**Daily development workflow:**
```bash
# 1. Create feature branch from dev
git checkout dev
git pull
git checkout -b feature/my-feature

# 2. Make changes, commit
git add .
git commit -m "feat: add my feature"

# 3. Push and create PR targeting dev
git push origin feature/my-feature
# → GitHub Actions runs Gates 1-4 automatically
# → PR shows ✅/❌ status for each gate

# 4. Merge PR to dev (only if all gates pass)
# → Gate 5 auto-deploys to DEV environment

# 5. When ready for production: create PR dev → master
# → All gates run again
# → After merge, Gate 5 deploys to PROD (after manual approval)
```

### Running Checks Locally (Before Pushing)

```bash
# Run the same checks the pipeline does:

# Gate 1 equivalent:
node -e "JSON.parse(require('fs').readFileSync('package.json'))"

# Gate 2 equivalent:
cd backend/eazy_event_server-master
find . -name "*.js" -not -path "./node_modules/*" -exec node -c {} \;
npm audit --production --audit-level=high

# Gate 3 equivalent:
cd frontend/Eazy_Event-main
npm run build

# Gate 4 equivalent:
cd backend/eazy_event_server-master
npm run test:integration    # 43 API tests
node tests/security-audit.js  # 16 OWASP checks
```

### Available Test Commands

```bash
# Integration tests (requires running server)
npm run test:integration

# Load test (50 concurrent users, 30s)
npm run loadtest

# Security audit (OWASP checks)
node tests/security-audit.js

# Database migrations
npm run migrate:up       # Apply pending migrations
npm run migrate:down     # Rollback last migration
npm run migrate:status   # Show migration status
npm run migrate:create   # Create new migration file
```

---

## Docker Deployment

### Development (Local Docker)

```bash
# Start everything (backend + frontend + MongoDB + Redis)
docker compose -f docker-compose.dev.yml up

# Stop
docker compose -f docker-compose.dev.yml down

# Rebuild after dependency changes
docker compose -f docker-compose.dev.yml up --build
```

### Production (Remote Server)

```bash
# On your production server:
git clone https://github.com/YOUR_USERNAME/eazy-event.git
cd eazy-event

# Create production env file
cp backend/eazy_event_server-master/.env.example backend/eazy_event_server-master/.env.production
# Edit with production values (see reference above)

# Deploy
docker compose -f docker-compose.prod.yml up -d

# Check health
curl http://localhost:5000/health

# View logs
docker compose -f docker-compose.prod.yml logs -f backend

# Update deployment
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Cloud Deployment

### Option A: Azure App Service

```bash
# Install Azure CLI, login
az login

# Create resource group
az group create --name ezevent-rg --location eastus

# Create App Service plan
az appservice plan create --name ezevent-plan --resource-group ezevent-rg --sku B1 --is-linux

# Deploy backend
az webapp create --resource-group ezevent-rg --plan ezevent-plan --name ezevent-api --runtime "NODE:20-lts"
az webapp config appsettings set --resource-group ezevent-rg --name ezevent-api --settings \
  NODE_ENV=production \
  MONGO_URI="your_mongo_uri" \
  JWT_SECRET="your_jwt_secret" \
  # ... other env vars

# Deploy frontend (Static Web Apps)
az staticwebapp create --name ezevent-web --resource-group ezevent-rg --source ./frontend/Eazy_Event-main/dist
```

### Option B: AWS (EC2 + Docker)

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Docker
sudo yum update -y
sudo yum install docker docker-compose-plugin -y
sudo systemctl start docker

# Clone and deploy
git clone https://github.com/YOUR_USERNAME/eazy-event.git
cd eazy-event
# Set up .env.production
docker compose -f docker-compose.prod.yml up -d
```

### Option C: Railway / Render (Easiest)

1. Connect GitHub repo to Railway/Render
2. Set environment variables in their dashboard
3. Deploy automatically on push

---

## Obtaining API Keys

### 1. MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create free cluster (M0)
3. **Database Access** → Create user with password
4. **Network Access** → Add `0.0.0.0/0` (allow all) or your server IP
5. **Connect** → Get connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/eazy_event_dev
   ```
6. Create TWO databases: `eazy_event_dev` and `eazy_event_prod`

### 2. Stripe Payments

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign up / Log in
3. **Developers → API Keys**:
   - `pk_test_...` (Publishable key — safe for frontend)
   - `sk_test_...` (Secret key — backend only!)
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://yourdomain.com/api/orders/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy the `whsec_...` signing secret
5. For production: Toggle "Live mode" and get live keys

### 3. Email (SMTP)

**Gmail (free, limited to 500/day):**
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Generate app password
3. Settings:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

**Mailtrap (for development — catches emails):**
1. Go to [mailtrap.io](https://mailtrap.io) → Sign up free
2. Inbox → SMTP Settings → Copy credentials

**SendGrid (production, 100/day free):**
1. [sendgrid.com](https://sendgrid.com) → Create API key
2. Settings:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your_sendgrid_api_key
   ```

### 4. Google Gemini AI

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **"Get API Key"**
3. Create key for your project
4. Copy the key → `GOOGLE_GEMINI_API_KEY`

### 5. Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) → Sign up free
2. Dashboard shows:
   - Cloud Name → `CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`

### 6. Twilio SMS

1. Go to [twilio.com](https://www.twilio.com) → Sign up (free trial)
2. Console Dashboard:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth Token → `TWILIO_AUTH_TOKEN`
3. Buy a phone number → `TWILIO_PHONE_NUMBER`

### 7. Push Notifications (VAPID Keys)

Generate locally:
```bash
npx web-push generate-vapid-keys
```
Output:
```
Public Key: BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

VAPID_PUBLIC_KEY=BxxxxQ
VAPID_PRIVATE_KEY=xxxxxx
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

---

## Troubleshooting

### Pipeline Fails at "Integration Tests"

**MongoDB connection timeout:**
- The CI uses a service container. Ensure `MONGO_URI=mongodb://localhost:27017/eazy_event_test`

**Tests pass locally but fail in CI:**
- Check if you have seed data issues (CI starts fresh)
- Run `npm run seed` step is included in CI

### "Cannot find module" Errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors in Browser

Check `CLIENT_BASE_URL` matches your frontend URL exactly (including port).

### Stripe Webhooks Not Working

1. Verify webhook URL is publicly accessible
2. Check `STRIPE_WEBHOOK_SECRET` matches the endpoint's signing secret
3. For local testing: `stripe listen --forward-to localhost:5000/api/orders/webhook`

### Redis Warnings in Dev

Safe to ignore. Redis is optional in development — the app falls back to in-memory cache. Warnings are suppressed in production when Redis is configured.

---

## Quick Reference Commands

```bash
# ─── Development ───
npm run dev                    # Start backend (dev mode with hot reload)
npm run seed                   # Seed demo data
npm run test:integration       # Run all 43 integration tests

# ─── Docker ───
docker compose -f docker-compose.dev.yml up      # Full local stack
docker compose -f docker-compose.prod.yml up -d  # Production deploy

# ─── Generate Secrets ───
openssl rand -base64 64        # JWT_SECRET (64 chars)
openssl rand -base64 32        # SESSION_SECRET / CSRF_SECRET (32 chars)
npx web-push generate-vapid-keys  # VAPID keys

# ─── Database ───
npm run seed                   # Seed demo data
node scripts/prodReadinessCheck.js  # Pre-deploy checklist
```

---

## File Structure

```
eazy-event/
├── .github/workflows/ci.yml    ← CI/CD pipeline
├── docker-compose.dev.yml      ← Local Docker stack
├── docker-compose.prod.yml     ← Production Docker
├── backend/eazy_event_server-master/
│   ├── .env.example            ← Template (committed to git)
│   ├── .env.development        ← Local dev secrets (NOT in git)
│   ├── .env.production         ← Prod secrets (NOT in git)
│   ├── Dockerfile              ← Multi-stage Docker build
│   ├── app.js                  ← Auto-loads correct .env file
│   └── tests/
│       └── integration-runner.js  ← 43-test integration suite
└── frontend/Eazy_Event-main/
    ├── .env                    ← VITE_SERVER_URL, VITE_STRIPE_KEY
    └── Dockerfile              ← Multi-stage build + Nginx
```
