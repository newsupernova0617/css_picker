# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CSS Picker is a production-ready Chrome extension SaaS application for highlighting and extracting CSS from webpage elements. The project consists of:

- **Chrome Extension** (`css_picker/`): Manifest V3 extension with side panel UI
- **Flask Backend** (`backend/`): Python API with authentication, payments, and usage tracking
- **Brand Assets** (`brand-kit/`): SVG assets and branding materials

## Commands

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Server runs on `http://localhost:5000` (port 4242 for development)

### Testing
```bash
# Extension testing with Playwright
cd css_picker
npm test

# Backend testing (if test files exist)
cd backend
python -m pytest
```

### Development Setup
1. **Turso Database**: `turso db create css-picker && turso db tokens create css-picker`
2. **Environment**: Copy `.env.example` to `.env` and configure
3. **Chrome Extension**: Load unpacked from `css_picker/` directory

## Architecture

### Chrome Extension Architecture
- **Service Worker** (`background.js`): Handles extension lifecycle and API communication
- **Content Scripts** (`content.js`): Injected into web pages for element selection
- **Side Panel** (`sidepanel.html/js/css`): Main UI with plan management and CSS extraction
- **Authentication** (`clerk-config.js`, `auth-content.js`): Clerk integration for user management
- **Plan Management** (`plan-manager.js`): Premium feature gating and usage tracking

### Backend Architecture (Factory Pattern)
- **Application Factory** (`app.py`): Main Flask app with modular blueprint registration
- **API Blueprints**:
  - `api/user.py`: User profile and subscription management
  - `api/checkout.py`: Stripe payment processing
  - `api/webhooks.py`: Stripe webhook handling
  - `api/session.py`: Session management
- **Authentication** (`auth/clerk.py`): Clerk token verification middleware
- **Database** (`database/connection.py`): Turso SQLite cloud database manager

### Authentication Flow
1. Extension uses Clerk for user authentication
2. JWT tokens passed to Flask backend via Authorization header
3. Backend validates tokens and manages user sessions
4. Plan information synced between Clerk and Turso database

### Payment Integration
- **Stripe Checkout**: Premium subscription payments
- **Webhooks**: Real-time subscription status updates
- **Usage Tracking**: Feature usage limits for free/premium tiers

## Key Technical Details

### Security Considerations
- **CSP**: Strict content security policy in manifest.json
- **CORS**: Backend configured for extension and domain origins
- **Token Validation**: All API endpoints require valid Clerk JWT
- **Webhook Verification**: Stripe signatures validated for security

### Database Schema
- **users**: Clerk user data with plan information
- **subscriptions**: Stripe subscription tracking
- **usage_logs**: Feature usage analytics

### Development vs Production
- **URLs**: Localhost for development, production domains for deployment
- **Environment**: `FLASK_ENV` controls debug/production modes
- **Database**: Local SQLite for dev, Turso cloud for production

## File Structure Patterns

### Extension Files
- `manifest.json`: Extension configuration with permissions and CSP
- `*.js` files: Vanilla JavaScript (no build process required)
- `lib/`: Third-party libraries (html2canvas, jszip, bootstrap)
- `assets/`: Icons and images for different sizes

### Backend Files
- `api/`: RESTful API endpoints organized by feature
- `auth/`: Authentication middleware and utilities
- `database/`: Database connection and management
- `config.py`: Environment-specific configuration
- `templates/`: HTML templates for web pages

### Documentation
- `TODO.md`: Project status and deployment readiness
- `PRODUCTION_DEPLOYMENT.md`: Deployment procedures and checklists
- `SECURITY_REVIEW.md`: Security assessment guidelines
- `docs/`: Additional setup and legal documentation

## Important Notes

- Project is **production-ready** as of September 2025
- All major development phases completed (authentication, debugging, QA, UX polish)
- Extension uses Manifest V3 with modern security practices
- Backend implements enterprise-grade error handling and monitoring
- No build process required for extension (vanilla JavaScript)
- Playwright testing framework configured for browser automation