# Documentation: .env and .env.example

## Overview
The `.env` and `.env.example` files manage environment variables for the CSS Picker Flask application. The `.env` file contains actual configuration values (not committed to version control), while `.env.example` serves as a template showing required variables.

## File Structure

### .env.example
The template file showing all required environment variables with example values:

```
# Flask Configuration
SECRET_KEY=your-secret-key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_premium_price_id

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_ALG=HS256

# Clerk Authentication (currently commented out in code)
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_JWT_TEMPLATE_KEY=your-jwt-template-key

# Database (defaults to SQLite)
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
```

### .env
The actual configuration file (excluded from version control with .gitignore) that follows the same structure as .env.example but with real values instead of placeholders.

## Key Variables

### Flask Configuration
- `SECRET_KEY`: Used for signing sessions and CSRF protection
- `PORT`: Port number for the server (default 4242 in run.py)
- `FLASK_DEBUG`: Enables debug mode when set to "true"

### Google OAuth
- `GOOGLE_CLIENT_ID`: Client ID from Google Cloud Console for OAuth
- `GOOGLE_CLIENT_SECRET`: Client secret from Google Cloud Console for OAuth

### Stripe Payment Processing
- `STRIPE_SECRET_KEY`: Secret key from Stripe Dashboard for API access
- `STRIPE_WEBHOOK_SECRET`: Secret to verify webhook signatures from Stripe
- `STRIPE_PRICE_ID`: ID of the premium subscription product in Stripe

### JWT Authentication
- `JWT_SECRET`: Secret key for signing JSON Web Tokens
- `JWT_ALG`: Algorithm used for JWT (default HS256)

### Database Configuration
- `TURSO_DATABASE_URL`: Connection string for Turso database (defaults to local SQLite)

### Clerk (Currently Commented Out)
- `CLERK_SECRET_KEY`: Secret key for Clerk authentication service
- `CLERK_JWT_TEMPLATE_KEY`: JWT template key for Clerk

## Usage Instructions
1. Create a copy of `.env.example` named `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in actual values for each variable
3. The application reads these values using the `python-dotenv` library

## Security Considerations
- The `.env` file should never be committed to version control
- Use strong, unique values for all secret keys
- Keep webhook secrets private and secure
- Rotate secrets periodically

## Notes
- The application defaults to using SQLite if TURSO_DATABASE_URL is not set
- Some features (like Clerk authentication) are currently commented out in the code but variables remain in the template