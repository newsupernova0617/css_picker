import hashlib
import logging
from datetime import datetime
from flask import Blueprint, jsonify, render_template, request, g
import stripe
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import  User, Payment
from .auth import verify_clerk_token
from .config import Config

# Blueprint 생성
bp = Blueprint("routes", __name__)

# Stripe 초기화
stripe.api_key = Config.STRIPE_SECRET_KEY


# ======================
#  유틸 함수
# ======================

def error_response(message: str, status_code: int = 500):
    logging.error(message)
    return jsonify({"error": message}), status_code


def get_or_create_user(db: Session, clerk_user_id: str, email: str) -> User:
    """기존 사용자 조회 또는 신규 생성"""
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if user:
        return user

    user_id = f"usr_{hashlib.md5(clerk_user_id.encode()).hexdigest()[:12]}"
    user = User(id=user_id, clerk_user_id=clerk_user_id, email=email, plan="free")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ======================
#  기본 페이지
# ======================

@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/health")
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})


# ======================
#  사용자 관리
# ======================

@bp.route("/api/user/profile", methods=["GET", "POST"])
@verify_clerk_token
def handle_user_profile():
    """사용자 프로필 GET/POST"""
    try:
        db: Session = g.db
        user = get_or_create_user(db, request.user_id, request.user_email)
        return jsonify({
            "id": user.id,
            "email": user.email,
            "plan": user.plan,
            "premium_activated_at": user.premium_activated_at,
            "created_at": user.created_at
        })
    except Exception as e:
        return error_response(f"사용자 프로필 오류: {e}", 500)


# ======================
#  Stripe 결제
# ======================

@bp.route("/api/checkout/create", methods=["POST"])
@verify_clerk_token
def create_checkout():
    """Stripe 체크아웃 세션 생성"""
    try:
        db: Session = g.db
        user = get_or_create_user(db, request.user_id, request.user_email)

        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={"user_id": user.id}
            )
            user.stripe_customer_id = customer.id
            db.commit()

        session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": Config.STRIPE_PRICE_ID, "quantity": 1}],
            mode="payment",
            success_url=request.host_url + "success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=request.host_url + "cancel",
            metadata={"user_id": user.id}
        )

        return jsonify({"checkout_url": session.url, "session_id": session.id})
    except Exception as e:
        return error_response(f"체크아웃 생성 오류: {e}", 500)


# ======================
#  Stripe 웹훅
# ======================

@bp.route("/webhooks/stripe", methods=["POST"])
def stripe_webhook():
    """Stripe 웹훅 처리"""
    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, Config.STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        return error_response(f"웹훅 검증 실패: {e}", 400)

    db: Session = g.db

    if event["type"] == "checkout.session.completed":
        handle_checkout_completed(db, event["data"]["object"])

    return "", 200


def handle_checkout_completed(db: Session, session: dict):
    """체크아웃 완료 처리"""
    try:
        user_id = session["metadata"]["user_id"]
        payment_intent_id = session["payment_intent"]

        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.plan = "premium"
            user.premium_activated_at = func.now()

            payment_id = f"pay_{hashlib.md5(payment_intent_id.encode()).hexdigest()[:12]}"
            payment = Payment(
                id=payment_id,
                user_id=user_id,
                stripe_payment_intent_id=payment_intent_id,
                amount=2900,
                status="succeeded",
                payment_date=func.now()
            )
            db.add(payment)
            db.commit()
            logging.info(f"사용자 {user_id} 프리미엄 업그레이드 완료")
    except Exception as e:
        logging.error(f"체크아웃 완료 처리 오류: {e}")
