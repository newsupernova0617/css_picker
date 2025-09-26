import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_your_stripe_secret_key_here")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_your_webhook_secret")
    STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "price_your_premium_price_id")
    JWT_SECRET=os.getenv("JWT_SECRET")
    JWT_ALG = os.getenv("JWT_ALG", "HS256")  # 기본 알고리즘
    CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
    CLERK_JWT_TEMPLATE_KEY = os.getenv("CLERK_JWT_TEMPLATE_KEY")

    TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL", "sqlite:///app.db")

    # Cache settings
    CACHE_TYPE = os.getenv('CACHE_TYPE', 'SimpleCache')
    CACHE_REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300 # Default timeout 5 minutes

    PORT = int(os.getenv("PORT", 4242))
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

