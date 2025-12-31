# Help Kelowna

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![React](https://img.shields.io/badge/React-18.3-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)

A production-ready civic tech platform that centralizes 320+ fragmented community resources into a single, crisis-optimized search experience for Kelowna and West Kelowna, BC.

## 🎯 Problem & Solution

**The Problem:** When people need help—whether it's food support, shelter, mental health services, or crisis assistance—finding reliable, up-to-date information can be overwhelming. Existing resources are scattered across multiple websites, phone directories, and social media posts, making it difficult to find what you need quickly, especially during a crisis.

**The Solution:** Help Kelowna centralizes 320+ verified community resources in a single, searchable database. The application provides:

- **Fast, intelligent search** that prioritizes relevant results and filters out irrelevant content
- **Crisis-optimized UX** designed for users who may be experiencing stress or urgency
- **Multiple access methods**: category browsing, map view, AI chatbot assistance, and direct search
- **Community-driven updates** to keep information current
- **Mobile-first design** accessible on any device

This project was built by manually aggregating hundreds of disparate sources into a single source of truth—work typically done by municipalities, not individuals.

## 📸 Screenshots

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

## ✨ Features

### Core Functionality

- **320+ Resources**: Comprehensive database of local services including food banks, shelters, health services, legal aid, crisis support, and community resources
- **Intelligent Search**: Smart search algorithm that prioritizes exact matches, filters crisis resources appropriately, and handles partial matches
- **Category Browsing**: Organized by 15+ categories (Food Banks, Shelters, Health Services, Crisis Support, Legal Aid, etc.)
- **Interactive Map**: Leaflet-based map view showing resource locations with distance calculations
- **Resource Details**: Comprehensive pages with hours, contact info, eligibility requirements, and location data

### Advanced Features

- **AI Chatbot**: State-aware conversational assistant with intelligent resource matching:
  - **State Management**: Tracks intent, urgency, location, and permission to provide contextually appropriate responses
  - **One Question at a Time**: Structured conversation flow that asks permission first, then location, then provides resources
  - **Urgency Detection**: Prioritizes immediate options (24/7 fridges, meal programs) over planning resources (food banks)
  - **Age-Appropriate**: Filters out youth-only resources for adults and vice versa
  - **Crisis Support**: Special handling for suicidal/self-harm situations - always asks permission first before offering resources
  - **Live Shelter Data**: Directs users to City of Kelowna Shelter Dashboard for real-time availability
- **Favorites System**: Save frequently accessed resources for quick reference
- **Update Requests**: Community-driven system for submitting resource information updates
- **Admin Panel**: Full admin interface for managing resources, categories, and update requests
- **Authentication**: Secure session-based auth with CSRF protection
- **Email Notifications**: Automated email system for update requests and admin notifications

### User Experience

- **Crisis-Optimized UX**: Calm, minimal interface designed for users in distress
- **Mobile Responsive**: Fully responsive design optimized for all screen sizes
- **Accessibility**: WCAG-compliant components with proper ARIA labels and keyboard navigation
- **SEO Optimized**: Structured data, sitemap generation, and meta tag management
- **Performance**: Fast load times with optimized queries, caching, and code splitting

### Technical Features

- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Test Suite**: Comprehensive Vitest test coverage for critical paths
- **Production Ready**: Split deployment configuration (Vercel frontend, Railway/Render backend)
- **Security**: Rate limiting, Helmet.js security headers, CSRF protection, input validation
- **Database**: PostgreSQL with Drizzle ORM, optimized indexes, and migration system
- **Many-to-Many Categories**: Resources can belong to multiple categories (e.g., a youth shelter appears in both "shelters" and "youth" categories) using a normalized junction table design

## 🏗️ What Was Built

This is a full-stack application built from scratch with the following components:

### Frontend (React + TypeScript)

- **13 Page Components**: Home, Categories, Category Detail, Resource Detail, Search Results, Favorites, Map View, About, Disclaimer, Admin, Request Update, Featured, Official Resources, 404
- **20+ Reusable Components**: SearchBar, FilterBar, Navigation, Footer, AIChatWidget, ResourceCard, CategoryCard, CrisisHotlines, EmergencyFoodInfo, ShelterDashboard, and more
- **Custom Hooks**: use-resources, use-favorites, use-location, use-current-time, use-mobile
- **Utility Libraries**: Hours parsing (IANA timezone support), distance calculations (Haversine formula), API client, query client with React Query
- **UI Component Library**: Custom-built component system with Radix UI primitives and Tailwind CSS

### Backend (Express + TypeScript)

- **RESTful API**: 15+ endpoints for resources, categories, update requests, chat, authentication, and admin functions
- **Data Access Layer**: Repository pattern with Drizzle ORM for type-safe database queries
  - **Many-to-Many Categories**: Resources can belong to multiple categories via a normalized `resource_categories` junction table. This follows industry-standard database normalization practices and ensures resources appear in all relevant categories (e.g., a youth shelter appears in both "shelters" and "youth" categories). The design includes composite primary keys, CASCADE deletes for referential integrity, and optimized indexes on both foreign keys.
- **Authentication System**: Session-based auth with Passport.js, CSRF protection, and secure password hashing
- **AI Chat Integration**: Server-sent events (SSE) for streaming chat responses with OpenAI API
  - **Conversation State Machine**: Tracks intent (food, shelter, health, crisis, legal, youth), urgency (immediate, soon, general), permission status, and location
  - **Intelligent Resource Prioritization**: For urgent requests, prioritizes immediate options (24/7 access, hot meals) over appointment-based services
  - **Age Filtering**: Automatically filters youth-only resources for adult users
  - **Crisis Handling**: Special permission-first flow for suicidal/self-harm situations
  - **Live Data Integration**: References City of Kelowna Shelter Dashboard for real-time shelter availability
- **Email System**: Nodemailer integration with SMTP configuration for notifications
- **Security Middleware**: Rate limiting, Helmet.js, CORS configuration, input validation
- **SEO Routes**: Sitemap generation, structured data endpoints

### Database & Infrastructure

- **PostgreSQL Schema**: 7+ tables (resources, categories, resource_categories junction table, update_requests, users, conversations, messages) with proper relationships and many-to-many support
- **Database Migrations**: SQL migration system for indexes, constraints, and schema updates
- **Auto-Seeding**: Automatic database seeding with 320+ resources on first run
- **Performance Optimization**: Strategic indexes for search, category filtering, and location queries

### DevOps & Testing

- **Build System**: Separate build scripts for frontend (Vite) and backend (Esbuild)
- **Test Suite**: Vitest test coverage for storage layer, API routes, and utilities
- **Deployment Configuration**: Vercel config for frontend, Railway/Render setup for backend
- **Environment Management**: Comprehensive environment variable validation and configuration

### Documentation

- **API Documentation**: Complete endpoint reference with request/response schemas
- **Architecture Documentation**: System design, project structure, and design decisions
- **Deployment Guide**: Step-by-step instructions for free hosting (Supabase, Neon, Render, Railway, Vercel)

## 🛠️ Tech Stack

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

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## 🏃 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/lindseystead/kelowna-resource-finder.git
cd kelowna-resource-finder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Push database schema
npm run db:push
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`. Database seeds automatically on first run.

## 📁 Project Structure

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

## 📜 Available Scripts

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

## 🔧 Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secure random string (32+ chars)

### Optional

- `OPENAI_API_KEY` - AI chatbot feature
- `SMTP_HOST` - Email server host
- `SMTP_PORT` - Email server port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password
- `SUPPORT_EMAIL` - Contact email address

See `.env.example` for full configuration.

## 🧪 Testing

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

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[API Reference](docs/API.md)** - Complete API endpoint documentation with request/response schemas, authentication details, and rate limiting information
- **[Architecture](docs/ARCHITECTURE.md)** - System design overview, project structure, design decisions, and technical implementation details
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Step-by-step deployment instructions for free hosting options (Supabase, Neon, Render, Railway, Vercel) with cost comparisons and troubleshooting

## 🚢 Deployment

This project supports split deployment for optimal performance and cost:

- **Frontend**: Deploy to [Vercel](https://vercel.com) (free tier available)
- **Backend**: Deploy to [Railway](https://railway.app) or [Render](https://render.com) (free tiers available)
- **Database**: Use [Supabase](https://supabase.com) or [Neon](https://neon.tech) (free tiers available)

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed step-by-step instructions, environment variable configuration, and troubleshooting tips.

## 🔬 Technical Deep Dive

This section highlights key technical decisions and patterns that demonstrate production-ready architecture:

### Architecture Patterns

**Repository Pattern** - The `IStorage` interface abstracts database access, making the codebase testable and maintainable. All database queries go through the storage layer, not directly in routes.

**Shared Type System** - TypeScript types are shared between frontend and backend via the `shared/` directory, ensuring API contracts are type-safe end-to-end. Changes to schemas are caught at compile time.

**Error Handling Strategy** - Custom `AppError` class with centralized error middleware. The `asyncHandler` wrapper eliminates try-catch boilerplate while ensuring all async errors are caught.

### Security Implementation

**SQL Injection Prevention** - Drizzle ORM automatically parameterizes all queries. No raw SQL with user input. All queries use type-safe query builders.

**CSRF Protection** - Double-submit cookie pattern with timing-safe comparison (`crypto.timingSafeEqual`) to prevent timing attacks. Tokens are generated server-side and validated on state-changing requests.

**Input Validation** - Zod schemas validate all API inputs before processing. Invalid data is rejected with clear error messages.

**Rate Limiting** - `express-rate-limit` on authentication and update request endpoints to prevent abuse.

**Password Security** - bcrypt with 12 rounds for password hashing. Session-based auth with secure, httpOnly cookies.

### Complex Problem Solving

**Timezone Handling** - Business hours parsing uses the browser's IANA timezone database (`America/Vancouver`) with `Intl.DateTimeFormat` API. Automatically handles DST transitions (PST ↔ PDT) without manual date calculations.

**Search Algorithm** - Multi-tier search prioritization:

1. Exact name matches first
2. Partial name matches second  
3. Description matches third
4. Intelligent filtering of crisis resources based on search intent

**Distance Calculations** - Haversine formula for accurate geospatial distance calculations between user location and resources.

### Performance Optimizations

**Database Indexing** - Strategic indexes on frequently queried fields (`category_id`, `slug`, searchable text fields) for sub-100ms query times.

**Connection Pooling** - PostgreSQL connection pool (20 connections) prevents connection exhaustion under load.

**React Query Caching** - Server state management with automatic caching, background refetching, and optimistic updates.

**Code Splitting** - Lazy loading for heavy components (map view) to reduce initial bundle size.

### Code Quality

**Type Safety** - 100% TypeScript coverage. No `any` types. Strict mode enabled.

**Test Coverage** - Vitest test suite covering storage layer, API routes, and utility functions. Tests use real implementations (no excessive mocking).

**Documentation** - JSDoc comments explain architectural decisions, security considerations, and complex logic (see `server/storage.ts`, `server/auth/csrf.ts`, `client/src/lib/hours.ts`).

**Design System** - Documented design system (`client/src/lib/design-system.md`) with spacing scale, typography, and component guidelines for consistency.

### Deployment Architecture

**Split Deployment** - Frontend and backend deploy separately for optimal performance and cost. Frontend on CDN (Vercel), backend on compute (Railway/Render).

**Environment Configuration** - Comprehensive environment variable validation with clear error messages for missing required config.

**Build Optimization** - Esbuild for fast backend builds (< 5s), Vite for optimized frontend bundles with tree-shaking.

## 📊 Project Statistics

- **Lines of Code**: ~15,000+ (TypeScript/TSX)
- **Components**: 20+ reusable React components
- **Pages**: 13 full page components
- **API Endpoints**: 15+ RESTful endpoints
- **Database Tables**: 7 tables with relationships (including many-to-many junction table)
- **Resources**: 320+ community resources
- **Test Coverage**: Critical paths covered with Vitest
- **Build Time**: < 30 seconds for full production build

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👤 Author

**Lindsey** - Lifesaver Technology Services

---

<div align="center">
Made with ❤️ for the Kelowna and West Kelowna communities
</div>
