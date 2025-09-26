# Documentation: app/database.py

## Overview
The `app/database.py` file defines the SQLAlchemy database setup and ORM models for the CSS Picker application. It configures the database engine, session management, and creates the data models for users and payments.

## File Structure

### Imports
```python
from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from .config import Config
```
- SQLAlchemy core components for database operations
- ORM components for defining models and relationships
- Import Config to potentially use database configuration

### Database Engine Configuration
```python
engine = create_engine(
    "sqlite:///app.db",
    connect_args={"check_same_thread": False}
)
```
- Creates SQLite database engine with database file `app.db`
- `check_same_thread=False` allows multiple threads to access the database (needed for Flask)

### Session and Base
```python
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```
- `SessionLocal`: Factory for creating database sessions with autocommit/autoflush disabled
- `Base`: Base class for all ORM models

## Database Models

### User Model
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    name = Column(String)
    plan = Column(String, default="free")
    premium_activated_at = Column(DateTime)
    stripe_customer_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    payments = relationship("Payment", back_populates="user")
```

**Field Explanations:**
- `id`: Internal user ID, primary key with index
- `google_id`: Unique Google account ID for authentication
- `email`: User email, unique and indexed
- `name`: User's name
- `plan`: Subscription plan ('free' or 'premium'), defaults to 'free'
- `premium_activated_at`: Timestamp when premium was activated
- `stripe_customer_id`: Associated Stripe customer ID
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp with automatic updates
- `payments`: Relationship to Payment model

### Payment Model
```python
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    stripe_payment_intent_id = Column(String, unique=True)
    amount = Column(Integer, nullable=False)
    status = Column(String, nullable=False)
    payment_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="payments")
```

**Field Explanations:**
- `id`: Internal payment ID, primary key with index
- `user_id`: Foreign key linking to User model
- `stripe_payment_intent_id`: Unique Stripe payment intent ID
- `amount`: Payment amount in cents
- `status`: Payment status (e.g., succeeded, failed)
- `payment_date`: Date of the payment
- `created_at`: Record creation timestamp
- `user`: Relationship to User model

## Key Features
- SQLite database configuration with proper thread handling
- SQLAlchemy ORM models for User and Payment entities
- Automatic timestamp management with `created_at` and `updated_at`
- Proper foreign key relationships between models
- Unique constraints and indexes for performance
- Integration with Google OAuth (google_id field)

## Database Relationships
- One-to-many relationship between User and Payment
- User can have multiple payments
- Payment belongs to one User

## Usage in Application
- Models are used in routes.py for database operations
- Sessions are created via SessionLocal in request handlers
- Engine is used in the application factory for table creation

## Notes
- Currently configured for SQLite, though Config imports suggest support for Turso
- Models support Google OAuth authentication flow
- Designed to support premium subscription model
- Includes payment tracking with Stripe integration