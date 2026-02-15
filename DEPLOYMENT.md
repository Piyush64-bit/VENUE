# Deployment Guide

This guide will help you set up automated deployments for VENUE on popular cloud platforms.

## Quick Setup Checklist

- [ ] Choose deployment platforms (recommendations below)
- [ ] Set up MongoDB Atlas account (free tier available)
- [ ] Set up Redis Cloud account (free tier available)
- [ ] Configure GitHub Secrets
- [ ] Update CI/CD workflow with deployment credentials
- [ ] Update README badges with your repository URL
- [ ] Push to trigger first automated deployment

---

## Platform Recommendations (Free Tier Available)

### Option 1: Vercel + Railway (Recommended)

#### Frontend → Vercel
**Why**: Best-in-class DX, automatic CDN, zero-config deploys

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy Frontend:
```bash
cd venue-frontend
vercel login
vercel --prod
```

3. Set Environment Variables in Vercel Dashboard:
```bash
VITE_API_URL=https://your-backend-url.railway.app
VITE_SOCKET_URL=https://your-backend-url.railway.app
```

4. Get Vercel Token for CI/CD:
   - Go to: https://vercel.com/account/tokens
   - Create token
   - Add to GitHub Secrets as `VERCEL_TOKEN`

#### Backend → Railway
**Why**: Great free tier, Redis + MongoDB add-ons, Docker support

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and Initialize:
```bash
railway login
cd venue-backend
railway init
```

3. Add MongoDB and Redis:
```bash
railway add --plugin mongodb
railway add --plugin redis
```

4. Set Environment Variables:
```bash
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set JWT_EXPIRE=30d
# MongoDB and Redis URLs are auto-set by Railway plugins
```

5. Deploy:
```bash
railway up
```

6. Get Railway Token for CI/CD:
```bash
railway whoami
# Copy token and add to GitHub Secrets as RAILWAY_TOKEN
```

---

### Option 2: Render (All-in-One)

**Why**: Simple setup, everything in one platform

1. Connect GitHub Repository:
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo

2. Create Backend Service:
   - **Name**: venue-backend
   - **Root Directory**: `venue-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=5000
     MONGODB_URI=<from MongoDB Atlas>
     REDIS_URL=<from Redis Cloud>
     JWT_SECRET=<generate secure random string>
     ```

3. Create Frontend Service:
   - **Name**: venue-frontend
   - **Root Directory**: `venue-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://venue-backend.onrender.com
     ```

4. Get Render API Key:
   - https://dashboard.render.com/u/settings#api-keys
   - Add to GitHub Secrets as `RENDER_API_KEY`

---

### Option 3: Fly.io (Docker-Native)

**Why**: Great for Docker-first approach, global edge deployment

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy Backend
cd venue-backend
fly launch --name venue-backend
fly deploy

# Deploy Frontend
cd venue-frontend
fly launch --name venue-frontend
fly deploy
```

---

## Database Setup

### MongoDB Atlas (Recommended)

1. Create Free Cluster:
   - Go to https://www.mongodb.com/cloud/atlas
   - Create account → Build a Database → Free (M0)
   
2. Create Database User:
   - Database Access → Add New Database User
   - Set username/password
   
3. Whitelist IP Addresses:
   - Network Access → Add IP Address
   - Use `0.0.0.0/0` for development (allow from anywhere)
   - Production: Add specific IPs of your hosting platform
   
4. Get Connection String:
   - Connect → Connect Your Application
   - Copy connection string
   - Replace `<password>` with your database user password

### Redis Cloud (Recommended)

1. Create Free Database:
   - Go to https://redis.com/try-free/
   - Create account → New Database
   - Select Free tier (30MB)
   
2. Get Connection Details:
   - Configuration → General
   - Copy Public endpoint (host:port)
   - Copy Default user password
   
3. Format Redis URL:
```
redis://default:<password>@<host>:<port>
```

---

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Click `New repository secret`

### Required Secrets:

```bash
# For Vercel
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<found-in-vercel-project-settings>
VERCEL_PROJECT_ID=<found-in-vercel-project-settings>

# For Railway
RAILWAY_TOKEN=<your-railway-token>

# For Render
RENDER_API_KEY=<your-render-api-key>

# Database Credentials (for any platform)
MONGODB_URI=<your-mongodb-atlas-connection-string>
REDIS_URL=<your-redis-cloud-connection-string>
JWT_SECRET=<generate-secure-random-string>

# Optional: For notifications
SLACK_WEBHOOK_URL=<your-slack-webhook>
DISCORD_WEBHOOK_URL=<your-discord-webhook>
```

---

## Update CI/CD Workflow

After setting up secrets, update `.github/workflows/ci.yml`:

### For Vercel (Frontend):

```yaml
- name: Deploy Frontend to Staging
  working-directory: ./venue-frontend
  run: |
    npm i -g vercel
    vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
    vercel build --token=${{ secrets.VERCEL_TOKEN }}
    vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

### For Railway (Backend):

```yaml
- name: Deploy Backend to Staging
  run: |
    npm i -g @railway/cli
    railway link ${{ secrets.RAILWAY_PROJECT_ID }}
    railway up --service venue-backend --environment staging
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### For Render (Both):

```yaml
- name: Trigger Render Deploy
  run: |
    curl -X POST "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys" \
      -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
      -H "Content-Type: application/json"
```

---

## Update README Badges

Replace the placeholder URLs in `README.md`:

```markdown
[![CI Pipeline](https://github.com/YOUR_GITHUB_USERNAME/VENUE/workflows/CI%20Pipeline/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/VENUE/actions)
[![codecov](https://codecov.io/gh/YOUR_GITHUB_USERNAME/VENUE/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_GITHUB_USERNAME/VENUE)
```

Replace:
- `YOUR_GITHUB_USERNAME` → Your actual GitHub username
- `YOUR_USERNAME` (in CI workflow line 1) → Your GitHub username

---

## Environment-Specific URLs

Update these in `README.md` once deployed:

```markdown
| Environment | Frontend | Backend API |
|-------------|----------|-------------|
| **Production** | https://venue.vercel.app | https://venue-backend.railway.app |
| **Staging** | https://venue-staging.vercel.app | https://venue-staging.railway.app |
```

---

## Testing Deployment

After first deployment:

### Backend Health Check:
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-15T10:30:00.000Z",
  "mongodb": "connected",
  "redis": "connected"
}
```

### Frontend Check:
- Open browser → Your frontend URL
- Check browser console for errors
- Verify API connection (try login/signup)

---

## Monitoring & Logs

### Vercel:
- Dashboard: https://vercel.com/dashboard
- Real-time logs for each deployment
- Analytics and performance insights

### Railway:
- Dashboard: https://railway.app/dashboard
- Click project → Deployments → View logs
- Metrics tab for resource usage

### Render:
- Dashboard: https://dashboard.render.com
- Click service → Logs tab
- Metrics for requests/second, response times

---

## Custom Domain Setup (Optional)

### Vercel (Frontend):
1. Dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS records as shown

### Railway/Render (Backend):
1. Dashboard → Project/Service → Settings
2. Add custom domain
3. Update DNS records (A/CNAME)

### SSL/TLS:
All platforms automatically provision SSL certificates (Let's Encrypt)

---

## Troubleshooting

### Build Fails:
- Check GitHub Actions logs for specific error
- Verify all secrets are set correctly
- Ensure `package.json` scripts are correct

### Backend Can't Connect to MongoDB:
- Verify MongoDB Atlas whitelist includes 0.0.0.0/0
- Check connection string format
- Test connection locally first

### Frontend Can't Reach Backend:
- Verify CORS configuration in backend
- Check `VITE_API_URL` environment variable
- Open browser DevTools → Network tab

### Rate Limiting Issues:
- Check Redis connection
- Verify Redis URL format
- Ensure Redis is accessible from backend host

---

## Cost Estimates (Monthly)

**Free Tier** (Recommended for portfolio):
- Vercel: Free (100GB bandwidth)
- Railway: $5 credit/month (sufficient for demo)
- MongoDB Atlas: Free (512MB storage)
- Redis Cloud: Free (30MB storage)
- **Total: $0-5/month**

**Production** (Light traffic):
- Vercel Pro: $20
- Railway: ~$10-20
- MongoDB Atlas M10: $10
- Redis Cloud: $7
- **Total: ~$50-60/month**

---

## Next Steps

1. ✅ Choose your platform(s)
2. ✅ Set up database accounts
3. ✅ Configure GitHub Secrets
4. ✅ Update CI/CD workflow
5. ✅ Update README with your URLs and badges
6. ✅ Push to `develop` branch to test staging deployment
7. ✅ If successful, merge to `main` for production
8. ✅ Share your live project with recruiters! 🚀

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [Redis Cloud Setup](https://docs.redis.com/latest/rc/rc-quickstart/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Questions?** Open an issue or check the documentation links above.
