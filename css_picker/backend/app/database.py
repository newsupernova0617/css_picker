from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Integer, func, event, Index
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

from .config import Config

# DB 엔진
engine = create_engine(
    "sqlite:///app.db",  # 프로젝트 루트에 app.db 생성
    connect_args={"check_same_thread": False}
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Ensure SQLite connections enforce durability and FK rules."""
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
    finally:
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ======================
#  데이터베이스 모델
# ======================

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # 내부적으로 쓸 user_id (uuid/hash 등)
    google_id = Column(String, unique=True, index=True)  # 구글 계정의 고유 id
    email = Column(String, nullable=False, unique=True, index=True)
    name = Column(String)
    # picture = Column(String)  # 프로필 사진 URL
    plan = Column(String, default="free")
    premium_activated_at = Column(DateTime)
    stripe_customer_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    payments = relationship("Payment", back_populates="user")



class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (Index("ix_payments_user_id", "user_id"),)

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    stripe_payment_intent_id = Column(String, unique=True)
    amount = Column(Integer, nullable=False)
    status = Column(String, nullable=False)
    payment_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="payments")
