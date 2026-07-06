# EZEvent — Low Level Design (LLD)

## 1. Database Schema (21 Collections)

### Core Models
```
User {
  _id, email*, username*, firstName*, lastName*, phone,
  password (bcrypt), avatar, role (user/admin/moderator),
  isEmailVerified, isActive, failedLoginAttempts, lockUntil,
  preferences{}, privacy{}, passwordHistory[], timestamps
}

Event {
  _id, title* (max 200), description (max 10000), organizer* → User,
  category → Category, organizationId → Organization,
  mode (in-person/online/hybrid), location, meetingLink,
  startDateTime*, endDateTime*, isFree, price,
  capacity, maxAttendees, tags[], status,
  ticketTiers[{name, price, capacity, sold}],
  customFields[{label, type, required}],
  microsite{theme, slug, customDomain},
  polls[], feed[], engagement{}, reminders{},
  isActive, isRecurring, approvalStatus, timestamps
}

Order {
  _id, event* → Event, buyer* → User, organizationId → Organization,
  totalAmount*, quantity, stripeId, paymentId (unique sparse),
  paymentMethod, status (pending/completed/cancelled/refunded),
  timestamps
}

Organization {
  _id, name*, slug* (unique), description, owner* → User,
  logo, domain, website, plan (free/starter/pro/enterprise),
  settings{branding, defaults, limits, notifications},
  subscription{stripe fields}, usage{}, isActive, timestamps
}
```

### Supporting Models
```
Category { _id, name*, description, isActive }
Task { _id, title*, eventId → Event, assignedTo → User, status, priority, dueDate }
Review { _id, event → Event, user → User, rating, comment }
Bookmark { _id, user → User, event → Event } (compound unique)
Notification { _id, recipient → User, type, title, message, isRead }
Chat { _id, event → Event, sender → User, message, type }
CheckIn { _id, event → Event, attendee → User, ticketToken (unique), status }
Waitlist { _id, event → Event, user → User, position }
SupportTicket { _id, ticketNumber, user → User, subject*, description*, category, priority, status, messages[] }
FAQ { _id, question, answer, category, isPublished }
```

### Auth/Token Models
```
Token { _id, userId → User, token (unique), tokenType, isBlacklisted, expiresAt (TTL) }
PasswordReset { _id, email*, token (unique), hashedToken, otp, otpExpiresAt, otpVerified, expiresAt (TTL), isUsed }
```

### Analytics/Template Models
```
EventAnalytics { _id, eventId → Event (unique), views{total, bySource, byDevice}, registrations{}, engagement{} }
EventTemplate { _id, name, category, createdBy → User, isPublic, usageCount, rating }
AuditLog { _id, user → User, action, resource, details, organization, ip }
OrganizationMember { _id, organization → Org, user → User, role, status }
OrganizationInvite { _id, organization → Org, email, role, token (unique), status, expiresAt }
```

## 2. API Architecture (31 Route Files, 283+ Endpoints)

### Public Routes (no auth required)
```
GET  /health                    → System status + metrics + job queue stats
GET  /api/events                → List events (paginated, filterable)
GET  /api/events/:id            → Event detail
GET  /api/categories            → All categories
GET  /api/stats                 → Platform statistics
GET  /api/support/faqs          → Public FAQs
GET  /api/billing/plans         → Pricing plans
GET  /api/search/events?query=  → Full-text search
```

### Auth Routes
```
POST /api/users/register              → Create account (sends OTP)
POST /api/users/login                 → JWT tokens
POST /api/users/send-verification-otp → Resend account verification OTP
POST /api/users/verify-account-otp    → Verify account with 6-digit OTP
POST /api/users/forgot-password       → Send reset OTP (email + SMS)
POST /api/users/verify-reset-otp      → Verify reset OTP
POST /api/users/reset-password        → Set new password (OTP or token)
POST /api/users/refresh-token         → Refresh access token
POST /api/users/logout                → Blacklist token
```

### Protected Routes (JWT required)
```
GET    /api/users/me              → Current user
PUT    /api/users/:id             → Update profile
GET    /api/users/preferences     → Get preferences
POST   /api/events/create         → Create event
PUT    /api/events/:id            → Update event
DELETE /api/events/:id            → Delete event
GET    /api/events/my             → User's events
GET    /api/events/:id/attendees  → Event attendees
GET    /api/bookmarks             → User bookmarks
POST   /api/bookmarks/:eventId    → Toggle bookmark
GET    /api/notifications         → User notifications
GET    /api/tasks/event/:id       → Event tasks
POST   /api/tasks                 → Create task
GET    /api/organizations         → My organizations
POST   /api/organizations         → Create organization
GET    /api/support/tickets       → My tickets
POST   /api/support/tickets       → Create ticket
GET    /api/orders                → My orders
GET    /api/templates             → Event templates
GET    /api/waitlist/:eventId     → Event waitlist
GET    /api/calendar-export/:id   → iCal export
```

## 3. Service Layer (21 Services)

| Service | Responsibility |
|---------|---------------|
| `jobQueue.js` | Async background processing (email, SMS, push) with retry |
| `observability.js` | Sentry integration, metrics, request tracing |
| `emailService.js` | SMTP email delivery (6 template types) |
| `smsService.js` | Twilio SMS delivery |
| `cacheService.js` | Redis/node-cache dual-layer caching |
| `aiService.js` | Google Gemini (descriptions, tags, tasks, chatbot) |
| `searchService.js` | Full-text search across events |
| `eventAnalyticsService.js` | View/registration/engagement tracking (atomic `$inc`) |
| `notificationService.js` | In-app notification creation + delivery |
| `pushNotificationService.js` | Web Push via VAPID |
| `chatService.js` | Socket.IO real-time chat management |
| `qrService.js` | QR code generation for check-in |
| `calendarExportService.js` | iCal/ICS file generation |
| `recurringEventService.js` | Recurring event scheduling |
| `reminderService.js` | Scheduled event reminders |
| `eventTemplateService.js` | Template CRUD + cloning |
| `eventCollaborationService.js` | Team management for events |
| `integrationService.js` | Slack webhook, custom domain verification |
| `socialMediaService.js` | Social sharing utilities |
| `emailTemplateService.js` | HTML email template rendering |
| `cleanupService.js` | Scheduled cleanup of expired tokens/sessions |

## 4. Middleware Stack (in order)

```
1. sentryRequestHandler    → Sentry performance tracing
2. requestTracer           → X-Request-ID + latency tracking
3. requestId               → Unique request identification
4. helmet + xss            → Security headers
5. compression             → Gzip responses > 1KB
6. cors                    → Origin validation (Redis-backed in prod)
7. generalRateLimit        → 100 req/15min per IP (Redis store in prod)
8. session                 → Express session (MongoStore)
9. passport                → OAuth initialization
10. bodyParser             → JSON/URL-encoded parsing
11. requestTimeout(30s)    → Prevent hung requests
12. dosProtection          → Memory/CPU monitoring
13. [routes]               → Business logic
14. sentryErrorHandler     → Capture errors to Sentry
15. errorHandler           → Format error responses
```

## 5. Frontend Architecture

```
src/
├── Components/
│   ├── AI/              → AIDescriptionGenerator, AITaskGenerator, EventChatbot
│   ├── auth/            → Sign-in, RegisterForm (OTP-based)
│   ├── Events/          → EventDetails, EventCard, CreateEvent, MyEvents, etc.
│   ├── General/         → Dashboard, Settings, AllTasks, CheckoutButton, etc.
│   ├── Navbar/          → Header, MobileNav
│   ├── Sections/        → HeroSection
│   ├── UI/              → Button, Card, Input, Dialog, LoadingSpinner, Skeleton
│   └── [shared]         → Footer, Layout, ProtectedRoute, ErrorBoundary
├── Pages/               → Support, Pricing, ForgotPassword, VerifyAccount, etc.
├── contexts/            → AuthContext, ThemeContext, ToastContext, I18nContext
├── Utils/               → apiService, generatePDF (lazy), constants
└── services/            → pushNotificationService
```

### Code Splitting Strategy
- **Initial load:** ~600KB (index + react + router)
- **Lazy chunks:** jsPDF (372KB), html2canvas (194KB), MUI (222KB), pages
- **Technique:** React.lazy() + Suspense + dynamic import()

## 6. Authentication Flow

```
Registration:
  POST /register → {user, tokens, requiresVerification: true}
       ↓
  Redirect to /verify-account?email=X&phone=Y
       ↓
  OTP sent to email + phone (via job queue)
       ↓
  POST /verify-account-otp → account activated
       ↓
  Redirect to /sign-in

Login:
  POST /login → {user, accessToken (15min), refreshToken (7d)}
       ↓
  Store in localStorage
       ↓
  AuthContext: auto-refresh on 401 (with deduplication)

Password Reset:
  Step 1: POST /forgot-password (email/SMS choice) → OTP sent
  Step 2: POST /verify-reset-otp → OTP verified
  Step 3: POST /reset-password → password changed, all sessions killed
```

## 7. Real-time Architecture

```
Client (socket.io-client) ←──WebSocket──→ Server (Socket.IO)
                                              │
                                   ┌──────────┴──────────┐
                                   │   Redis Adapter     │ (when REDIS_URL set)
                                   │   (Pub/Sub)         │
                                   └──────────┬──────────┘
                                              │
                              ┌───────────────┼───────────────┐
                              │               │               │
                         Instance 1      Instance 2      Instance 3
```

Events: `join-room`, `leave-room`, `send-message`, `typing`, `notification`

## 8. Testing Strategy

| Layer | Tool | Files | Coverage |
|-------|------|-------|----------|
| Integration | Custom runner | `tests/integration-runner.js` | 43 assertions, 12 groups |
| Security | OWASP scanner | `tests/security-audit.js` | 16 checks (A01-A09) |
| Load | Custom k6-style | `tests/load-test.js` | 50 users, 30s, RPS/p95/errors |
| Unit | Jest + Supertest | `tests/*.test.js` (12 files) | Endpoint-level tests |
