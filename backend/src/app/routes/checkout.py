"""
결제 관련 API 엔드포인트
"""
import stripe
from flask import Blueprint, request, jsonify
from src.app.middleware.auth import clerk_token_required
from src.models import UserModel
from src.database import DatabaseManager
from src.config import get_config

checkout_bp = Blueprint('checkout', __name__, url_prefix='/api')

# Stripe 설정
config = get_config()()
stripe.api_key = config.STRIPE_SECRET_KEY

@checkout_bp.route('/checkout/create', methods=['POST'])
@clerk_token_required
def create_checkout():
    """Stripe 체크아웃 세션 생성"""
    try:
        db_manager = DatabaseManager()
        
        # 사용자 정보 확인
        user = UserModel.get_by_clerk_id(db_manager, request.clerk_user_id)
        
        if not user:
            email = request.clerk_payload.get('email', '')
            user = UserModel.get_or_create(db_manager, request.clerk_user_id, email)
        
        # 이미 프리미엄인지 확인
        if user['plan'] == 'premium':
            return jsonify({'error': '이미 프리미엄 플랜입니다'}), 400
        
        # Stripe 체크아웃 세션 생성
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': config.STRIPE_PRICE_ID,
                'quantity': 1
            }],
            mode='payment',
            success_url='https://csspickerpro.com/success?session_id={CHECKOUT_SESSION_ID}',#후에 변경필요!
            cancel_url='https://csspickerpro.com/cancel',#후에 변경필요!
            metadata={
                'user_id': user['id'],
                'clerk_user_id': request.clerk_user_id
            }
        )
        
        return jsonify({
            'success': True,
            'checkout_url': session.url
        }), 200
        
    except Exception as e:
        print(f"체크아웃 생성 오류: {e}")
        return jsonify({'error': str(e)}), 500

@checkout_bp.route('/billing/portal', methods=['POST'])
@clerk_token_required
def create_billing_portal():
    """Stripe 빌링 포털 세션 생성"""
    try:
        db_manager = DatabaseManager()
        
        # 사용자의 Stripe 고객 ID 확인
        user = UserModel.get_by_clerk_id(db_manager, request.clerk_user_id)
        
        if not user or not user['stripe_customer_id']:
            return jsonify({'error': 'Stripe 고객 정보가 없습니다'}), 400
        
        # 포털 세션 생성
        session = stripe.billing_portal.Session.create(
            customer=user['stripe_customer_id'],
            return_url='https://csspickerpro.com/settings'#후에 변경필요!
        )
        
        return jsonify({
            'success': True,
            'portal_url': session.url
        }), 200
        
    except Exception as e:
        print(f"빌링 포털 생성 오류: {e}")
        return jsonify({'error': str(e)}), 500