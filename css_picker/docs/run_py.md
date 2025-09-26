# Documentation: run.py

## Overview
The `run.py` file serves as the main entry point for the CSS Picker Flask application. It initializes the Flask application, sets up database tables, and runs the application server.

## File Structure

### Imports
- `from app import create_app`: Imports the Flask application factory function from the app module
- `from app.database import Base, engine`: Imports SQLAlchemy base and engine for database operations

### Database Initialization
```python
Base.metadata.create_all(bind=engine)
```
- Creates all database tables if they don't already exist
- Uses the SQLAlchemy Base to create tables based on defined models

### Application Instance
```python
app = create_app()
```
- Creates the Flask application instance using the application factory pattern

### Main Execution Block
```python
if __name__ == "__main__":
    # Default port/option settings are loaded from environment variables
    import os
    port = int(os.getenv("PORT", 4242))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    app.run(host="0.0.0.0", port=port, debug=debug)
```
- Checks if the script is run directly (not imported)
- Gets port from environment variable (default 4242)
- Gets debug mode from environment variable (default False)
- Starts the Flask application server

## Key Features
- Uses Flask application factory pattern
- Automatically creates database tables on startup
- Configurable port and debug settings via environment variables
- Runs server on all available network interfaces (0.0.0.0)

## Environment Variables
- `PORT`: Port number for the Flask server (default: 4242)
- `FLASK_DEBUG`: Enable debug mode (default: false)