# Architecture

System design overview for Help Kelowna.

## Overview

Single Express server handles API and static files. React frontend talks to the API via REST. Simple monolithic setup - no microservices needed for this scale.

## Project Structure

```text
├── client/              # React frontend
│   ├── src/
│   │   ├── components/ # UI components (SearchBar, FilterBar, etc.)
│   │   ├── hooks/      # Custom hooks (use-resources, use-favorites, etc.)
│   │   ├── lib/        # Utilities (hours parsing, distance calc, config)
│   │   ├── pages/      # Page components (Home, CategoryDetail, etc.)
│   │   └── main.tsx
│   └── public/         # Static assets
│
├── server/             # Express backend
│   ├── __tests__/     # Test files (Vitest)
│   │   ├── storage.test.ts
│   │   ├── routes.test.ts
│   │   └── utils/     # Utility tests
│   ├── auth/          # Authentication (session, CSRF, middleware)
│   ├── chat/          # AI chat routes and storage
│   ├── middleware/    # Express middleware (error handling, security)
│   ├── utils/         # Utilities (email, logger)
│   ├── routes.ts      # Main API routes (resources, categories, updates)
│   ├── routes-seo.ts  # SEO routes (sitemap)
│   ├── static.ts      # Static file serving
│   ├── vite.ts        # Vite dev server integration
│   ├── db.ts          # Database connection & pool
│   ├── storage.ts     # Data access layer (repository pattern)
│   ├── config.ts      # Environment variable validation
│   └── constants.ts   # Application constants
│
├── shared/            # Shared types/schemas
│   ├── schema.ts     # Database schema (Drizzle ORM)
│   └── routes.ts     # API route contracts
│
├── script/            # Utility scripts
│   ├── build.ts      # Production build script
│   ├── create-admin.ts # Admin user creation
│   ├── reseed-database.ts # Database reseeding
│   ├── test-email.ts  # Email configuration testing
│   └── verify-critical-resources.ts # Resource verification
│
└── migrations/        # SQL migration files (indexes, constraints)
```

## Design Decisions

**Monolithic setup** - Single Express server. Keeps things simple.

**Shared types** - `shared/` folder for type safety between frontend/backend. API contracts in `shared/routes.ts`.

**Repository pattern** - `server/storage.ts` handles all database access. Makes testing easier.

**Session auth** - Express sessions with secure cookies. CSRF protection via double-submit cookies.

**Error handling** - React Error Boundaries on frontend, centralized middleware on backend. `asyncHandler` wrapper removes try-catch boilerplate.

**Logging** - `server/utils/logger.ts` for structured logs. Pretty-printed in dev, structured in prod.

**Constants** - All magic numbers in `server/constants.ts`. No hardcoded values scattered around.

**Testing** - Tests in `server/__tests__/` mirror the source structure. Vitest for unit/integration tests. Tests use actual implementations (no mocks unless necessary).

## Data Flow

1. **Frontend** → React Query hooks fetch from API
2. **API Routes** → Validate input (Zod), call storage layer
3. **Storage Layer** → Drizzle ORM queries database
4. **Database** → PostgreSQL with indexes for performance

## Security

- Input validation: Zod schemas on all endpoints
- SQL injection: Drizzle ORM parameterizes all queries
- CSRF: Double-submit cookie pattern
- Rate limiting: express-rate-limit on sensitive endpoints
- Password hashing: bcrypt with 12 rounds
- Security headers: Helmet.js

## Performance

- Database indexes on frequently queried fields
- React Query caching reduces API calls
- Connection pooling (20 connections)
- Lazy loading for heavy components (maps)
- ESBuild for fast production builds

## Database Schema

See `shared/schema.ts` for complete schema. Key tables:

- `categories` - Resource categories
- `resources` - Community service listings
- `users` - Admin/user accounts
- `update_requests` - Community-submitted changes
- `conversations` - AI chat conversations
- `messages` - Chat messages

### Chatbot State Management

The chatbot uses a state-first approach with conversation state tracking:

- **State Inference**: Analyzes message history to infer intent, urgency, permission status, and location
- **Action Determination**: Decides whether to ask permission, ask location, fetch resources, or present options
- **Resource Prioritization**: For urgent requests, prioritizes immediate options (24/7 access, hot meals) over appointment-based services
- **Age Filtering**: Filters out youth-only resources for adult users based on conversation context
- **Crisis Handling**: Special permission-first flow for suicidal/self-harm situations

See `server/chat/state.ts` for the state machine implementation.

## Future Improvements

- Pagination for list endpoints
- Redis for rate limiting (if scaling horizontally)
- Full-text search (PostgreSQL FTS)
- CDN for static assets
