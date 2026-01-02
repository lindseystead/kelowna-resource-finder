# Production Deployment Guide

Complete step-by-step guide for deploying Help Kelowna to Railway (backend) and Vercel (frontend).

---

## ✅ Pre-Deployment Checklist

- [x] Server runs locally (`npm run dev`)
- [x] Database connected and seeded
- [x] All environment variables configured
- [ ] Code committed to git
- [ ] Railway account set up
- [ ] Vercel account set up

---

## 📦 Step 1: Commit Your Changes

Before deploying, commit all your changes:

```bash
# Review what changed
git status

# Add all changes (except .env which is ignored)
git add .

# Commit
git commit -m "Fix database connection and prepare for production deployment"

# Push to GitHub
git push origin main
```

**Important:** Make sure `.env` is NOT committed (it's in `.gitignore`).

---

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `Kelowna-Aid` repository

### 2.2 Configure Railway Settings

Railway should auto-detect Node.js. Verify these settings:

**Settings → Deploy:**
- **Build Command:** `npm run build:backend`
- **Start Command:** `npm start`
- **Root Directory:** `/` (root of repo)

**Settings → Service:**
- **Port:** `5000` (Railway auto-detects this)

### 2.3 Add Environment Variables

Go to **Variables** tab and add these:

#### Required Variables:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:jKCKuN87coH8553n@db.zcoqanvzaxjcodjhefmu.supabase.co:5432/postgres
SESSION_SECRET=<generate-a-secure-random-32-plus-character-string>
PORT=5000
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Recommended Variables:

```bash
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
BASE_URL=https://your-railway-app.railway.app
SUPPORT_EMAIL=support@lifesavertech.ca
```

#### Optional (for features):

```bash
OPENAI_API_KEY=sk-... (if using AI chat)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Help Kelowna <your-email@gmail.com>"
```

### 2.4 Deploy

Railway will automatically:
1. Build your backend (`npm run build:backend`)
2. Start the server (`npm start`)
3. Expose it on a public URL

**Copy your Railway URL** (e.g., `https://help-kelowna-production.up.railway.app`)

---

## ▲ Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Import your `Kelowna-Aid` repository

### 3.2 Configure Vercel Settings

Vercel should auto-detect from `vercel.json`. Verify:

**Build & Development Settings:**
- **Framework Preset:** Other (or Vite if available)
- **Build Command:** `npm run build:frontend`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `/` (root of repo)

### 3.3 Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

#### Required:

```bash
VITE_API_URL=https://your-railway-app.railway.app
```

**Important:** Use your Railway backend URL from Step 2.4 (no trailing slash)

### 3.4 Deploy

Click **"Deploy"**. Vercel will:
1. Build your frontend (`npm run build:frontend`)
2. Deploy to a public URL

**Copy your Vercel URL** (e.g., `https://help-kelowna.vercel.app`)

---

## 🔗 Step 4: Connect Frontend to Backend

### 4.1 Update Railway CORS

Go back to Railway → **Variables** and update:

```bash
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

Replace `your-vercel-app.vercel.app` with your actual Vercel URL.

### 4.2 Redeploy Backend

Railway will auto-redeploy when you update variables, or manually trigger:
- Railway → **Deployments** → **Redeploy**

---

## ✅ Step 5: Verify Deployment

### Test Backend (Railway):

1. Visit: `https://your-railway-app.railway.app/api/categories`
2. Should return JSON with categories
3. Check Railway logs for any errors

### Test Frontend (Vercel):

1. Visit: `https://your-vercel-app.vercel.app`
2. Should load the app
3. Check browser console for errors
4. Test API calls (should connect to Railway backend)

---

## 🔧 Troubleshooting

### Backend Issues:

**"Crashed" or restart loop:**
- Check Railway logs
- Verify `DATABASE_URL` is correct
- Verify `SESSION_SECRET` is set (32+ chars)
- Check for migration code running at startup (shouldn't happen)

**Database connection errors:**
- Verify `DATABASE_URL` format
- Check Supabase allows connections from Railway IPs
- Try using Supabase connection pooler URL

**Port errors:**
- Railway auto-sets `PORT` - don't override unless needed
- Default is fine (5000)

### Frontend Issues:

**CORS errors:**
- Verify `ALLOWED_ORIGINS` in Railway includes your Vercel URL
- Check URL matches exactly (including `https://`)
- Redeploy backend after updating CORS

**API not connecting:**
- Verify `VITE_API_URL` in Vercel matches Railway URL
- Check Railway backend is running
- Check browser console for errors

**Build failures:**
- Check Vercel build logs
- Verify `npm run build:frontend` works locally
- Check for TypeScript errors

---

## 📋 Environment Variables Summary

### Railway (Backend):

```bash
# Required
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=<32+ char random string>
PORT=5000

# Recommended
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
BASE_URL=https://your-railway-app.railway.app
SUPPORT_EMAIL=support@lifesavertech.ca

# Optional
OPENAI_API_KEY=sk-...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASSWORD=...
```

### Vercel (Frontend):

```bash
# Required
VITE_API_URL=https://your-railway-app.railway.app
```

---

## 🎯 Quick Reference

**Railway:**
- Build: `npm run build:backend`
- Start: `npm start`
- Port: `5000` (auto-detected)

**Vercel:**
- Build: `npm run build:frontend`
- Output: `dist/`
- Framework: Vite

**Database:**
- Provider: Supabase
- Connection: Direct connection (port 5432)
- Migrations: Run manually with `npm run db:push` (locally)

---

## 🚨 Important Notes

1. **Never commit `.env` files** - They contain secrets
2. **Never run migrations at runtime** - Causes restart loops
3. **CORS must match exactly** - Include `https://` in `ALLOWED_ORIGINS`
4. **Railway URL changes** - Update `VITE_API_URL` in Vercel if Railway URL changes
5. **Database password** - Keep it secure, never commit to git

---

## 📞 Next Steps After Deployment

1. Test all features (search, categories, resources, chat if enabled)
2. Set up custom domains (optional)
3. Monitor Railway/Vercel logs for errors
4. Set up error tracking (Sentry, etc.) if needed
5. Configure backups for database

---

## 🎉 You're Done!

Once both deployments are live:
- Frontend: `https://your-vercel-app.vercel.app`
- Backend: `https://your-railway-app.railway.app`

Your app is now in production! 🚀

