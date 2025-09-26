# CSS Picker Project - QWEN Context

## Project Overview

CSS Picker is a SaaS application that provides a Chrome extension for extracting CSS information from web pages. The project consists of a Flask backend that handles user authentication, payments, and provides APIs for CSS extraction using Playwright.

### Key Features
- **User Authentication** via Google OAuth integration
- **Stripe Payments** for premium subscriptions
- **CSS Extraction** using Playwright browser automation
- **Usage Tracking** and analytics
- **Screenshot Capture** functionality
- **Element Style Analysis** for specific CSS selectors

## Architecture

### Backend Stack
- **Framework**: Flask 3.0.0
- **Database**: SQLite (with potential for Turso Database)
- **Authentication**: Google OAuth
- **Payments**: Stripe integration
- **Browser Automation**: Playwright
- **Containerization**: Docker/Docker Compose
- **Deployment**: Designed for Railway deployment

### Project Structure
```
css_picker/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── auth.py              # Authentication handlers
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # SQLAlchemy models
│   │   ├── playwright_service.py # Playwright service class
│   │   └── routes.py            # API routes
│   ├── static/                  # Static assets
│   ├── templates/               # HTML templates
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   ├── Dockerfile              # Docker configuration
│   ├── docker-compose.yml       # Multi-container setup
│   ├── README.md               # Project documentation
│   ├── requirements.txt         # Python dependencies
│   ├── run.py                  # Application entry point
│   └── test_playwright.py       # Test scripts
```

## Development Setup

### Prerequisites
- Python 3.9+
- Docker (optional for containerization)
- Google OAuth credentials
- Stripe API keys
- Playwright (for CSS extraction)

### Local Setup
1. Navigate to the backend directory:
   ```bash
   cd css_picker/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Install Playwright and its dependencies:
   ```bash
   playwright install
   ```

5. Copy the environment template and configure:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

6. Run the application:
   ```bash
   python run.py
   ```
   The server will run on `http://localhost:4242`

### Environment Variables
Key environment variables that need to be configured:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for OAuth
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` for payments
- `JWT_SECRET` for token generation
- `SECRET_KEY` for Flask session management

## API Endpoints

### Authentication
- `GET /login` - Google OAuth login
- `GET /callback` - OAuth callback handler
- `POST /login_token` - Token-based login
- `GET /logout` - Logout endpoint

### User Management
- `GET /api/user/profile` - Get user profile and plan

### CSS Extraction APIs
- `POST /api/playwright/extract-css` - Extract CSS selectors from URL
- `POST /api/playwright/screenshot` - Capture page screenshot
- `POST /api/playwright/get-element-styles` - Get computed styles for element

### Webhooks
- `POST /webhooks/stripe` - Stripe webhook handler

## Database Models

### User Model
- `id`: Internal user ID
- `google_id`: Google account ID
- `email`: User email
- `name`: User name
- `plan`: User's subscription plan ('free' or 'premium')
- `premium_activated_at`: When premium was activated
- `stripe_customer_id`: Stripe customer ID

### Payment Model
- `id`: Internal payment ID
- `user_id`: Reference to user
- `stripe_payment_intent_id`: Stripe payment intent ID
- `amount`: Payment amount
- `status`: Payment status
- `payment_date`: Payment date

## Testing

Run the Playwright integration tests with:
```bash
python test_playwright.py
```

This tests CSS extraction, screenshot capture, and element style analysis functionality.

## Deployment

### Railway Deployment
The project is configured for Railway deployment:
1. Set up environment variables in Railway dashboard
2. Connect your GitHub repository
3. Railway will automatically build and deploy using the provided Dockerfile

### Manual Docker Deployment
```bash
docker-compose up --build
```

## Development Conventions

- Use environment variables for configuration
- Follow Flask best practices for routing and request handling
- Use SQLAlchemy ORM for database operations
- Implement proper error handling and logging
- Use JWT for token-based authentication
- Keep API routes modular using Flask Blueprints
- Implement proper session management for database connections

## Security Considerations

- CSRF protection through OAuth
- Secure token handling
- Environment variable protection
- Webhook signature verification
- SQL injection protection via parameterized queries

## Key Files

- `app/__init__.py` - Flask application factory
- `app/routes.py` - All API and web routes
- `app/database.py` - SQLAlchemy models
- `app/playwright_service.py` - Playwright browser automation service
- `app/config.py` - Configuration settings
- `run.py` - Application entry point
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Multi-container orchestration