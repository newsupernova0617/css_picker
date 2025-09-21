# Railway Deployment Guide for CSS Picker Backend

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **Turso Database**: Set up at https://turso.tech
3. **Clerk Authentication**: Set up at https://clerk.dev
4. **Stripe Account**: Set up at https://stripe.com

## Quick Deployment Steps

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
```

### 2. Deploy from GitHub

1. Connect your GitHub repository to Railway
2. Select the `backend` directory as the project root
3. Railway will automatically detect the Python project

### 3. Set Environment Variables

Go to your Railway project dashboard and add these environment variables:

```env
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-here

# Database (Turso)
DATABASE_URL=libsql://your-database-url.turso.io
AUTH_TOKEN=your-turso-auth-token

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=pk_live_your-clerk-publishable-key
CLERK_SECRET_KEY=sk_live_your-clerk-secret-key
CLERK_WEBHOOK_SECRET=whsec_your-clerk-webhook-secret

# Payment Processing (Stripe)
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# CORS Origins (update with your Railway domain)
CORS_ORIGINS=https://your-app.railway.app,chrome-extension://your-extension-id
```

### 4. Deploy

```bash
# Deploy using Railway CLI
railway up

# Or push to GitHub (if connected)
git push origin main
```

## Detailed Setup

### Database Setup (Turso)

1. Create Turso database:
```bash
turso db create css-picker-prod
turso db tokens create css-picker-prod
```

2. Get connection details:
```bash
turso db show css-picker-prod
```

3. Add to Railway environment variables:
   - `DATABASE_URL`: The database URL from Turso
   - `AUTH_TOKEN`: The auth token from Turso

### Authentication Setup (Clerk)

1. Create Clerk application at https://clerk.dev
2. Configure allowed origins to include your Railway domain
3. Get the keys from Clerk dashboard:
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`

### Payment Setup (Stripe)

1. Create Stripe account at https://stripe.com
2. Get API keys from Stripe dashboard:
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

## Configuration Files

The deployment uses these configuration files:

### `railway.toml`
```toml
[build]
builder = "nixpacks"
buildCommand = "pip install -r requirements-production.txt"

[deploy]
startCommand = "gunicorn --config deployment/gunicorn_railway_config.py deployment.production_app:application"
healthcheckPath = "/health"
```

### `Procfile`
```
web: gunicorn --config deployment/gunicorn_railway_config.py deployment.production_app:application
```

### `gunicorn_railway_config.py`
- Optimized for Railway's environment
- Uses environment PORT variable
- Configured for Railway's load balancer

## Testing Deployment

After deployment, test these endpoints:

```bash
# Health check
curl https://your-app.railway.app/health

# Detailed health check
curl https://your-app.railway.app/health/detailed

# API endpoint (should return 401 without auth)
curl https://your-app.railway.app/api/user/profile
```

## Common Issues & Solutions

### 1. Import Errors
- The `production_app.py` has fallback logging for Railway environment
- Make sure all dependencies are in `requirements-production.txt`

### 2. Database Connection
- Verify `DATABASE_URL` and `AUTH_TOKEN` are correct
- Check Turso database is accessible

### 3. CORS Issues
- Update `CORS_ORIGINS` to include your Railway domain
- Format: `https://your-app.railway.app,chrome-extension://extension-id`

### 4. Stripe Webhooks
- Update webhook endpoints in Stripe dashboard
- Use your Railway domain: `https://your-app.railway.app/api/webhooks/stripe`

### 5. Clerk Configuration
- Add Railway domain to allowed origins in Clerk dashboard
- Update redirect URLs if needed

## Monitoring

Railway provides built-in monitoring:

1. **Logs**: View in Railway dashboard
2. **Metrics**: CPU, memory, network usage
3. **Health Checks**: Automatic monitoring of `/health`

## Scaling

Railway auto-scales based on traffic:

- **CPU**: Scales up automatically
- **Memory**: Monitor usage in dashboard
- **Workers**: Configured in `gunicorn_railway_config.py`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `FLASK_ENV` | Flask environment | `production` |
| `SECRET_KEY` | Flask secret key | 32+ character random string |
| `DATABASE_URL` | Turso database URL | `libsql://db.turso.io` |
| `AUTH_TOKEN` | Turso auth token | `eyJ...` |
| `CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://app.railway.app` |

## Security Checklist

- [ ] All environment variables set
- [ ] Clerk domains configured
- [ ] Stripe webhooks secured
- [ ] CORS origins restricted
- [ ] Database access secured
- [ ] HTTPS enforced (Railway default)

## Support

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: Check Railway dashboard logs