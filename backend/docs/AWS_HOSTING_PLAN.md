# EZEvent — AWS Hosting Plan (<$5/month for 0-1K users)

## Architecture Overview (Minimal Cost)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ULTRA LOW-COST AWS ARCHITECTURE                            │
│                                                                              │
│  GitHub ──push──► GitHub Actions (FREE) ──deploy──► EC2 (app + Jenkins)     │
│                                                                              │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────┐    │
│  │  Route 53   │    │         EC2 t3.micro (or t2.micro free tier)    │    │
│  │  (optional) │───►│  ┌──────────┐ ┌────────┐ ┌───────┐ ┌───────┐ │    │
│  │  $0.50/mo   │    │  │  Nginx   │ │  Node  │ │ Redis │ │Jenkins│ │    │
│  └─────────────┘    │  │  (proxy) │ │  (API) │ │ (local│ │(CI/CD)│ │    │
│                      │  └──────────┘ └────────┘ └───────┘ └───────┘ │    │
│  ┌─────────────┐    │  ┌──────────────────────────────────────────┐ │    │
│  │  CloudFront │    │  │  Frontend (served by Nginx from /var/www)│ │    │
│  │  (optional) │    │  └──────────────────────────────────────────┘ │    │
│  └─────────────┘    └─────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐                                        │
│  │  MongoDB    │    │  AWS SES    │                                        │
│  │  Atlas M0   │    │  (email)    │                                        │
│  │  FREE       │    │  FREE 62K   │                                        │
│  └─────────────┘    └─────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Monthly Cost Breakdown (ACTUAL — no hidden charges)

| Service | What It Does | Cost | Free Tier? |
|---------|-------------|------|:----------:|
| **EC2 t2.micro** | Runs everything (API + Nginx + Redis + Jenkins) | **$0** first year, then **$8.35** | ✅ 12 months |
| **MongoDB Atlas M0** | Database (512MB, shared) | **$0 forever** | ✅ Always free |
| **Redis (local on EC2)** | Cache + rate limits (NOT ElastiCache!) | **$0** | N/A (on same server) |
| **AWS SES** | Email/OTP delivery (62,000 emails/month free from EC2) | **$0** | ✅ Always free from EC2 |
| **Let's Encrypt SSL** | HTTPS certificates (NOT ACM — that needs ALB) | **$0** | ✅ Always free |
| **EBS (20GB gp3)** | Disk for EC2 | **$0** first year, then **$1.60** | ✅ 30GB free |
| **Elastic IP** | Static public IP | **$0** (if attached to running instance) | ✅ Free when attached |
| **Data Transfer** | First 100GB/month outbound | **$0** | ✅ Free tier |

### Total Monthly Cost:

| Scenario | Monthly Cost |
|----------|:-----------:|
| **Within Free Tier (Year 1)** | **$0.00** |
| **After Free Tier expires** | **$9.95/month** |
| **With Route 53 domain** | +$0.50/month |
| **Without own domain (use EC2 IP)** | $0 extra |

### ⚠️ Cost Traps to AVOID:

| DON'T DO THIS | Cost Impact | DO THIS INSTEAD |
|---------------|-------------|-----------------|
| ❌ Use ElastiCache | +$12/month | ✅ Install Redis locally on EC2 |
| ❌ Use RDS for MongoDB | +$15/month | ✅ Use MongoDB Atlas M0 (free forever) |
| ❌ Use ALB (Application Load Balancer) | +$16/month | ✅ Use Nginx on same EC2 |
| ❌ Use NAT Gateway | +$32/month | ✅ Put EC2 in public subnet |
| ❌ Leave EBS snapshots running | +$2-5/month | ✅ Delete old snapshots |
| ❌ Use CloudWatch detailed monitoring | +$3.50/month | ✅ Use basic (free) monitoring |
| ❌ Multiple Elastic IPs unattached | +$3.60/IP/month | ✅ Release unused IPs |
| ❌ Use t3 instead of t2.micro | +$0/free tier only covers t2.micro | ✅ Use t2.micro for free tier |
| ❌ Use us-west-2 (some services cost more) | varies | ✅ Use us-east-1 (cheapest) |

---

## Step-by-Step Deployment Guide

### Prerequisites

- AWS Account (with billing alerts set)
- Domain name (optional, can use AWS-provided URLs)
- GitHub repository with EZEvent code
- AWS CLI installed locally

---

### STEP 1: AWS Account & Billing Setup (5 min)

```bash
# 1. Create AWS account at aws.amazon.com
# 2. Set up billing alarm:
#    → AWS Console → Billing → Budgets → Create Budget
#    → Monthly cost budget: $15
#    → Alert at 80% ($12)

# 3. Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# 4. Configure credentials
aws configure
# → Enter Access Key ID, Secret, Region (us-east-1 recommended for free tier)
```

---

### STEP 2: Create EC2 Instance (10 min)

This single t2.micro runs everything: Nginx + Node.js API + Redis + Jenkins.

**IMPORTANT:** Use `t2.micro` (NOT t3.micro) — only t2.micro is free tier eligible.

```bash
# 1. Create key pair (if you don't have one)
aws ec2 create-key-pair --key-name ezevent-key --query 'KeyMaterial' --output text > ezevent-key.pem
chmod 400 ezevent-key.pem

# 2. Create security group
aws ec2 create-security-group \
  --group-name ezevent-sg \
  --description "EZEvent Server"

# 3. Allow inbound traffic (ONLY what's needed)
aws ec2 authorize-security-group-ingress --group-name ezevent-sg \
  --protocol tcp --port 22 --cidr YOUR_IP/32       # SSH (your IP only!)
aws ec2 authorize-security-group-ingress --group-name ezevent-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0       # HTTP
aws ec2 authorize-security-group-ingress --group-name ezevent-sg \
  --protocol tcp --port 443 --cidr 0.0.0.0/0      # HTTPS
aws ec2 authorize-security-group-ingress --group-name ezevent-sg \
  --protocol tcp --port 8080 --cidr YOUR_IP/32    # Jenkins (your IP only!)

# 4. Launch FREE TIER instance (t2.micro, Ubuntu 22.04, us-east-1)
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t2.micro \
  --key-name ezevent-key \
  --security-groups ezevent-sg \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ezevent-server}]' \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --region us-east-1

# 5. Allocate Elastic IP (FREE when attached to running instance)
aws ec2 allocate-address --domain vpc
# Note the AllocationId, then:
aws ec2 associate-address --instance-id YOUR_INSTANCE_ID --allocation-id YOUR_ALLOC_ID

# ⚠️ COST ALERT: If you STOP the instance, the Elastic IP costs $0.005/hour ($3.60/month)!
#    Always either: keep instance running, OR release the Elastic IP when stopped.
```

---

### STEP 3: Server Setup (SSH into EC2) (15 min)

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io docker-compose-plugin -y
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Install Nginx (reverse proxy)
sudo apt install nginx certbot python3-certbot-nginx -y

# Install Jenkins
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install jenkins openjdk-17-jre -y
sudo systemctl enable jenkins
sudo systemctl start jenkins

# Install ArgoCD CLI (for GitOps deployments)
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install argocd /usr/local/bin/argocd

# Logout and re-login (for docker group)
exit
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

---

### STEP 4: Configure Nginx Reverse Proxy (5 min)

```bash
sudo tee /etc/nginx/sites-available/ezevent << 'EOF'
# API Backend
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend (served from S3/CloudFront, or locally)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/ezevent/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/ezevent /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# SSL (after DNS is pointed to your server)
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d www.yourdomain.com
```

---

### STEP 5: Deploy Application (10 min)

```bash
# Clone repository
cd /home/ubuntu
git clone https://github.com/YOUR_USER/eazy-event.git
cd eazy-event

# Backend setup
cd backend/eazy_event_server-master
cp .env.example .env.production

# Edit with production values:
sudo nano .env.production
```

**.env.production** (fill in your values):
```env
PORT=5000
NODE_ENV=production
CLIENT_BASE_URL=https://yourdomain.com
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/eazy_event_prod
JWT_SECRET=<run: openssl rand -base64 64>
SESSION_SECRET=<run: openssl rand -base64 32>
CSRF_SECRET=<run: openssl rand -base64 32>
REDIS_URL=redis://localhost:6379
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<AWS SES SMTP username>
SMTP_PASS=<AWS SES SMTP password>
SMTP_FROM=noreply@yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_GEMINI_API_KEY=AI...
SENTRY_DSN=https://...@sentry.io/...
```

```bash
# Install dependencies
npm ci --production

# Run migrations
npm run migrate:up

# Seed initial data
npm run seed

# Start with PM2 (process manager)
sudo npm install -g pm2
pm2 start app.js --name ezevent-api -i max
pm2 save
pm2 startup

# Build frontend
cd ../../frontend/Eazy_Event-main
echo "VITE_SERVER_URL=https://api.yourdomain.com" > .env
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_live_..." >> .env
npm ci
npm run build

# Deploy frontend to Nginx
sudo mkdir -p /var/www/ezevent
sudo cp -r dist/* /var/www/ezevent/
sudo chown -R www-data:www-data /var/www/ezevent

# Install Redis locally (free, no ElastiCache needed for <10K users)
sudo apt install redis-server -y
sudo systemctl enable redis-server
```

---

### STEP 6: Setup Jenkins CI/CD (15 min)

```bash
# 1. Access Jenkins at http://YOUR_EC2_IP:8080
# 2. Get initial password:
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# 3. Install plugins:
#    → Manage Jenkins → Plugins → Install:
#    - GitHub Integration
#    - Docker Pipeline
#    - NodeJS
#    - Credentials Binding
#    - Slack Notification (optional)
```

**Create Jenkins Pipeline** (`Jenkinsfile` in repo root):

```bash
# Create Jenkinsfile at repo root
cat > /home/ubuntu/eazy-event/Jenkinsfile << 'EOF'
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '20'
        DEPLOY_DIR = '/home/ubuntu/eazy-event'
    }
    
    stages {
        stage('Gate 1: Validate') {
            steps {
                sh 'node -e "JSON.parse(require(\"fs\").readFileSync(\"backend/eazy_event_server-master/package.json\"))"'
                sh 'node -e "JSON.parse(require(\"fs\").readFileSync(\"frontend/Eazy_Event-main/package.json\"))"'
                echo '✓ Project structure valid'
            }
        }
        
        stage('Gate 2: Backend Lint') {
            steps {
                dir('backend/eazy_event_server-master') {
                    sh 'npm ci'
                    sh '''
                        errors=0
                        for f in $(find . -name "*.js" -not -path "./node_modules/*"); do
                            if ! node -c "$f" 2>/dev/null; then
                                echo "❌ $f"
                                errors=$((errors + 1))
                            fi
                        done
                        if [ $errors -gt 0 ]; then exit 1; fi
                        echo "✓ All files pass syntax check"
                    '''
                    sh 'npm audit --production --audit-level=high'
                }
            }
        }
        
        stage('Gate 3: Frontend Build') {
            steps {
                dir('frontend/Eazy_Event-main') {
                    sh 'npm ci'
                    withEnv(['VITE_SERVER_URL=https://api.yourdomain.com']) {
                        sh 'npm run build'
                    }
                    echo '✓ Frontend build successful'
                }
            }
        }
        
        stage('Gate 4: Integration Tests') {
            steps {
                dir('backend/eazy_event_server-master') {
                    sh '''
                        export NODE_ENV=test
                        export MONGO_URI=mongodb://localhost:27017/ezevent_test
                        node app.js &
                        sleep 10
                        node tests/integration-runner.js
                        node tests/security-audit.js
                        kill %1
                    '''
                }
            }
        }
        
        stage('Gate 5: Deploy') {
            when {
                anyOf {
                    branch 'master'
                    branch 'dev'
                }
            }
            steps {
                sh """
                    cd ${DEPLOY_DIR}
                    git pull origin ${env.BRANCH_NAME}
                    cd backend/eazy_event_server-master
                    npm ci --production
                    pm2 restart ezevent-api
                    
                    cd ../../frontend/Eazy_Event-main
                    npm ci
                    npm run build
                    sudo cp -r dist/* /var/www/ezevent/
                    
                    echo '✅ Deployed successfully'
                """
            }
        }
    }
    
    post {
        failure {
            echo '❌ Pipeline failed!'
            // slackSend channel: '#deploys', message: "❌ EZEvent deploy failed: ${env.BUILD_URL}"
        }
        success {
            echo '✅ Pipeline passed!'
        }
    }
}
EOF
```

**Jenkins Setup Steps:**
1. New Item → Pipeline → Name: "ezevent-pipeline"
2. Pipeline → Definition: "Pipeline script from SCM"
3. SCM: Git → Repository URL: `https://github.com/YOUR_USER/eazy-event.git`
4. Branch: `*/master` and `*/dev`
5. Build Triggers: ✅ "GitHub hook trigger for GITScm polling"
6. Save

**GitHub Webhook:**
1. GitHub repo → Settings → Webhooks → Add webhook
2. URL: `http://YOUR_EC2_IP:8080/github-webhook/`
3. Content type: `application/json`
4. Events: "Just the push event"

---

### STEP 7: Setup ArgoCD (GitOps - Optional, for K8s future) (10 min)

For the current single-server setup, Jenkins handles deployment directly. ArgoCD becomes relevant when you move to Kubernetes. Here's how to prepare:

```bash
# Install ArgoCD on the server (lightweight mode)
kubectl create namespace argocd 2>/dev/null || true

# For now, use ArgoCD CLI for manual sync verification:
# This monitors your Git repo and ensures deployed state matches

# Create ArgoCD app definition (save for when you move to K8s):
cat > /home/ubuntu/eazy-event/argocd-app.yaml << 'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ezevent
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_USER/eazy-event.git
    targetRevision: master
    path: k8s/
  destination:
    server: https://kubernetes.default.svc
    namespace: ezevent
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
EOF
```

**For current setup (non-K8s), the Jenkins pipeline IS your ArgoCD equivalent** — it auto-deploys on push.

---

### STEP 8: AWS SES for Email (Free 62K emails/month) (10 min)

```bash
# 1. AWS Console → SES → Verify domain or email
#    → Verified identities → Create identity → Domain: yourdomain.com
#    → Add DNS records shown (DKIM, SPF)

# 2. Request production access (out of sandbox)
#    → AWS Console → SES → Account dashboard → Request production access
#    → Takes 24-48 hours for approval

# 3. Create SMTP credentials
#    → AWS Console → SES → SMTP settings → Create SMTP credentials
#    → Save the username + password

# 4. Update .env.production:
#    SMTP_HOST=email-smtp.us-east-1.amazonaws.com
#    SMTP_PORT=587
#    SMTP_USER=<SMTP username from step 3>
#    SMTP_PASS=<SMTP password from step 3>
#    SMTP_FROM=noreply@yourdomain.com
```

---

### STEP 9: CloudFront CDN (Optional, Free Tier) (5 min)

```bash
# For even better frontend performance, serve via CloudFront:

# 1. Create S3 bucket
aws s3 mb s3://ezevent-frontend-prod --region us-east-1

# 2. Upload frontend build
aws s3 sync /var/www/ezevent/ s3://ezevent-frontend-prod/ --delete

# 3. Create CloudFront distribution
#    → AWS Console → CloudFront → Create distribution
#    → Origin: S3 bucket
#    → Default root object: index.html
#    → Custom error page: 403 → /index.html (for SPA routing)
#    → SSL: Use ACM certificate

# 4. Point DNS to CloudFront
#    → Route 53 → Create A record → Alias → CloudFront distribution
```

---

### STEP 10: Monitoring & Alerts (5 min)

```bash
# 1. CloudWatch alarm for EC2 CPU
aws cloudwatch put-metric-alarm \
  --alarm-name "EZEvent-High-CPU" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions <your-SNS-topic-ARN>

# 2. Setup health check in Route 53
#    → Health checks → Create → HTTP → api.yourdomain.com/health
#    → Alert when unhealthy

# 3. PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## CI/CD Flow Diagram

```
Developer pushes code
        │
        ▼
┌─────────────────┐        ┌──────────────────┐
│  GitHub Webhook │───────►│  Jenkins (EC2)   │
│  (push event)   │        │  Pipeline runs:  │
└─────────────────┘        │  1. Validate     │
                           │  2. Lint + Audit │
                           │  3. Build        │
                           │  4. Test (43+16) │
                           │  5. Deploy       │
                           └────────┬─────────┘
                                    │ Gate 5 passes
                                    ▼
                           ┌──────────────────┐
                           │  PM2 restarts    │
                           │  backend process │
                           │  Frontend copied │
                           │  to /var/www/    │
                           └──────────────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  Live at         │
                           │  yourdomain.com  │
                           └──────────────────┘
```

---

## Cost Optimization Tips

| Tip | Saves |
|-----|-------|
| Use t2.micro (NOT t3) for free tier | $8.35/month |
| MongoDB Atlas M0 instead of any AWS DB | $15-50/month |
| Local Redis on EC2 instead of ElastiCache | $12/month |
| AWS SES from EC2 instead of SendGrid | $15+/month |
| Nginx on EC2 instead of ALB | $16/month |
| Let's Encrypt instead of ACM+ALB | $16/month (ALB required for ACM) |
| No NAT Gateway (public subnet) | $32/month |
| No CloudWatch detailed monitoring | $3.50/month |
| Release Elastic IPs when not using | $3.60/IP/month |
| Stay in us-east-1 region | varies |
| **TOTAL AVOIDED COSTS** | **$120+/month** |

### Monthly Billing Check (Do This Every Week!)
```bash
# AWS Console → Billing → Bills → Check current month charges
# If ANYTHING unexpected shows up:
#   1. Check EC2 → Running instances (should be only 1 t2.micro)
#   2. Check EC2 → Elastic IPs (should be 1, attached)
#   3. Check EC2 → Snapshots (delete old ones)
#   4. Check EC2 → Volumes (should be 1x 20GB gp3)
#   5. Check VPC → NAT Gateways (should be NONE)
#   6. Check RDS → Instances (should be NONE — using Atlas)
```

---

## Scaling Path (When You Outgrow This Setup)

| Traffic | Architecture | Monthly Cost |
|---------|-------------|:------------:|
| **0-1K users** | Single t2.micro (current) | **$0-10** |
| 1K-5K users | Upgrade to t3.small + add ElastiCache | ~$25 |
| 5K-20K users | t3.medium + ALB + Atlas M10 | ~$60 |
| 20K-100K users | 2x t3.medium + ALB + Atlas M30 | ~$200 |
| 100K+ | ECS Fargate + K8s (ArgoCD) | $500+ |

**When to scale:** If `/health` p95 latency > 500ms or CPU stays above 80%.

---

## Quick Reference Commands

```bash
# SSH into server
ssh -i key.pem ubuntu@YOUR_IP

# Check app status
pm2 status
pm2 logs ezevent-api --lines 50

# Manual deploy
cd /home/ubuntu/eazy-event && git pull && cd backend/eazy_event_server-master && npm ci --production && pm2 restart ezevent-api

# Check Nginx
sudo nginx -t && sudo systemctl reload nginx

# Check Redis
redis-cli ping  # → PONG

# View Jenkins
# http://YOUR_IP:8080

# Renew SSL
sudo certbot renew --dry-run

# Run tests against production
cd /home/ubuntu/eazy-event/backend/eazy_event_server-master
LOAD_TEST_URL=https://api.yourdomain.com node tests/security-audit.js
LOAD_TEST_URL=https://api.yourdomain.com npm run loadtest
```
