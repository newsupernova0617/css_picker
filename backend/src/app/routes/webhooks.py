"""
웹훅 처리 API 엔드포인트
"""
import stripe
from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest
from src.models import UserModel, PaymentModel
from src.database import DatabaseManager
from src.config import get_config

webhooks_bp = Blueprint('webhooks', __name__, url_prefix='/webhooks')

# Stripe 설정
config = get_config()()
stripe.api_key = config.STRIPE_SECRET_KEY

@webhooks_bp.route('/stripe', methods=['POST'])
def stripe_webhook():
    """Stripe 웹훅 처리"""
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        # 웹훅 이벤트 검증
        event = stripe.Webhook.construct_event(
            payload, sig_header, config.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        print("Invalid payload")
        raise BadRequest()
    except stripe.error.SignatureVerificationError:
        print("Invalid signature")
        raise BadRequest()
    
    # 이벤트 타입별 처리
    if event['type'] == 'checkout.session.completed':
        handle_checkout_completed(event['data']['object'])
    elif event['type'] == 'payment_intent.succeeded':
        handle_payment_succeeded(event['data']['object'])
    
    return jsonify({'status': 'success'}), 200

def handle_checkout_completed(session):
    """체크아웃 완료 처리"""
    try:
        db_manager = DatabaseManager()
        
        # 메타데이터에서 사용자 ID 추출
        user_id = session.metadata.get('user_id')
        
        if user_id:
            # 사용자 플랜을 프리미엄으로 업데이트
            stripe_customer_id = session.customer
            UserModel.update_plan(db_manager, user_id, 'premium', stripe_customer_id)
            
            # 결제 레코드 생성
            PaymentModel.create(
                db_manager,
                user_id,
                session.payment_intent,
                session.amount_total,
                'completed'
            )
            
            print(f"사용자 {user_id}가 프리미엄으로 업그레이드됨")
            
    except Exception as e:
        print(f"체크아웃 완료 처리 오류: {e}")

def handle_payment_succeeded(payment_intent):
    """결제 성공 처리"""
    try:
        print(f"결제 성공: {payment_intent['id']}")
        # 추가 처리 로직이 필요한 경우 여기에 구현
    except Exception as e:
        print(f"결제 성공 처리 오류: {e}")