# Documentation: app/__init__.py

## Overview
The `app/__init__.py` file implements the Flask application factory pattern for the CSS Picker application. It creates and configures the Flask application instance with all necessary extensions and middleware.

## File Structure

### Imports
```python
import logging
from flask import Flask, g
from flask_cors import CORS
from .auth import oauth
from .config import Config
from .database import SessionLocal
from . import routes
```
- `logging`: For application logging
- `Flask, g`: Flask class and g object for request-scoped data
- `CORS`: Cross-Origin Resource Sharing configuration
- `oauth`: OAuth configuration from auth module
- `Config`: Application configuration class
- `SessionLocal`: Database session factory
- `routes`: Application routes blueprint

### Application Factory Function
```python
def create_app():
    """Flask 애플리케이션 팩토리"""
```
- Creates and configures Flask application instance
- Returns configured application for flexibility and testing

### Application Configuration
```python
app = Flask(__name__)
app.config.from_object(Config)
```
- Creates Flask instance
- Loads configuration from Config class

### CORS and OAuth Setup
```python
CORS(app)
oauth.init_app(app)
```
- Enables Cross-Origin Resource Sharing
- Initializes OAuth with Flask app

### Database Session Management
```python
@app.before_request
def create_session():
    g.db = SessionLocal()

@app.teardown_request
def remove_session(exception=None):
    db = getattr(g, "db", None)
    if db:
        try:
            if exception:
                db.rollback()
        except Exception as e:
            logging.warning(f"DB rollback 중 오류 발생: {e}")
        finally:
            try:
                db.close()
            except Exception as e:
                logging.warning(f"DB close 중 오류 발생: {e}")
```
- `before_request`: Creates a new database session for each request
- `teardown_request`: Properly closes the database session after each request
- Handles rollback in case of exceptions
- Includes error handling for both rollback and close operations

### Routes Registration
```python
routes.init_app(app)
```
- Registers all application routes with the Flask app
- Uses init_app pattern for route registration

## Key Features
- Implements the Flask application factory pattern
- Handles database session lifecycle automatically
- Configures CORS for cross-origin requests
- Properly manages database connections and cleanup
- Modular design with separate configuration and routing

## Database Session Management
- Each request gets its own database session
- Sessions are automatically closed after requests
- Rollback occurs if exceptions happen during requests
- Error handling in session management to prevent resource leaks

## Architecture Pattern
- Uses application factory for better testability and flexibility
- Separates configuration, database management, authentication, and routing
- Follows Flask best practices for large applications