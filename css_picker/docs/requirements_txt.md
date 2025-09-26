# Documentation: requirements.txt

## Overview
The `requirements.txt` file lists all Python dependencies required for the CSS Picker Flask application. It specifies the exact versions of each package to ensure consistent environments across development, testing, and production.

## Dependencies Listed

### Core Web Framework
- `Flask==3.0.0`: The main web framework used for building the application
  - Version 3.0.0 is specified for stability and feature set

### CORS Support
- `Flask-CORS==4.0.0`: Enables Cross-Origin Resource Sharing (CORS) for Flask applications
  - Allows web applications from different domains to access the API

### Payment Processing
- `stripe==7.8.0`: Official Stripe library for payment processing
  - Used for handling premium subscriptions and payments

### Database Operations
- `libsql==0.1.11`: Python client for Turso database (SQLite-compatible)
  - Alternative database option, though project also uses SQLite
- `SQLAlchemy==2.0.23`: Python SQL toolkit and Object Relational Mapper (ORM)

### Environment Configuration
- `python-dotenv==1.0.0`: Reads key-value pairs from .env files and sets them as environment variables
  - Used for loading configuration from .env file

### Production Server
- `gunicorn==21.2.0`: Python WSGI HTTP Server for UNIX
  - Used in production deployments (particularly on Railway)

### HTTP Requests
- `requests==2.31.0`: HTTP library for making requests
  - Used for external API calls (e.g., Google OAuth)

### Security & Authentication
- `PyJWT==2.8.0`: JSON Web Token implementation for authentication
  - Used for creating and verifying JWT tokens

## Usage
- Install all dependencies: `pip install -r requirements.txt`
- Used during deployment and development environment setup
- Version pinning ensures consistent behavior across environments

## Notes
- The file includes comments indicating this is for the CSS Picker SaaS backend
- Dependencies support Google OAuth, Stripe payments, database operations, and production deployment