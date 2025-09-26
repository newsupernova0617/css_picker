# Documentation: app/routes.py

## Overview
The `app/routes.py` file defines all the API endpoints and web routes for the CSS Picker Flask application. It includes authentication routes, user management, payment processing, and webhook handlers.

## File Structure

### Imports
```python
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, render_template, request, g, Flask, redirect, url_for, session
import stripe
import jwt
import requests
from . import oauth
from sqlalchemy.orm import Session
from sqlalchemy import func
from .database import User, Payment
from .config import Config
```
- Various Python standard library modules
- Flask components for routing and request handling
- Third-party libraries for payment processing, JWT, and HTTP requests
- Internal imports for OAuth, database models, and configuration

### Blueprint Setup
```python
bp = Blueprint("routes", __name__)
```
- Creates a Flask Blueprint for organizing routes

### Stripe Initialization
```python
stripe.api_key = Config.STRIPE_SECRET_KEY
```
- Sets Stripe API key from configuration

### JWT Configuration
```python
JWT_SECRET = Config.JWT_SECRET
JWT_ALG = Config.JWT_ALG
```
- Defines JWT secret and algorithm for token operations

### Google OAuth Configuration
```python
google = oauth.register(
    name="google",
    client_id=Config.GOOGLE_CLIENT_ID,
    client_secret=Config.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    api_base_url="https://openidconnect.googleapis.com/v1/",
    client_kwargs={"scope": "openid email profile"},
)
```
- Registers Google OAuth client with Flask-OAuthlib

## JWT Helper Functions
```python
def create_jwt(payload: dict, exp_minutes=60):
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=exp_minutes)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def verify_jwt(token: str):
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return decoded
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
```
- Functions to create and verify JSON Web Tokens
- Handles token expiration and invalid token errors

## Utility Functions
```python
def error_response(message: str, status_code: int = 500):
    logging.error(message)
    return jsonify({"error": message}), status_code
```
- Standardized error response format with logging

## Web Routes

### Main Page
```python
@bp.route("/")
def index():
    return render_template("index.html")
```
- Serves the main page template

### Health Check
```python
@bp.route("/health")
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})
```
- Simple health check endpoint

### Google OAuth Routes
```python
@bp.route("/login")
def login():
    redirect_uri = url_for("routes.auth_callback", _external=True)
    return google.authorize_redirect(redirect_uri)

@bp.route("/callback")
def auth_callback():
    # Handles Google OAuth callback
    # Creates/updates user in database
    # Sets session information
    # Redirects to main page
```
- Login route redirects to Google for authentication
- Callback handles the OAuth response and user creation

### Token-based Login
```python
@bp.route("/login_token", methods=["POST"])
def login_token():
    # Validates Google token
    # Creates/updates user in database
    # Returns JWT token
```
- Handles token-based login for frontend applications

### Logout
```python
@bp.route("/logout")
def logout():
    session.pop("user", None)
    return redirect("/")
```
- Clears user session and redirects to main page

### Legal Pages
```python
@bp.route("/terms-of-service")
def terms_of_service():
    return render_template("terms-of-service.html")

@bp.route("/privacy-policy")
def privacy_policy():
    return render_template("privacy-policy.html")
```
- Serves legal document templates

## API Routes

### User Profile
```python
@bp.route("/api/user/profile", methods=["GET"])
def user_profile():
    # Verifies JWT token
    # Returns user profile information
```
- Protected route that returns user information
- Requires valid JWT token in Authorization header

## Stripe Webhook
```python
@bp.route("/webhooks/stripe", methods=["POST"])
def stripe_webhook():
    # Verifies webhook signature
    # Handles checkout completion events
    # Updates user subscription status
```
- Processes Stripe webhook events
- Updates user's premium status when checkout completes

## Key Features
- OAuth authentication with Google
- JWT-based API authentication
- Stripe payment processing integration
- Webhook handling for payment events
- RESTful API design
- Proper error handling and logging
- Blueprint-based route organization

## Authentication Flow
- Web-based OAuth through `/login` and `/callback`
- Token-based authentication through `/login_token`
- JWT verification for API endpoints
- Session management for web interface

## Security Measures
- JWT token verification for API endpoints
- Stripe webhook signature verification
- Proper session management
- Environment-based configuration