# CSS Picker Backend

Flask backend for the CSS Picker Chrome extension SaaS application.

## Features

- 🔐 **User Authentication** via Clerk integration
- 💳 **Stripe Payments** for premium subscriptions
- 📊 **Usage Tracking** and analytics
- 🗄️ **Turso Database** for data persistence
- 🔗 **RESTful API** for extension communication
- 📨 **Webhook Processing** for payment events

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Set Up Services

#### Turso Database
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create css-picker

# Get connection details
turso db show css-picker
turso db tokens create css-picker
```

#### Stripe Setup
1. Create Stripe account at stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Create product and price for premium plan
4. Set up webhook endpoint: `https://your-domain.com/webhooks/stripe`

#### Clerk Setup  
1. Create Clerk app at clerk.com
2. Configure Chrome extension application type
3. Get secret key from Dashboard → API Keys

### 4. Run Development Server

```bash
python app.py
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication Required
All API endpoints require `Authorization: Bearer <clerk_token>` header.

### User Management
- `GET /api/user/profile` - Get user profile and plan
- `GET /api/user/usage` - Get usage statistics

### Usage Tracking  
- `POST /api/usage/track` - Track feature usage

### Payments
- `POST /api/checkout/create` - Create checkout session
- `POST /api/billing/portal` - Create billing portal session

### Webhooks
- `POST /webhooks/stripe` - Stripe webhook handler

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Subscriptions Table
```sql  
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    stripe_subscription_id TEXT UNIQUE,
    status TEXT,
    current_period_end DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Usage Logs Table
```sql
CREATE TABLE usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    feature TEXT,
    usage_date DATE,
    count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Manual Deployment
1. Set up production server (Ubuntu/Debian)
2. Install Python 3.9+, pip, nginx
3. Configure environment variables
4. Set up SSL certificate
5. Configure nginx reverse proxy
6. Use gunicorn for production serving

### Environment Variables (Production)
- Set `FLASK_ENV=production`
- Use strong `SECRET_KEY`
- Configure production Stripe keys
- Set up production Turso database
- Configure proper CORS origins

## Monitoring

The backend includes:
- Health check endpoint (`/health`)
- Error logging
- Database connection monitoring
- Stripe webhook verification

## Security

- CORS properly configured
- Clerk token verification
- Stripe webhook signature verification
- SQL injection protection via parameterized queries
- Environment variable protection