# CSS Picker Chrome Extension SaaS 백엔드 Flask 애플리케이션
# 사용자 인증(Clerk), 결제 처리(Stripe), 사용자 플랜 관리를 담당
from dotenv import load_dotenv
import os
import json
import hashlib
import hmac
from datetime import datetime, timedelta
from functools import wraps


import libsql as libsql  # Turso 데이터베이스 연결용
import stripe  # Stripe 결제 처리용
import requests  # HTTP 요청 처리용
import jwt  # JWT 토큰 검증용
from flask import Flask, request, jsonify, render_template  # Flask 웹 프레임워크
from flask_cors import CORS  # CORS 설정용
from werkzeug.exceptions import BadRequest  # HTTP 에러 처리용

# ✅ 환경변수 파일(.env) 먼저 로드
load_dotenv()

# Flask 애플리케이션 초기화
app = Flask(__name__)
CORS(app)  # Chrome Extension에서 접근할 수 있도록 CORS 활성화

# 기본 설정
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')  # Flask 세션 암호화 키
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_stripe_secret_key_here')  # Stripe API 키

# Turso 데이터베이스 설정 (SQLite 호환 클라우드 데이터베이스)
TURSO_DATABASE_URL = os.getenv('TURSO_DATABASE_URL', 'libsql://your-database-url.turso.io')
TURSO_AUTH_TOKEN = os.getenv('TURSO_AUTH_TOKEN', 'your-turso-auth-token')

# Stripe 결제 시스템 설정
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', 'whsec_your_webhook_secret')  # 웹훅 보안 키
STRIPE_PRICE_ID = os.getenv('STRIPE_PRICE_ID', 'price_your_premium_price_id')  # 프리미엄 플랜 가격 ID

# Clerk 인증 시스템 설정 (사용자 인증 및 세션 관리)
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')

class DatabaseManager:
    """데이터베이스 연결 및 테이블 관리를 담당하는 클래스"""
    
    def __init__(self):
        """DatabaseManager 초기화 - DB 연결 및 테이블 생성"""
        self.db = None
        self.connect()
        self.create_tables()
    
    def connect(self):
        """Turso 데이터베이스에 연결"""
        try:
            self.db = libsql.connect(TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
            print("Turso 데이터베이스 연결 성공")
        except Exception as e:
            print(f"데이터베이스 연결 실패: {e}")
            raise
    
    def create_tables(self):
        """데이터베이스 테이블들을 생성 (존재하지 않을 경우)"""
        try:
            cursor = self.db.cursor()
            
            # 사용자 테이블 - 모든 사용자 정보 저장
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,                        -- 고유 사용자 ID
                    clerk_user_id TEXT UNIQUE NOT NULL,         -- Clerk 사용자 ID (외부 인증)
                    email TEXT NOT NULL,                        -- 사용자 이메일
                    plan TEXT DEFAULT 'free',                   -- 플랜 타입 ('free' 또는 'premium')
                    premium_activated_at DATETIME,              -- 프리미엄 활성화 시간
                    stripe_customer_id TEXT,                    -- Stripe 고객 ID
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 계정 생성 시간
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 마지막 업데이트 시간
                )
            """)
            
            # 결제 테이블 - 일회성 평생 결제 기록 저장
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,                        -- 고유 결제 ID
                    user_id TEXT REFERENCES users(id),          -- 사용자 ID (외래키)
                    stripe_payment_intent_id TEXT UNIQUE,       -- Stripe 결제 의도 ID
                    amount INTEGER NOT NULL,                    -- 결제 금액 (센트 단위)
                    status TEXT NOT NULL,                       -- 결제 상태
                    payment_date DATETIME,                      -- 결제 완료 시간
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 레코드 생성 시간
                )
            """)
            
            # 현재 미구현
            # 사용량 로그 테이블 - 기능별 일일 사용량 추적
            # cursor.execute("""
            #     CREATE TABLE IF NOT EXISTS usage_logs (
            #         id TEXT PRIMARY KEY,                        -- 고유 로그 ID
            #         user_id TEXT REFERENCES users(id),          -- 사용자 ID (외래키)
            #         feature TEXT,                               -- 사용한 기능명
            #         usage_date DATE,                            -- 사용 날짜
            #         count INTEGER DEFAULT 1,                    -- 사용 횟수
            #         created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 로그 생성 시간
            #     )
            # """)
            
            self.db.commit()
            print("데이터베이스 테이블 생성/검증 완료")
            
        except Exception as e:
            print(f"테이블 생성 실패: {e}")
            raise

# 전역 데이터베이스 매니저 인스턴스
db_manager = DatabaseManager()

def verify_clerk_session_token(token):
    """Clerk JWT 세션 토큰을 네트워크 없이 검증하는 함수"""
    try:
        print(f"Clerk JWT 토큰 검증 중: {token[:10]}...")
        
        # Clerk JWKS(JSON Web Key Set)를 가져와서 토큰 검증용 키 확보
        jwks_url = "https://meet-warthog-82.clerk.accounts.dev/.well-known/jwks.json"
        jwks_response = requests.get(jwks_url)
        
        if jwks_response.status_code != 200:
            print(f"JWKS 가져오기 실패: {jwks_response.status_code}")
            return None
        
        jwks = jwks_response.json()
        
        # JWT 헤더에서 키 ID(kid) 추출
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        # 일치하는 공개키 찾기
        key = None
        for jwk in jwks['keys']:
            if jwk['kid'] == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
                break
        
        if not key:
            print(f"키 ID에 일치하는 키를 찾을 수 없음: {kid}")
            return None
        
        # JWT 토큰 검증 및 디코딩
        payload = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=None,  # 현재는 audience 검증 생략
            options={"verify_aud": False}  # audience 검증 비활성화
        )
        
        print(f"JWT 토큰 검증 성공, payload: {payload}")
        
        # JWT payload에서 사용자 정보 추출
        user_id = payload.get('sub')  # Subject는 보통 사용자 ID
        
        if user_id:
            # Clerk API에서 사용자 상세 정보 가져오기
            headers = {
                'Authorization': f'Bearer {CLERK_SECRET_KEY}',
                'Content-Type': 'application/json'
            }
            user_url = f"https://api.clerk.com/v1/users/{user_id}"
            user_response = requests.get(user_url, headers=headers)
            
            if user_response.status_code == 200:
                user_data = user_response.json()
                return {
                    'user_id': user_id,
                    'email': user_data.get('email_addresses', [{}])[0].get('email_address'),
                    'first_name': user_data.get('first_name'),
                    'last_name': user_data.get('last_name')
                }
            else:
                print(f"사용자 데이터 가져오기 실패: {user_response.status_code}")
                # API 호출 실패시 JWT에서 기본 정보만 반환
                return {
                    'user_id': user_id,
                    'email': payload.get('email'),
                    'first_name': None,
                    'last_name': None
                }
        
        return None
        
    except jwt.ExpiredSignatureError:
        print("JWT 토큰이 만료됨")
        return None
    except jwt.InvalidTokenError as e:
        print(f"잘못된 JWT 토큰: {e}")
        return None
    except Exception as e:
        print(f"Clerk 토큰 검증 오류: {e}")
        return None

def verify_clerk_token(f):
    """Clerk 인증 토큰 검증 데코레이터 - API 엔드포인트를 보호"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Authorization 헤더에서 Bearer 토큰 추출
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization 헤더가 없거나 잘못됨'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Clerk API로 토큰 검증
        user_data = verify_clerk_session_token(token)
        
        if not user_data:
            return jsonify({'error': '잘못되거나 만료된 토큰'}), 401
        
        # 검증된 사용자 데이터를 request 컨텍스트에 설정
        request.user_id = user_data['user_id']
        request.user_email = user_data['email']
        request.user_first_name = user_data.get('first_name')
        request.user_last_name = user_data.get('last_name')
        
        return f(*args, **kwargs)
    return decorated_function


def get_or_create_user(clerk_user_id, email):
    """기존 사용자 조회 또는 신규 사용자 생성"""
    cursor = db_manager.db.cursor()
    
    # 기존 사용자 찾기 시도
    cursor.execute("SELECT id, clerk_user_id, email, plan, premium_activated_at, stripe_customer_id, created_at, updated_at FROM users WHERE clerk_user_id = ?", (clerk_user_id,))
    user_row = cursor.fetchone()
    
    if user_row:
        # 행을 딕셔너리로 수동 변환하여 반환
        return {
            'id': user_row[0],
            'clerk_user_id': user_row[1],
            'email': user_row[2],
            'plan': user_row[3],
            'premium_activated_at': user_row[4],
            'stripe_customer_id': user_row[5],
            'created_at': user_row[6],
            'updated_at': user_row[7]
        }
    
    # 신규 사용자 생성 (Clerk ID를 해시하여 고유 ID 생성)
    user_id = f"usr_{hashlib.md5(clerk_user_id.encode()).hexdigest()[:12]}"
    cursor.execute("""
        INSERT INTO users (id, clerk_user_id, email, plan)
        VALUES (?, ?, ?, 'free')
    """, (user_id, clerk_user_id, email))
    
    db_manager.db.commit()
    
    # 새로 생성된 사용자 반환
    cursor.execute("SELECT id, clerk_user_id, email, plan, premium_activated_at, stripe_customer_id, created_at, updated_at FROM users WHERE id = ?", (user_id,))
    new_user_row = cursor.fetchone()
    
    return {
        'id': new_user_row[0],
        'clerk_user_id': new_user_row[1],
        'email': new_user_row[2],
        'plan': new_user_row[3],
        'premium_activated_at': new_user_row[4],
        'stripe_customer_id': new_user_row[5],
        'created_at': new_user_row[6],
        'updated_at': new_user_row[7]
    }

# 웹 페이지 및 API 라우트 정의

@app.route('/')
def index():
    """CSS Picker 랜딩 페이지 (Clerk 인증 통합)"""
    return render_template('index.html')

@app.route('/success')
def success():
    """결제 성공 페이지"""
    return render_template('success.html')

@app.route('/upgrade')
def upgrade():
    """프리미엄 업그레이드 페이지"""
    return render_template('index.html')

@app.route('/cancel')
def cancel():
    """결제 취소 페이지"""
    return render_template('cancel.html')

@app.route('/privavy-policy')
def privavy_policy():
    """privavy-policy"""
    return render_template('privavy-policy.html')

@app.route('/terms-of-service')
def terms_of_service():
    """terms-of-service"""
    return render_template('terms-of-service')

@app.route('/health')
def health():
    """서버 상태 확인 엔드포인트"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

# 개발용 임시 엔드포인트 (프로덕션에서는 제거 필요)
# @app.route('/api/dev/set-premium', methods=['POST'])
# def dev_set_premium():
#     """개발 전용: 이메일로 사용자를 프리미엄으로 설정"""
#     try:
#         data = request.get_json()
#         email = data.get('email')
        
#         if not email:
#             return jsonify({'error': '이메일이 필요합니다'}), 400
            
#         cursor = db_manager.db.cursor()
        
#         # 이메일로 사용자 찾기
#         cursor.execute("SELECT id, plan FROM users WHERE email = ?", (email,))
#         user_row = cursor.fetchone()
        
#         if not user_row:
#             return jsonify({'error': '사용자를 찾을 수 없습니다'}), 404
            
#         user_id, current_plan = user_row
        
#         # 평생 플랜으로 업데이트
#         cursor.execute("""
#             UPDATE users 
#             SET plan = 'premium', 
#                 premium_activated_at = CURRENT_TIMESTAMP,
#                 updated_at = CURRENT_TIMESTAMP
#             WHERE id = ?
#         """, (user_id,))
        
#         db_manager.db.commit()
        
#         return jsonify({
#             'success': True,
#             'user_id': user_id,
#             'email': email,
#             'previous_plan': current_plan,
#             'new_plan': 'premium'
#         })
        
#     except Exception as e:
#         print(f"개발 엔드포인트 오류: {e}")
#         return jsonify({'error': str(e)}), 500


# 사용자 관리 API 엔드포인트

@app.route('/api/user/profile', methods=['GET', 'POST'])
@verify_clerk_token
def handle_user_profile():
    """사용자 프로필 GET/POST 요청 처리"""

    try:
        if request.method == 'POST':
            # 랜딩 페이지에서 프로필 생성/업데이트 처리
            data = request.get_json() or {}
            print(f"사용자 프로필 생성/업데이트 - user_id: {request.user_id}, email: {request.user_email}")
            
            # POST 요청의 추가 데이터로 사용자 업데이트
            cursor = db_manager.db.cursor()
            cursor.execute("""
                UPDATE users SET 
                    email = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE clerk_user_id = ?
            """, (request.user_email, request.user_id))
            db_manager.db.commit()
            
        # 사용자 조회 또는 생성 (GET과 POST 모두)
        print(f"사용자 프로필 조회 - user_id: {request.user_id}, email: {request.user_email}")
        user = get_or_create_user(request.user_id, request.user_email)
        print(f"사용자 생성/조회 완료: {user}")
        
        return jsonify({
            'id': user['id'],
            'email': user['email'],
            'plan': user['plan'],
            'premium_activated_at': user.get('premium_activated_at'),
            'created_at': user['created_at']
        })
        
    except Exception as e:
        print(f"사용자 프로필 처리 오류: {e}")
        import traceback
        print(f"스택 트레이스: {traceback.format_exc()}")
        return jsonify({'error': '내부 서버 오류'}), 500

# 현재 사용량 구현 안됨
# @app.route('/api/user/usage', methods=['GET'])
# # @verify_clerk_token
# def get_user_usage():
#     """사용자 사용량 통계 조회"""
#     request.user_id = "user_31xtWCLHNKEgoBmGFnieLSbKlTv"
#     request.user_email = "yj43773@gmail.com"
#     try:
#         user = get_or_create_user(request.user_id, request.user_email)
#         cursor = db_manager.db.cursor()
        
#         # 오늘의 사용량 조회
#         today = datetime.now().date()
#         cursor.execute("""
#             SELECT feature, SUM(count) as total_count
#             FROM usage_logs 
#             WHERE user_id = ? AND usage_date = ?
#             GROUP BY feature
#         """, (user['id'], today))
        
#         usage_data = {}
#         for row in cursor.fetchall():
#             usage_data[row['feature']] = row['total_count']
        
#         return jsonify({
#             'user_id': user['id'],
#             'plan': user['plan'],
#             'usage_date': today.isoformat(),
#             'usage': usage_data
#         })
        
#     except Exception as e:
#         print(f"사용자 사용량 조회 오류: {e}")
#         return jsonify({'error': '내부 서버 오류'}), 500


# 사용량 추적 API 엔드포인트(아직 구현 안됨)
# @app.route('/api/usage/track', methods=['POST'])
# @verify_clerk_token  
# def track_usage():
#     """기능 사용량 추적"""
#     try:
#         data = request.get_json()
#         feature = data.get('feature')
        
#         if not feature:
#             return jsonify({'error': '기능 이름이 필요합니다'}), 400
        
#         user = get_or_create_user(request.user_id, request.user_email)
#         cursor = db_manager.db.cursor()
        
#         # 사용량 로그 삽입
#         usage_id = f"usage_{hashlib.md5(f'{user['id']}{feature}{datetime.now()}'.encode()).hexdigest()[:12]}"
#         today = datetime.now().date()
        
#         cursor.execute("""
#             INSERT INTO usage_logs (id, user_id, feature, usage_date, count)
#             VALUES (?, ?, ?, ?, 1)
#         """, (usage_id, user['id'], feature, today))
        
#         db_manager.db.commit()
        
#         return jsonify({'success': True, 'feature': feature, 'timestamp': datetime.now().isoformat()})
        
#     except Exception as e:
#         print(f"사용량 추적 오류: {e}")
#         return jsonify({'error': '내부 서버 오류'}), 500

# 결제 처리 API 엔드포인트

@app.route('/api/checkout/create', methods=['POST'])
@verify_clerk_token
def create_checkout():
    """Stripe 체크아웃 세션 생성"""
    try:
        user = get_or_create_user(request.user_id, request.user_email)
        
        # Stripe 고객 생성 또는 조회
        stripe_customer_id = user.get('stripe_customer_id')
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user['email'],
                metadata={'user_id': user['id']}
            )
            stripe_customer_id = customer.id
            
            # 사용자 레코드 업데이트
            cursor = db_manager.db.cursor()
            cursor.execute("""
                UPDATE users SET stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (stripe_customer_id, user['id']))
            db_manager.db.commit()
        
        # 체크아웃 세션 생성 (일회성 평생 결제)
        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': STRIPE_PRICE_ID,  # $29 평생 플랜
                'quantity': 1,
            }],
            mode='payment',  # 일회성 결제
            success_url=request.host_url + 'success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.host_url + 'cancel',
            metadata={
                'user_id': user['id']
            }
        )
        
        return jsonify({'checkout_url': session.url, 'session_id': session.id})
        
    except Exception as e:
        print(f"체크아웃 생성 오류: {e}")
        return jsonify({'error': '내부 서버 오류'}), 500

@app.route('/api/billing/portal', methods=['POST'])
@verify_clerk_token
def create_billing_portal():
    """Stripe 청구 포털 세션 생성"""
    # request.user_id = "user_31xtWCLHNKEgoBmGFnieLSbKlTv"
    # request.user_email = "yj43773@gmail.com"
    try:
        user = get_or_create_user(request.user_id, request.user_email)
        
        if not user.get('stripe_customer_id'):
            return jsonify({'error': '청구 정보를 찾을 수 없습니다'}), 400
        
        session = stripe.billing_portal.Session.create(
            customer=user['stripe_customer_id'],
            return_url=request.host_url
        )
        
        return jsonify({'portal_url': session.url})
        
    except Exception as e:
        print(f"청구 포털 생성 오류: {e}")
        return jsonify({'error': '내부 서버 오류'}), 500

# Stripe 웹훅 처리

@app.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    """Stripe 웹훅 이벤트 처리"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        # 웹훅 서명 검증 및 이벤트 구성
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        print("잘못된 페이로드")
        return '', 400
    except stripe.error.SignatureVerificationError:
        print("잘못된 서명")  
        return '', 400
    
    # 이벤트 타입별 처리
    if event['type'] == 'checkout.session.completed':
        handle_checkout_completed(event['data']['object'])  # 체크아웃 완료 처리
    elif event['type'] == 'payment_intent.succeeded':
        handle_payment_succeeded(event['data']['object'])  # 결제 성공 처리
    
    return '', 200

def handle_checkout_completed(session):
    """일회성 평생 결제 체크아웃 완료 처리"""
    try:
        user_id = session['metadata']['user_id']
        payment_intent_id = session['payment_intent']
        
        cursor = db_manager.db.cursor()
        
        # 사용자 플랜을 평생 프리미엄으로 업그레이드 (활성화 타임스탬프 포함)
        cursor.execute("""
            UPDATE users SET plan = 'premium', premium_activated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (user_id,))
        
        # 평생 결제 기록 저장 ($29.00 = 2900 센트)
        payment_id = f"pay_{hashlib.md5(payment_intent_id.encode()).hexdigest()[:12]}"
        cursor.execute("""
            INSERT INTO payments (id, user_id, stripe_payment_intent_id, amount, status, payment_date)
            VALUES (?, ?, ?, 2900, 'succeeded', CURRENT_TIMESTAMP)
        """, (payment_id, user_id, payment_intent_id))
        
        db_manager.db.commit()
        print(f"사용자 {user_id}가 평생 프리미엄으로 업그레이드됨 ($29.00)")
        
    except Exception as e:
        print(f"체크아웃 완료 처리 오류: {e}")

def handle_payment_succeeded(payment_intent):
    """일회성 결제 성공 처리"""
    try:
        print(f"결제 성공 - payment intent {payment_intent['id']}")
        
    except Exception as e:
        print(f"결제 성공 처리 오류: {e}")

# Flask 애플리케이션 실행
if __name__ == '__main__':
    print("CSS Picker 백엔드 시작 중...")
    print("데이터베이스:", TURSO_DATABASE_URL.split('@')[-1] if '@' in TURSO_DATABASE_URL else TURSO_DATABASE_URL)
    print("Stripe 모드:", "라이브" if stripe.api_key.startswith('sk_live') else "테스트")
    
    port = int(os.getenv('PORT', 4242))  # 기본 포트 4242
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'  # 디버그 모드 설정, 출시전에 false로 바꾸자
    app.run(debug=debug, host='0.0.0.0', port=port)  # 모든 IP에서 접근 허용