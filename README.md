# Help Kelowna

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![React](https://img.shields.io/badge/React-18.3-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)

A civic tech platform that centralizes ~320 community resources into a single searchable directory for Kelowna and West Kelowna, BC.

## Problem & Solution

**The Problem:** When people need help—whether it's food support, shelter, mental health services, or crisis assistance—finding reliable, up-to-date information can be overwhelming. Existing resources are scattered across multiple websites, phone directories, and social media posts, making it difficult to find what you need quickly, especially during a crisis.

**The Solution:** Help Kelowna centralizes ~320 verified community resources in a single searchable database. Search, browse by category, view on a map, or use the chatbot to find what you need. Community can submit updates to keep information current.

This project was built by manually aggregating hundreds of disparate sources into a single source of truth.

## Screenshots

<div align="center">

![Homepage](screenshots/resource_homepage.png)
*Homepage with search and featured resources*

![Resource Categories](screenshots/resource_categories.png)
*Browse resources by category*

![Resource List](screenshots/resource_list.png)
*Detailed resource listings with filters*

![Resource Map](screenshots/resource_map.png)
*Interactive map view of resources*

![AI Chatbot](screenshots/resource_chatbot.png)
*AI-powered support chatbot*

![Request Update](screenshots/request_update.png)
*Submit resource update requests*

![About Page](screenshots/about_page.png)
*About page with project information*

</div>

## Features

### Core Functionality

Search, browse by category, or view resources on a map. Each resource page includes hours, contact info, and location. Search prioritizes exact matches and handles partial queries. Resources are organized into ~15 categories (food banks, shelters, health services, crisis support, legal aid, etc.).

### Advanced Features

AI chatbot helps users find resources through conversation. It tracks conversation state (intent, urgency, location) and asks one question at a time. For urgent needs like "hungry now", it prioritizes immediate options (24/7 fridges, meal programs) over appointment-based services. Filters youth-only resources for adults. Special handling for crisis situations - always asks permission first.

Users can save favorites, submit update requests, and admins can manage everything through the admin panel. Session-based auth with CSRF protection. Email notifications for update requests.


## What Was Built

### Frontend (React + TypeScript)

14 page components, ~22 reusable components (SearchBar, FilterBar, Navigation, AIChatWidget, ResourceCard, etc.)
- **Custom Hooks**: use-resources, use-favorites, use-location, use-current-time, use-mobile
- **Utility Libraries**: Hours parsing (IANA timezone support), distance calculations (Haversine formula), API client, query client with React Query
- **UI Component Library**: Custom-built component system with Radix UI primitives and Tailwind CSS

### Backend (Express + TypeScript)

RESTful API with ~23 endpoints. Repository pattern for data access. Many-to-many categories via junction table (composite primary key, CASCADE deletes).
- **Authentication System**: Session-based auth with Passport.js, CSRF protection, and secure password hashing
- **AI Chat Integration**: Server-sent events (SSE) for streaming chat responses with OpenAI API
  - **Conversation State Machine**: Tracks intent (food, shelter, health, crisis, legal, youth), urgency (immediate, soon, general), permission status, and location
  - Prioritizes immediate options (24/7 access, hot meals) over appointment-based services
  - Filters youth-only resources for adult users
  - Special permission-first flow for crisis situations
  - References City of Kelowna Shelter Dashboard for real-time availability
- **Email System**: Nodemailer integration with SMTP configuration for notifications
- **Security Middleware**: Rate limiting, Helmet.js, CORS configuration, input validation
- **SEO Routes**: Sitemap generation, structured data endpoints

### Database & Infrastructure

PostgreSQL with ~7 tables. SQL migrations for schema changes. Auto-seeds with ~320 resources on first run. Indexes on frequently queried fields.

### DevOps & Testing

- **Build System**: Separate build scripts for frontend (Vite) and backend (Esbuild)
- **Test Suite**: Vitest test coverage for storage layer, API routes, and utilities
- **Deployment Configuration**: Vercel config for frontend, Railway/Render setup for backend
- **Environment Management**: Environment variable validation

### Documentation

- **API Documentation**: Endpoint reference with request/response schemas
- **Architecture Documentation**: System design and design decisions
- **Deployment Guide**: Instructions for hosting (Supabase, Neon, Render, Railway, Vercel)

## Tech Stack

### Frontend

- **React 18.3** - UI library
- **TypeScript 5.6** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Wouter** - Lightweight routing
- **React Query (TanStack Query)** - Server state management
- **Leaflet** - Interactive maps
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations
- **Vite** - Build tool and dev server

### Backend

- **Express 4.21** - Web framework
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Type-safe database queries
- **Passport.js** - Authentication
- **OpenAI API** - AI chatbot
- **Nodemailer** - Email sending
- **Express Rate Limit** - API protection
- **Helmet.js** - Security headers
- **Esbuild** - Fast bundling

### Testing & Quality

- **Vitest** - Unit testing framework
- **TypeScript** - Static type checking
- **ESLint** - Code linting (implicit)

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Getting Started

### Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   - **Easiest**: Use free [Supabase](https://supabase.com) or [Neon](https://neon.tech) (see [SETUP.md](SETUP.md) for details)
   - **Local**: Install PostgreSQL and create a database
   - Copy connection string (format: `postgresql://user:password@host:port/database`)

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Add your database URL:
   ```env
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your-random-secret-here
   ```

4. **Set up database schema:**
   ```bash
   npm run db:push
   ```

5. **Run the app:**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5000`. Database seeds automatically on first run.

**For detailed setup instructions, see [SETUP.md](SETUP.md)**

## Project Structure

```text
├── client/              # React frontend
│   ├── src/
│   │   ├── components/ # 20+ UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utilities (hours, distance, API, config)
│   │   └── pages/      # 13 page components
│   └── public/         # Static assets
│
├── server/             # Express backend
│   ├── __tests__/     # Test suite (Vitest)
│   ├── auth/          # Authentication system
│   ├── chat/          # AI chat routes and storage
│   ├── middleware/    # Express middleware
│   ├── utils/         # Utilities (email, logger)
│   └── routes.ts      # API routes
│
├── shared/            # Shared types/schemas
│   ├── schema.ts     # Database schema (Drizzle ORM)
│   └── routes.ts     # API route contracts
│
├── script/            # Utility scripts
│   ├── build.ts      # Production build
│   ├── create-admin.ts
│   └── reseed-database.ts
│
├── migrations/        # Database migrations
├── docs/              # Documentation
│   ├── API.md        # API reference
│   ├── ARCHITECTURE.md # System design
│   └── DEPLOYMENT.md  # Deployment guide
└── screenshots/       # Screenshots for README
```

## Available Scripts

| Command | Description |
| :------ | :---------- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:frontend` | Build frontend only |
| `npm run build:backend` | Build backend only |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secure random string (32+ chars)

### Optional

- `OPENAI_API_KEY` - AI chatbot feature
- `OPENAI_BASE_URL` - OpenAI API base URL (for proxies)
- `BASE_URL` - Base URL for SEO and email links
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `SUPPORT_EMAIL` - Contact email address
- `SMTP_HOST` - Email server host
- `SMTP_PORT` - Email server port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password
- `SMTP_FROM` - Email from address

### Frontend Environment Variables (Vercel)

- `VITE_API_URL` - Backend API URL (e.g., `https://your-app.railway.app`)
- `VITE_BASE_URL` - Frontend base URL (e.g., `https://helpkelowna.com`)

See `.env.example` for full configuration.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test coverage includes:

- Storage layer (database queries)
- Search functionality with edge cases (empty queries, special characters, crisis filtering, relevance scoring)
- API routes (endpoints and responses)
- Utility functions (hours parsing, distance calculations, email validation)

## Documentation

- **[API Reference](docs/API.md)** - API endpoints with request/response schemas
- **[Architecture](docs/ARCHITECTURE.md)** - System design and design decisions
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deployment instructions

## Deployment

Split deployment: frontend on Vercel, backend on Railway/Render, database on Supabase/Neon.

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for details.

## Technical Decisions

Some tradeoffs worth noting:

**Search vs. Full-Text Search**: The search uses simple ILIKE queries with relevance scoring rather than PostgreSQL full-text search. This was a deliberate choice - FTS would be more powerful but requires maintaining search indexes, handling stop words, and dealing with stemming quirks. For ~320 resources, the simple approach is fast enough and easier to reason about. If we scale to thousands of resources, FTS would be worth the complexity.

### Architecture Patterns

**Repository Pattern** - `IStorage` interface abstracts database access. All queries go through the storage layer.

**Shared Type System** - TypeScript types shared between frontend and backend via `shared/` directory. Schema changes caught at compile time.

**Error Handling Strategy** - Custom `AppError` class with centralized error middleware. The `asyncHandler` wrapper eliminates try-catch boilerplate while ensuring all async errors are caught.

### Security Implementation

**SQL Injection Prevention** - Drizzle ORM automatically parameterizes all queries. No raw SQL with user input. All queries use type-safe query builders.

**CSRF Protection** - Double-submit cookie pattern with timing-safe comparison (`crypto.timingSafeEqual`) to prevent timing attacks. Tokens are generated server-side and validated on state-changing requests.

**Input Validation** - Zod schemas validate all API inputs before processing. Invalid data is rejected with clear error messages.

**Rate Limiting** - `express-rate-limit` on authentication and update request endpoints to prevent abuse.

**Password Security** - bcrypt with 12 rounds for password hashing. Session-based auth with secure, httpOnly cookies.

### Complex Problem Solving

**Timezone Handling** - Business hours parsing uses the browser's IANA timezone database (`America/Vancouver`) with `Intl.DateTimeFormat` API. Automatically handles DST transitions (PST ↔ PDT) without manual date calculations.

**Search Algorithm** - Prioritizes exact name matches, then partial matches, then description matches. Filters crisis resources based on search intent.

**Distance Calculations** - Haversine formula for accurate geospatial distance calculations between user location and resources.

### Performance Optimizations

**Database Indexing** - Indexes on frequently queried fields (`category_id`, `slug`, searchable text fields).

**Connection Pooling** - Default pool size (10 connections). Could increase for higher load, but 10 is sufficient for current scale.

**React Query Caching** - Server state management with automatic caching, background refetching, and optimistic updates.

**Code Splitting** - Lazy loading for heavy components (map view) to reduce initial bundle size.

### Code Quality

**Type Safety** - TypeScript coverage with strict mode enabled. Minimal `any` usage limited to error handling and type compatibility workarounds.

**Test Coverage** - Vitest test suite covering storage layer, API routes, and utility functions. Tests use real implementations (no excessive mocking).

**Documentation** - JSDoc comments explain architectural decisions, security considerations, and complex logic (see `server/storage.ts`, `server/auth/csrf.ts`, `client/src/lib/hours.ts`).

**Design System** - Documented design system (`docs/DESIGN_SYSTEM.md`) with spacing scale, typography, touch targets, and component guidelines for consistency.

### Deployment Architecture

**Split Deployment** - Frontend and backend deploy separately. Frontend on Vercel, backend on Railway/Render.

**Environment Configuration** - Environment variable validation with clear error messages.

**Build Optimization** - Esbuild for backend builds, Vite for frontend bundles.

## Project Stats

~15k lines of TypeScript/TSX, 14 pages, ~22 components, ~23 API endpoints, 7 database tables, ~320 resources. Critical paths tested. Build takes ~30 seconds.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Lindsey - Lifesaver Technology Services
