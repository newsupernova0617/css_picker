# Documentation: app/config.py

## Overview
The `app/config.py` file contains the configuration class for the CSS Picker Flask application. It defines all configuration variables and loads them from environment variables with appropriate defaults.

## File Structure

### Imports
```python
import os
from dotenv import load_dotenv

load_dotenv()
```
- Import the `os` module for accessing environment variables
- Import `load_dotenv` to load variables from .env file
- Load environment variables from .env file at startup

### Configuration Class
```python
class Config:
```
- A class containing all configuration settings as class attributes

### Configuration Variables

#### Flask Configuration
```python
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
```
- Used for session signing and CSRF protection
- Default value provided if not set in environment

#### Google OAuth Configuration
```python
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
```
- Client credentials for Google OAuth integration
- No defaults provided - must be set in environment

#### Stripe Configuration
```python
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_your_stripe_secret_key_here")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_your_webhook_secret")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "price_your_premium_price_id")
```
- Stripe API credentials and product ID
- Default values provided as examples

#### JWT Configuration
```python
JWT_SECRET=os.getenv("JWT_SECRET")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
```
- Secret key for JWT token signing
- Algorithm for JWT (default HS256)

#### Clerk Authentication Configuration (Commented Out)
```python
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_JWT_TEMPLATE_KEY = os.getenv("CLERK_JWT_TEMPLATE_KEY")
```
- Clerk authentication credentials (currently unused in code)

#### Database Configuration
```python
TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL", "sqlite:///app.db")
```
- Database connection URL
- Defaults to local SQLite database if not specified

#### Server Configuration
```python
PORT = int(os.getenv("PORT", 4242))
DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
```
- Port number for the server (default 4242)
- Debug mode setting from environment (default False)

## Key Features
- Centralized configuration management
- Environment variable loading with defaults
- Secure configuration with environment-based secrets
- Multiple configuration categories organized in one place
- Type conversion for numeric and boolean values

## Security Considerations
- Sensitive information loaded from environment variables
- Default values provided only for non-sensitive settings
- No hardcoded secrets in the configuration file

## Usage
- The Config class is used in the application factory (`app/__init__.py`)
- Values are accessed as class attributes (e.g., `Config.SECRET_KEY`)
- Environment variables can override defaults without code changes

## Notes
- The configuration supports both Turso and SQLite databases
- Some Clerk-related configurations exist but are not currently used in the codebase
- Debug mode is determined by the FLASK_DEBUG environment variable (true/false string)