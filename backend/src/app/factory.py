"""
CSS Picker Chrome Extension SaaS 백엔드 Flask 애플리케이션 팩토리
모듈화된 구조로 재구성
"""
import os
from clerk_backend_api import Clerk
from flask import Flask, render_template, send_from_directory, g, request
from flask_cors import CORS
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

# 로컬 임포트
from src.config import get_config
from src.database import DatabaseManager
from src.app.routes import user_bp, checkout_bp, webhooks_bp

# Sentry 초기화
sentry_sdk.init(
    dsn="https://576488890a9442e5f46e5c8101e56ea2@o4510022611763200.ingest.us.sentry.io/4510022614056960",
    send_default_pii=True,
)

def create_app(config_name=None):
    """
    애플리케이션 팩토리 함수
    """
    # Flask 애플리케이션 생성
    app = Flask(__name__, template_folder='../../templates', static_folder='../../static')

    # 설정 로드
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    config_class = get_config()
    app.config.from_object(config_class)

    # CORS 설정
    CORS(
        app,
        origins=config_class.CORS_ORIGINS,
        methods=config_class.CORS_METHODS,
        allow_headers=config_class.CORS_HEADERS,
        supports_credentials=config_class.CORS_SUPPORTS_CREDENTIALS
    )

    # Clerk 인증 설정
    clerk = Clerk(bearer_auth=app.config["CLERK_SECRET_KEY"])

    @app.before_request
    def load_user():
        token = request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            jwt = token.split(" ", 1)[1]
            try:
                session = clerk.sessions.verify(jwt)
                g.user = session.user
            except Exception:
                g.user = None
        else:
            g.user = None

    @app.before_request
    def bind_user_to_sentry():
        if getattr(g, "user", None):
            sentry_sdk.set_user({
                "id": g.user.id,
                "email": g.user.email,
            })
        else:
            sentry_sdk.set_user(None)

    # 데이터베이스 초기화
    init_database()

    # 블루프린트 등록
    register_blueprints(app)

    # 정적 라우트 등록
    register_static_routes(app)

    return app

def init_database():
    """데이터베이스 초기화"""
    try:
        db_manager = DatabaseManager()
        print("[OK] Database initialization completed")
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        raise

def register_blueprints(app):
    """API 블루프린트 등록"""
    app.register_blueprint(user_bp)
    app.register_blueprint(checkout_bp)
    app.register_blueprint(webhooks_bp)

    print("[OK] API blueprints registered")

def register_static_routes(app):
    """정적 라우트 등록"""

    @app.route('/')
    def index():
        """홈페이지"""
        return render_template('index.html')

    @app.route('/success')
    def success():
        """결제 성공 페이지"""
        return render_template('success.html')

    @app.route('/upgrade')
    def upgrade():
        """업그레이드 페이지"""
        return render_template('upgrade.html')

    @app.route('/cancel')
    def cancel():
        """결제 취소 페이지"""
        return render_template('cancel.html')

    @app.route('/health')
    def health():
        """헬스체크 엔드포인트"""
        return {'status': 'healthy'}, 200

    @app.route('/privacy-policy')
    def privacy_policy():
        """개인정보 처리방침 페이지"""
        return render_template('privacy-policy.html')

    @app.route('/terms-of-service')
    def terms_of_service():
        """이용약관 페이지"""
        return render_template('terms-of-service.html')

    @app.route('/robots.txt')
    def robots():
        """robots.txt 파일 제공"""
        return send_from_directory('../../static', 'robots.txt')

    @app.route('/sitemap.xml')
    def sitemap():
        """sitemap.xml 파일 제공"""
        return send_from_directory('../../static', 'sitemap.xml')

    print("[OK] Static routes registered")