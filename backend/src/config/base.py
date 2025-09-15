"""
Flask 애플리케이션 설정 관리

이 파일은 개발, 테스트, 운영 환경별로 다른 설정을 관리합니다.
환경변수는 .env 파일에서 읽어옵니다.
"""
import os
from dotenv import load_dotenv  # .env 파일에서 환경변수를 읽어오는 라이브러리

# 환경변수 로드
# .env 파일이 있으면 그 내용을 환경변수로 로드합니다
load_dotenv()

class Config:
    """
    기본 설정 클래스
    
    모든 환경에서 공통으로 사용되는 설정을 정의합니다.
    각 환경별 설정 클래스는 이 클래스를 상속받습니다.
    """
    
    # Flask 설정
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')  # 세션 쿠키 암호화에 사용되는 비밀 키
    DEBUG = False  # 디버그 모드 (기본값: 비활성화)
    TESTING = False  # 테스트 모드 (기본값: 비활성화)
    
    # CORS(Cross-Origin Resource Sharing) 설정
    # Chrome 확장 프로그램과 웹 프론트엔드에서 이 서버로 요청을 보낼 수 있도록 허용
    CORS_ORIGINS = [
        'https://csspickerpro.com',      # 메인 웹사이트 도메인
        'https://*.clerk.accounts.dev',  # Clerk 인증 서비스 도메인
        'chrome-extension://*'            # 모든 Chrome 확장 프로그램 허용
    ]
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']  # 허용할 HTTP 메서드들
    CORS_HEADERS = ['Content-Type', 'Authorization']  # 허용할 요청 헤더들
    CORS_SUPPORTS_CREDENTIALS = True  # 쿠키와 인증 정보를 포함한 요청 허용
    
    # Turso Database 설정
    # Turso는 SQLite를 클라우드에서 사용할 수 있게 해주는 서비스입니다
    TURSO_DATABASE_URL = os.getenv('TURSO_DATABASE_URL', 'libsql://your-database-url.turso.io')  # 데이터베이스 URL
    TURSO_AUTH_TOKEN = os.getenv('TURSO_AUTH_TOKEN', 'your-turso-auth-token')  # 인증 토큰
    
    # Stripe 결제 설정
    # Stripe는 온라인 결제 처리 서비스입니다
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_stripe_secret_key_here')  # API 비밀 키
    STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', 'whsec_your_webhook_secret')  # 웹훅 시크릿 (결제 이벤트 검증용)
    STRIPE_PRICE_ID = os.getenv('STRIPE_PRICE_ID', 'price_your_premium_price_id')  # 프리미엄 플랜 가격 ID
    
    # Clerk 인증 설정
    # Clerk는 사용자 인증과 관리를 쉽게 해주는 서비스입니다
    CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')  # Clerk API 시크릿 키
    CLERK_DOMAIN = os.getenv('CLERK_DOMAIN', 'meet-warthog-82')  # Clerk 도메인 (계정별로 고유)
    
    # JWKS(JSON Web Key Set) 캐시 설정
    # JWT 토큰 검증에 사용되는 공개 키를 캐싱하는 시간
    JWKS_CACHE_TTL = 3600  # 1시간 (3600초)

class DevelopmentConfig(Config):
    """
    개발 환경 설정
    
    로컬 개발 환경에서 사용되는 설정입니다.
    디버그 모드가 활성화되어 에러 메시지가 자세히 표시됩니다.
    """
    DEBUG = True  # 디버그 모드 활성화

class ProductionConfig(Config):
    """
    프로덕션 환경 설정
    
    실제 서비스 운영 환경에서 사용되는 설정입니다.
    보안을 위해 디버그 모드가 비활성화됩니다.
    """
    DEBUG = False  # 디버그 모드 비활성화 (보안상 중요)

class TestingConfig(Config):
    """
    테스트 환경 설정
    
    자동화된 테스트를 실행할 때 사용되는 설정입니다.
    """
    TESTING = True  # 테스트 모드 활성화
    
# 환경에 따른 설정 선택
# FLASK_ENV 환경변수 값에 따라 적절한 설정 클래스를 선택합니다
config = {
    'development': DevelopmentConfig,  # 개발 환경
    'production': ProductionConfig,    # 운영 환경
    'testing': TestingConfig,          # 테스트 환경
    'default': DevelopmentConfig       # 기본값 (개발 환경)
}

def get_config():
    """
    현재 환경에 맞는 설정 반환
    
    FLASK_ENV 환경변수를 읽어서 해당하는 설정 클래스를 반환합니다.
    환경변수가 설정되지 않은 경우 기본값으로 development를 사용합니다.
    
    Returns:
        Config: 현재 환경에 맞는 설정 클래스
    """
    env = os.getenv('FLASK_ENV', 'development')  # 환경변수 읽기 (기본값: development)
    return config.get(env, config['default'])  # 해당 환경의 설정 클래스 반환