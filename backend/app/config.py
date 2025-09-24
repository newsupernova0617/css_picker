import os
from dotenv import load_dotenv

# .env 파일 불러오기
load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")

    # Stripe
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_your_stripe_secret_key_here")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_your_webhook_secret")
    STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "price_your_premium_price_id")

    # Clerk
    CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

    # Turso (SQLite 호환)
    TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL", "sqlite:///app.db")

    # Flask Debug/Port 옵션 (run.py에서 사용 가능)
    PORT = int(os.getenv("PORT", 4242))
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
