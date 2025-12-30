# Split Deployment: Frontend (Vercel) + Backend (Railway)

This guide covers deploying the frontend to Vercel and the backend to Railway.

## Architecture

- **Frontend**: React app → Vercel (static hosting)
- **Backend**: Express API → Railway (Node.js runtime)
- **Database**: PostgreSQL → Railway (managed database)

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `kelowna-resource-finder` repository
4. Railway will auto-detect it's a Node.js project

### 1.2 Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will create a PostgreSQL instance
4. Copy the `DATABASE_URL` from the database service

### 1.3 Configure Environment Variables

In Railway project settings → Variables, add:

**Required:**
```
NODE_ENV=production
DATABASE_URL=<from-postgres-service>
SESSION_SECRET=<generate-secure-random-32-plus-chars>
PORT=5000
```

**Optional:**
```
OPENAI_API_KEY=sk-... (for chatbot)
OPENAI_BASE_URL=https://api.openai.com/v1 (optional)
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

### 1.4 Configure Build Settings

In Railway project settings → Deploy:

- **Build Command**: `npm run build:backend`
- **Start Command**: `npm start`
- **Root Directory**: `/` (root)

### 1.5 Deploy

1. Railway will automatically deploy on push to main branch
2. Or click "Deploy" in the dashboard
3. Wait for deployment to complete
4. Copy your Railway app URL (e.g., `https://your-app.railway.app`)

### 1.6 Setup Database

1. In Railway, open the PostgreSQL service
2. Click "Query" tab
3. Or use Railway CLI:
   ```bash
   railway run npm run db:push
   ```

The app will auto-seed on first API call if database is empty.

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect settings from `vercel.json`

### 2.2 Configure Environment Variables

In Vercel project settings → Environment Variables, add:

**Required:**
```
VITE_API_URL=https://your-railway-app.railway.app
```

**Important**: Use your Railway backend URL (from Step 1.5)

### 2.3 Deploy

1. Vercel will automatically deploy on push to main branch
2. Or click "Deploy" in the dashboard
3. Wait for deployment to complete
4. Copy your Vercel app URL (e.g., `https://your-app.vercel.app`)

### 2.4 Update CORS Settings

Go back to Railway backend environment variables and update:

```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

Redeploy the backend so CORS allows your Vercel frontend.

## Step 3: Verify Deployment

### Test Frontend
- Visit your Vercel URL
- Check browser console for errors
- Verify API calls are going to Railway backend

### Test Backend
- Visit `https://your-railway-app.railway.app/api/categories`
- Should return JSON data
- Check Railway logs for errors

### Test Integration
- Search for resources on frontend
- Submit an update request
- Test the chatbot (if OpenAI key is configured)

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Verify `ALLOWED_ORIGINS` in Railway includes your Vercel URL
2. Check that the URL matches exactly (including `https://`)
3. Redeploy Railway backend after updating env vars

### API Not Found (404)

- Verify `VITE_API_URL` in Vercel is correct
- Check that Railway backend is running
- Verify the URL doesn't have a trailing slash

### Database Connection Errors

- Verify `DATABASE_URL` in Railway is correct
- Check Railway PostgreSQL service is running
- Run `npm run db:push` via Railway CLI if schema isn't set up

### Build Failures

**Vercel:**
- Check build logs in Vercel dashboard
- Verify `npm run build:frontend` works locally
- Ensure Node.js version is 18+

**Railway:**
- Check build logs in Railway dashboard
- Verify `npm run build:backend` works locally
- Check that all dependencies are in `package.json`

## Environment Variables Summary

### Railway (Backend)
```
NODE_ENV=production
DATABASE_URL=<railway-postgres-url>
SESSION_SECRET=<secure-random-string>
PORT=5000
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
[Optional: OPENAI_API_KEY, SMTP_*, etc.]
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-railway-app.railway.app
```

## Cost Estimate

**Railway:**
- Free tier: $5 credit/month
- Pro: $20/month (if you exceed free tier)
- PostgreSQL: Included

**Vercel:**
- Free tier: 100GB bandwidth, unlimited requests
- Pro: $20/month (if you exceed free tier)

**Total: Free** (for small apps) or **~$40/month** (if you need Pro on both)

## Next Steps

1. Set up custom domains (optional)
2. Configure monitoring (Sentry, etc.)
3. Set up CI/CD (already works with GitHub)
4. Add error tracking
5. Configure backups for database

