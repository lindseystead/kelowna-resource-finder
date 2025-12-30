# Help Kelowna

Community resource directory for Kelowna and West Kelowna, BC. Searchable database of 250+ local services including food banks, shelters, health services, crisis support, and community resources.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter
- **Backend**: Express, PostgreSQL, Drizzle ORM
- **Testing**: Vitest
- **Build**: Vite

## Getting Started

```bash
npm install
npm run db:push
npm run dev
```

Requires Node.js 18+ and PostgreSQL 12+. Database seeds automatically on first run.

## Project Structure

```
client/          # React frontend
server/          # Express API
  __tests__/     # Test suite
shared/          # Shared types
script/          # Utility scripts
migrations/      # Database migrations
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm start` - Production server
- `npm test` - Run tests
- `npm run check` - TypeScript check
- `npm run db:push` - Push schema changes

## Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secure random string (32+ chars)

**Optional:**
- `OPENAI_API_KEY` - AI chatbot feature
- `SMTP_*` - Email configuration
- `SUPPORT_EMAIL` - Contact email

See `.env.example` for full configuration.

## Documentation

- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)

## License

MIT
