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

## Deploy Backend

### Option 1: Render (100% Free - Recommended)

**Pros:** Truly free, no credit system, good for small apps  
**Cons:** Free tier sleeps after 15 min inactivity (wakes on request)

1. Go to [render.com](https://render.com) → Sign up (free)
2. **New** → **Web Service** → Connect GitHub repo
3. Select `kelowna-resource-finder` repository
4. Configure:
   - **Name**: `help-kelowna-api`
   - **Environment**: `Node`
   - **Build Command**: `npm run build:backend`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add environment variables (see below)
6. Click **Create Web Service**
7. Copy your Render URL: `https://help-kelowna-api.onrender.com`

**Note:** Free tier sleeps after 15 min, but wakes automatically on first request (may take 30-60 seconds).

### Option 2: Railway (Easier, Uses Credits)

**Pros:** Never sleeps, faster cold starts, easier setup  
**Cons:** $5 credit/month (usually enough for small apps, but not unlimited)

1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select `kelowna-resource-finder` repository
4. Railway auto-detects Node.js

5. Configure build settings:
   - **Build Command**: `npm run build:backend`
   - **Start Command**: `npm start`

6. Add environment variables (see below)
7. Railway auto-deploys on push to main
8. Copy your Railway URL: `https://your-app.railway.app`

### Backend Environment Variables

Add these in your hosting platform (Render or Railway):

**Required:**

```bash
NODE_ENV=production
DATABASE_URL=<from-supabase-or-neon>
SESSION_SECRET=<generate-secure-random-32-plus-chars>
PORT=5000
```

**Optional:**

```bash
OPENAI_API_KEY=sk-... (for chatbot)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Help Kelowna <your-email@gmail.com>"
SUPPORT_EMAIL=support@lifesavertech.ca
BASE_URL=https://your-backend-url
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

**Generate SESSION_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploy Frontend to Vercel

### 1. Create Vercel Project

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. **Add New** → **Project** → Import `kelowna-resource-finder`
3. Vercel auto-detects settings from `vercel.json`

### 2. Configure Environment Variables

Vercel project → **Settings** → **Environment Variables**:

**Required:**

```bash
VITE_API_URL=https://your-railway-app.railway.app
```

Use your Railway backend URL from step above.

**Optional:**

```bash
VITE_BASE_URL=https://helpkelowna.com
```

**Important**: 
- Frontend variables must start with `VITE_` to be accessible in the browser
- See `docs/ENV_VARIABLES.md` for complete environment variable guide

### 3. Deploy

Vercel auto-deploys on push to main. Or click **Deploy**.

Copy your Vercel URL: `https://your-app.vercel.app`

### 4. Update CORS

Go back to your backend (Render or Railway) → **Environment Variables** → Update:

```bash
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

Redeploy your backend service.

## Environment Variables Summary

### Backend (Render or Railway)

```bash
NODE_ENV=production
DATABASE_URL=<supabase-or-neon-connection-string>
SESSION_SECRET=<secure-random-32-plus-chars>
PORT=5000
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
[Optional: OPENAI_API_KEY, SMTP_*, etc.]
```

### Vercel (Frontend)

```bash
VITE_API_URL=https://your-backend-url.onrender.com
```

(Use your Render or Railway backend URL)

## Cost Comparison

### 100% Free Setup (Recommended)

- **Database**: Supabase (500MB free, unlimited requests)
- **Backend**: Render (free tier, sleeps after 15 min)
- **Frontend**: Vercel (free tier, 100GB bandwidth)
- **Total: $0/month** ✅

### Easier Setup (Small Cost)

- **Database**: Supabase (free)
- **Backend**: Railway ($5 credit/month, usually enough)
- **Frontend**: Vercel (free)
- **Total: $0/month** (if within Railway credits) or **~$5/month**

**Recommendation:** Use Render for backend if you want 100% free. Use Railway if you want faster response times and don't mind using credits.

## Troubleshooting

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Check database allows external connections
- For Supabase: Use connection pooler URL if available

### CORS Errors

- Verify `ALLOWED_ORIGINS` includes your Vercel URL
- Check URL matches exactly (including `https://`)
- Redeploy backend (Render/Railway) after updating env vars

### Build Failures

- Check build logs in Render/Railway/Vercel dashboard
- Verify Node.js 18+ is used
- Ensure all dependencies are in `package.json`

### Render Free Tier Sleep

- Free tier sleeps after 15 min inactivity
- First request after sleep takes 30-60 seconds to wake
- Consider Railway if you need instant responses (uses credits)

## Security Checklist

- [ ] `SESSION_SECRET` is secure random string (32+ chars)
- [ ] `ALLOWED_ORIGINS` configured for production domain
- [ ] Database credentials are secure
- [ ] HTTPS enabled (automatic on Render/Railway/Vercel)
- [ ] Environment variables not committed to git
- [ ] Admin accounts use strong passwords

## Monitoring

- **Render**: Built-in logs and metrics (free tier)
- **Railway**: Built-in logs and metrics (paid tier)
- **Vercel**: Built-in analytics (free tier)
- **Database**: Supabase/Neon dashboards
- **Optional**: Error tracking (Sentry, etc.)
