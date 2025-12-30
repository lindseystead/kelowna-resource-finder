# Deployment

Production deployment guide.

**Prerequisites:** Node.js 18+, PostgreSQL 12+, environment variables set

```bash
npm run build
npm start
```

## Environment Variables

**Required:**

- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secure random string (32+ characters)

**Optional:**

- `OPENAI_API_KEY` - For AI chat
- `OPENAI_BASE_URL` - Custom OpenAI API base URL (optional)
- `SMTP_HOST` - SMTP server hostname (default: smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_SECURE` - Use SSL (true for 465, false for 587)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASSWORD` - SMTP password/app password
- `SMTP_FROM` - From address for emails
- `ALLOWED_ORIGINS` - Comma-separated CORS origins
- `SUPPORT_EMAIL` - Support email for contact forms (default: `support@lifesavertech.ca`)
- `BASE_URL` - Production URL for SEO and email links (optional)
- `PORT` - Server port (default: 5000)

## Hosting Options

**App hosting:**

- Railway (full-stack)
- Render (managed Node.js)
- Vercel (serverless)

**Database:**

- Supabase (PostgreSQL)
- Neon (serverless PostgreSQL)
- Railway (managed PostgreSQL)

## Database Setup

1. Create production database
2. Run schema migration:

   ```bash
   npm run db:push
   ```

3. Optional: Add performance indexes:

   ```bash
   psql $DATABASE_URL -f migrations/001_add_indexes.sql
   psql $DATABASE_URL -f migrations/002_add_constraints.sql
   ```

4. Create admin user:

   ```bash
   tsx script/create-admin.ts admin@example.com YourSecurePassword123!
   ```

## Performance

- Capacity: ~100-500 concurrent users
- Connection pooling: 20 connections
- Database indexes on common queries
- React Query caching
- Lazy loading for maps
- ESBuild for optimized bundles

**Limitations:**

- No pagination on list endpoints
- In-memory rate limiting (not for horizontal scaling)

## Security Checklist

- [ ] `SESSION_SECRET` is a secure random string (32+ characters)
- [ ] `ALLOWED_ORIGINS` is configured for production domain
- [ ] Database credentials are secure
- [ ] SMTP credentials are configured (if using email)
- [ ] HTTPS is enabled
- [ ] Environment variables are not committed to git
- [ ] Admin accounts use strong passwords

## Monitoring

Recommended monitoring:

- Application logs (structured logging via `server/utils/logger.ts`)
- Database connection pool status
- Error tracking (Sentry, Datadog, etc.)
- Uptime monitoring
