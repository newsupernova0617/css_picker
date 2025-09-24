from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

from .config import Config

# DB 엔진
engine = create_engine(
    Config.TURSO_DATABASE_URL.replace("libsql://", "sqlite:///", 1),
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ======================
#  데이터베이스 모델
# ======================

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    clerk_user_id = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, nullable=False)
    plan = Column(String, default="free")
    premium_activated_at = Column(DateTime)
    stripe_customer_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    payments = relationship("Payment", back_populates="user")


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
