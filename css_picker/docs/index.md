# CSS Picker Project Documentation

Welcome to the documentation for the CSS Picker project. This documentation provides detailed information about each file in the project, helping developers understand the structure and functionality of the application.

## Project Overview

CSS Picker is a SaaS application that provides a Chrome extension for extracting CSS information from web pages. The backend is built with Flask and uses Playwright for browser automation to extract CSS selectors, capture screenshots, and analyze element styles.

## Documentation Contents

### Backend Files
1. [run.py](run_py.md) - Main application entry point
2. [requirements.txt](requirements_txt.md) - Python dependencies
3. [Dockerfile](Dockerfile.md) - Container configuration
4. [docker-compose.yml](docker_compose_yml.md) - Multi-container setup
5. [README.md](README_md.md) - Project documentation and setup guide
6. [.env and .env.example](env_files.md) - Environment configuration

### Application Module Files
1. [app/__init__.py](app_init_py.md) - Flask application factory
2. [app/config.py](app_config_py.md) - Application configuration
3. [app/database.py](app_database_py.md) - Database models and setup
4. [app/routes.py](app_routes_py.md) - API and web routes
5. [app/playwright_service.py](app_playwright_service_py.md) - Playwright service implementation

### Test Files
1. [test_playwright.py](test_playwright_py.md) - Integration tests for Playwright functionality

## Project Architecture

The CSS Picker backend consists of:
- Flask web framework for the API
- SQLAlchemy ORM for database operations
- Playwright for browser automation and CSS extraction
- Google OAuth for authentication
- Stripe for payment processing

## Getting Started

For setup instructions and development guidance, refer to the [README.md](README_md.md) documentation file.

## API Endpoints

The application provides several API endpoints for CSS extraction, user management, and payment processing. These are documented in the [routes.py](app_routes_py.md) documentation.