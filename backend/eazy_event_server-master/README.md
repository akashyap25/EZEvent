# Eazy Event Server

Backend API for the Eazy Event platform - a comprehensive multi-tenant event management system with real-time features, AI integration, and enterprise-grade security.

## Features

- **Authentication**: JWT (access + refresh tokens), OAuth (Google, GitHub, Facebook), account lockout, email verification
- **Event Management**: Full CRUD, recurring events, co-organizers, event collaboration
- **Multi-tenant Organizations**: Create orgs, invite members, role-based access (owner/admin/member)
- **Task Management**: Create, assign, comment, prioritize tasks per event
- **Calendar Export**: iCal, Google Calendar, Outlook, Yahoo integration
- **Orders & Payments**: Stripe checkout with webhook verification
- **Real-time Chat**: Socket.IO with JWT auth, event-scoped rooms, role badges
- **AI-Powered**: Google Gemini for description generation, task breakdown, event chatbot
- **Search**: Full-text search with filters (category, date, price, location, tags)
- **Reviews**: Rating system with verified attendee badges, moderation
- **Check-in**: QR code generation + scanning for event attendance
- **Notifications**: Email (SMTP), Push (Web Push), In-app, SMS (Twilio)
- **Bookmarks**: Save/unsave events for later
- **Waitlist**: Auto-queue when events reach capacity
- **Image Upload**: Cloudinary CDN integration with validation
- **Admin Dashboard**: User management, analytics, CSV export
- **Billing & Subscriptions**: Stripe Billing integration with plan-based limits
- **Event Modes**: In-person (venue/address), Online (meeting link), Hybrid
- **Integrations**: Slack webhook notifications, custom domain support
- **Event Templates**: Org-scoped reusable event templates
- **Engagement**: Live polls, Q&A, event feed/timeline, post-event surveys
- **Multi-tier Tickets**: VIP, General, Speaker with per-tier capacity & pricing
- **Custom Registration Fields**: Organizer-defined form fields (text, select, checkbox)
- **Branded Microsites**: Custom event landing pages with themes & countdown
- **Automated Reminders**: 24h + 1h before event, post-event survey emails
- **Networking**: Attendee matching for networking events
- **PWA**: Installable as mobile app with offline capability
- **Audit Log**: Track all org member/event changes with 90-day retention
- **API Versioning**: v1/v2 support with deprecation notices
- **Performance**: Redis caching, compression, query optimization, DB indexes

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 4
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis / node-cache
- **Authentication**: JWT + Passport.js (OAuth)
- **Real-time**: Socket.IO
- **Payments**: Stripe
- **AI**: Google Gemini API
- **Storage**: Cloudinary (image CDN)
- **Email**: Nodemailer (SMTP)
- **SMS**: Twilio
- **Docs**: Swagger/OpenAPI 3.0
- **Testing**: Jest + Supertest
- **Deployment**: Docker (multi-stage builds)

## Architecture

See [docs/HLD.md](docs/HLD.md) for High Level Design and [docs/LLD.md](docs/LLD.md) for Low Level Design.

## Quick Start

### Prerequisites

- Node.js (v18+)
- MongoDB instance (local or Atlas)
- Redis (optional, falls back to in-memory cache)

### Installation

```bash
# Clone the repository
git clone https://github.com/akashyap25/eazy_event_server.git
cd eazy_event_server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start the server
npm start
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=your_stripe_secret
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login user |
| POST | `/api/users/refresh-token` | Refresh access token |
| GET | `/api/users/me` | Get current user profile |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| GET | `/api/events/:id` | Get event by ID |
| POST | `/api/events/create` | Create new event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| POST | `/api/events/:id/register` | Register for event |
| POST | `/api/events/:id/unregister` | Unregister from event |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/event/:eventId` | Get tasks by event |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |

### Calendar Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar-export/:eventId/ical` | Export as iCal |
| GET | `/api/calendar-export/:eventId/google` | Google Calendar link |
| GET | `/api/calendar-export/:eventId/outlook` | Outlook link |

### Event Chat (Socket.IO + REST)
Real-time chat for events. Only event owner, collaborators, and registered attendees can join and send messages. Messages are persisted in MongoDB.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/events/:eventId/rooms` | Get chat rooms for event (auth required) |
| POST | `/api/chat/events/:eventId/rooms` | Find or create event chat room (auth required) |
| GET | `/api/chat/rooms/:roomId/messages` | Get message history (auth + participant required) |

### Bookmarks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookmarks/:eventId` | Toggle bookmark (add/remove) |
| GET | `/api/bookmarks` | Get user's bookmarked events |
| GET | `/api/bookmarks/check/:eventId` | Check if event is bookmarked |

### Waitlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/waitlist/:eventId` | Join event waitlist |
| DELETE | `/api/waitlist/:eventId` | Leave waitlist |
| GET | `/api/waitlist/:eventId/position` | Get position in queue |
| GET | `/api/waitlist/:eventId` | Get full waitlist (organizer only) |

### Image Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image (multipart/form-data) |
| DELETE | `/api/upload/:publicId` | Delete uploaded image |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard overview |
| GET | `/api/admin/users` | List users (search, filter) |
| PATCH | `/api/admin/users/:id/role` | Update user role |
| PATCH | `/api/admin/users/:id/status` | Activate/deactivate user |
| GET | `/api/admin/events/:id/export` | Export attendees CSV |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-description` | Generate event description |
| POST | `/api/ai/generate-tags` | Generate event tags |
| POST | `/api/ai/generate-tasks` | Generate task breakdown |
| POST | `/api/ai/answer-question` | Event chatbot Q&A |
| GET | `/api/ai/analyze-reviews/:eventId` | Sentiment analysis |

**Socket.IO:** Connect with `auth: { token: accessToken }`. Events: `join_room` (payload: `{ roomId, displayName }`), `send_message` (payload: `{ roomId, content }`). Messages include `senderEventRole`: `owner` \| `collaborator` \| `attendee`.

## Project Structure

```
eazy_event_server/
├── config/           # Configuration (security, passport, swagger, DB indexes)
├── controllers/      # Route handlers (business logic)
├── db/               # Database connection
├── docs/             # Architecture docs (HLD, LLD)
├── middlewares/      # Auth, validation, rate limiting, security
├── models/           # Mongoose schemas (15+ models)
├── routes/           # API routes (RESTful, versioned)
├── services/         # Business logic services (AI, email, cache, etc.)
├── socket/           # WebSocket handlers (chat)
├── scripts/          # DB seeding, utilities
├── tests/            # Jest test suites
├── utils/            # Shared utilities (logger, validation, errors)
├── .github/          # CI/CD workflows
├── app.js            # Express app entry
├── Dockerfile        # Multi-stage Docker build
├── docker-compose.yml # Full stack orchestration
└── package.json
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Security

This application implements enterprise-grade security:
- 7-layer middleware stack (Helmet, CORS, XSS, CSRF, Rate Limiting, Input Validation, DoS Protection)
- JWT with refresh token rotation and blacklisting
- Account lockout (5 failed attempts → 30min lock)
- Password policy (8+ chars, uppercase, lowercase, number, special char)
- Request tracing (X-Request-ID)
- Non-root Docker container
- Input sanitization on all endpoints

## Related

- **Frontend**: [Eazy_Event](https://github.com/akashyap25/Eazy_Event) - React frontend for this API

## License

MIT
