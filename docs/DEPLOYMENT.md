# Deployment

Production deployment guide for Help Kelowna.

**Prerequisites:** Node.js 18+, PostgreSQL database (free options available), environment variables set

## Quick Start

```bash
npm run build:backend
npm start
```

## Free Database Setup

### Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Create new project → Choose region
3. Go to **Settings** → **Database** → Copy connection string (URI format)
4. Set as `DATABASE_URL` environment variable

**Free tier:**
- 500MB database storage
- 2GB bandwidth/month
- Unlimited API requests
- Auto-backups

### Neon (Alternative)

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Create project → Copy connection string
3. Set as `DATABASE_URL` environment variable

**Free tier:**
- 0.5GB storage
- Serverless (scales to zero)
- Branching support

### Setup Database Schema

```bash
DATABASE_URL="your-connection-string" npm run db:push
```

The app auto-seeds with 250+ resources on first API call if database is empty.

### Optional: Performance Indexes

```bash
psql $DATABASE_URL -f migrations/001_add_indexes.sql
psql $DATABASE_URL -f migrations/002_add_constraints.sql
```

### Create Admin User

```bash
DATABASE_URL="your-connection-string" tsx script/create-admin.ts admin@example.com YourSecurePassword123!
```

## Deploy Backend to Railway

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select `kelowna-resource-finder` repository
4. Railway auto-detects Node.js

### 2. Configure Environment Variables

In Railway project → **Variables**, add:

**Required:**
```
NODE_ENV=production
DATABASE_URL=<from-supabase-or-neon>
SESSION_SECRET=<generate-secure-random-32-plus-chars>
PORT=5000
```

**Optional:**
```
OPENAI_API_KEY=sk-... (for chatbot)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Help Kelowna <your-email@gmail.com>"
SUPPORT_EMAIL=support@lifesavertech.ca
BASE_URL=https://your-railway-app.railway.app
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configure Build Settings

Railway project → **Settings** → **Deploy**:

- **Build Command**: `npm run build:backend`
- **Start Command**: `npm start`
- **Root Directory**: `/`

### 4. Deploy

Railway auto-deploys on push to main branch. Or click **Deploy** in dashboard.

Copy your Railway URL: `https://your-app.railway.app`

## Deploy Frontend to Vercel

### 1. Create Vercel Project

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. **Add New** → **Project** → Import `kelowna-resource-finder`
3. Vercel auto-detects settings from `vercel.json`

### 2. Configure Environment Variables

Vercel project → **Settings** → **Environment Variables**:

**Required:**
```
VITE_API_URL=https://your-railway-app.railway.app
```

Use your Railway backend URL from step above.

### 3. Deploy

Vercel auto-deploys on push to main. Or click **Deploy**.

Copy your Vercel URL: `https://your-app.vercel.app`

### 4. Update CORS

Go back to Railway → **Variables** → Update:

```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

Redeploy Railway backend.

## Environment Variables Summary

### Railway (Backend)
```
NODE_ENV=production
DATABASE_URL=<supabase-or-neon-connection-string>
SESSION_SECRET=<secure-random-32-plus-chars>
PORT=5000
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
[Optional: OPENAI_API_KEY, SMTP_*, etc.]
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-railway-app.railway.app
```

## Cost Estimate

**All Free:**
- Supabase: Free tier (500MB)
- Railway: Free tier ($5 credit/month)
- Vercel: Free tier (100GB bandwidth)

**Total: $0/month** for small-medium apps

## Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check database allows external connections
- For Supabase: Use connection pooler URL if available

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes your Vercel URL
- Check URL matches exactly (including `https://`)
- Redeploy Railway after updating env vars

### Build Failures
- Check build logs in Railway/Vercel dashboard
- Verify Node.js 18+ is used
- Ensure all dependencies are in `package.json`

## Security Checklist

- [ ] `SESSION_SECRET` is secure random string (32+ chars)
- [ ] `ALLOWED_ORIGINS` configured for production domain
- [ ] Database credentials are secure
- [ ] HTTPS enabled (automatic on Railway/Vercel)
- [ ] Environment variables not committed to git
- [ ] Admin accounts use strong passwords

## Monitoring

- Railway: Built-in logs and metrics
- Vercel: Built-in analytics
- Database: Supabase/Neon dashboards
- Optional: Error tracking (Sentry, etc.)
