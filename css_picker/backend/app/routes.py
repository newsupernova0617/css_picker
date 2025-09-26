# routes.py
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, render_template, request, g,Flask, redirect, url_for, session
import stripe
import jwt
import requests
from . import oauth, cache
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import  User, Payment
# clerk으로 주석처리했다: from .auth import verify_clerk_token
from .config import Config


# Blueprint 생성
bp = Blueprint("routes", __name__)

# Stripe 초기화
stripe.api_key = Config.STRIPE_SECRET_KEY

JWT_SECRET = Config.JWT_SECRET  # 실제 환경에서는 .env나 config에서 불러오기
JWT_ALG = Config.JWT_ALG

google = oauth.register(
    name="google",
    client_id=Config.GOOGLE_CLIENT_ID,
    client_secret=Config.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    api_base_url="https://openidconnect.googleapis.com/v1/",
    client_kwargs={"scope": "openid email profile"},
)



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

# auth.py 또는 init_app에서

# ======================
#  유틸 함수
# ======================

def error_response(message: str, status_code: int = 500):
    logging.error(message)
    return jsonify({"error": message}), status_code





# ======================
#  기본 페이지
# ======================

@bp.route("/")
@cache.cached()
def index():
    return render_template("index.html")

def init_app(app):
    app.register_blueprint(bp)
    

@bp.route("/health")
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@cache.memoize(timeout=60)  # 60초 동안 동일 토큰 결과 캐싱
def get_google_userinfo(token: str):
    resp = requests.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {token}"}
    )
    if resp.status_code != 200:
        return None
    return resp.json()

# 사용자 DB 조회 (캐싱 적용)
@cache.memoize(timeout=60)  # 60초 동안 캐싱
def load_user_from_db(user_id: str):
    db: Session = g.db
    return db.query(User).filter(User.id == user_id).first()

@bp.route("/login")
def login():
    redirect_uri = url_for("routes.auth_callback", _external=True)
    return google.authorize_redirect(redirect_uri)

# 구글 콜백 처리
@bp.route("/callback")
def auth_callback():
    token = google.authorize_access_token()
    access_token = token.get("access_token")  # access_token 꺼내기
    user_info = get_google_userinfo(access_token)

    db: Session = g.db
    google_id = user_info["sub"]    # 'id' 대신 'sub'이 고유 ID
    email = user_info["email"]

    # 기존 유저 확인
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = User(
            id=f"usr_{hashlib.md5(google_id.encode()).hexdigest()[:12]}",
            google_id=google_id,
            email=email,
            name=user_info.get("name"),
            # picture=user_info.get("picture")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    session["user"] = {"id": user.id, "email": user.email, "name": user.name}
    return redirect("/")

@bp.route("/login_token", methods=["POST"])
def login_token():
    data = request.get_json()
    access_token = data.get("token")
    if not access_token:
        return {"error": "No token"}, 400

    # 캐싱된 userinfo 호출
    user_info = get_google_userinfo(access_token)
    if not user_info:
        return {"error": "Invalid token"}, 401

    google_id = user_info["sub"]
    email = user_info["email"]

    db: Session = g.db
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = User(
            id=f"usr_{hashlib.md5(google_id.encode()).hexdigest()[:12]}",
            google_id=google_id,
            email=email,
            name=user_info.get("name"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # JWT 발급 (예시)
    jwt_token = create_jwt({"id": user.id, "email": user.email})

    return {
        "jwt": jwt_token,
        "user": {"id": user.id, "email": user.email, "name": user.name}
    }



# 로그아웃
@bp.route("/logout")
def logout():
    session.pop("user", None)
    return redirect("/")

@bp.route("/terms-of-service")
@cache.cached(timeout=3600)  # 1시간 캐싱
def terms_of_service():
    return render_template("terms-of-service.html")

@bp.route("/privacy-policy")
@cache.cached(timeout=3600)  # 1시간 캐싱
def privacy_policy():
    return render_template("privacy-policy.html")


# ======================
#  사용자 관리
# ======================

@bp.route("/api/user/profile", methods=["GET"])
def user_profile():
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        decoded = verify_jwt(token)
        if not decoded:
            return jsonify({"error": "invalid_token"}), 401

        user = load_user_from_db(decoded["id"])
        if not user:
            return jsonify({"error": "user_not_found"}), 404

        return jsonify({
            "id": user.id,
            "email": user.email,
            "plan": user.plan,
            "name": user.name,
        })

    return jsonify({"error": "not_authenticated"}), 401


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
