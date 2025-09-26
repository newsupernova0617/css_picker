# Documentation: README.md

## Overview
The `README.md` file serves as the main documentation for the CSS Picker backend, providing setup instructions, API documentation, and deployment information for developers and users.

## File Structure

### Title and Description
```markdown
# CSS Picker Backend

Flask backend for the CSS Picker Chrome extension SaaS application.
```
- Clear title identifying the project
- Brief description of the purpose as a SaaS backend for a Chrome extension

### Features Section
Lists and describes key features of the backend:
- 🔐 **User Authentication** via Clerk integration
- 💳 **Stripe Payments** for premium subscriptions
- 📊 **Usage Tracking** and analytics
- 🗄️ **Turso Database** for data persistence
- 🔗 **RESTful API** for extension communication
- 📨 **Webhook Processing** for payment events

### Quick Setup Section
Provides step-by-step setup instructions:
1. Install dependencies with `pip install -r requirements.txt`
2. Configure environment using `.env.example` as template
3. Set up external services (Turso, Stripe, Clerk)
4. Run development server with `python app.py`

### API Endpoints Section
Documents available API endpoints grouped by purpose:
- Authentication: All endpoints require `Authorization: Bearer <clerk_token>` header
- User Management: `/api/user/profile` and `/api/user/usage`
- Usage Tracking: `/api/usage/track`
- Payments: `/api/checkout/create` and `/api/billing/portal`
- Webhooks: `/webhooks/stripe`

### Database Schema Section
Describes three main database tables with SQL CREATE statements:
- Users Table: Contains user information and subscription details
- Subscriptions Table: Tracks user subscriptions
- Usage Logs Table: Records feature usage statistics

### Deployment Section
Covers deployment options:
- Railway deployment instructions
- Manual deployment steps
- Production environment variables

### Additional Sections
- Monitoring: Health check endpoints and logging
- Security: CORS, token verification, webhook validation, SQL injection prevention

## Key Features
- Comprehensive setup instructions for development
- Detailed API endpoint documentation
- Database schema definitions
- Deployment guidance for multiple platforms
- Security considerations and implementation details

## Usage Context
- Primary documentation for backend developers
- Setup guide for new contributors
- Reference for API consumers (Chrome extension)
- Deployment instructions for operators