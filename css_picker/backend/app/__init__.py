import logging
from flask import Flask, g
from flask_cors import CORS
from .auth import oauth
from .config import Config
from .database import SessionLocal
from flask_caching import Cache

cache = Cache()

from . import routes

def create_app():
    """Flask 애플리케이션 팩토리"""
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS 허용
    CORS(app)
    oauth.init_app(app)
    cache.init_app(app)
    # ======================
    # DB 세션 관리
    # ======================
    @app.before_request
    def create_session():
        g.db = SessionLocal()

    @app.teardown_request
    def remove_session(exception=None):
        db = getattr(g, "db", None)
        if db:
            try:
                if exception:
                    db.rollback()
            except Exception as e:
                logging.warning(f"DB rollback 중 오류 발생: {e}")
            finally:
                try:
                    db.close()
                except Exception as e:
                    logging.warning(f"DB close 중 오류 발생: {e}")

    # ======================
    # 라우트 등록
    # ======================
    routes.init_app(app)

    return app
