import logging
from app import create_app
from app.database import Base, engine
from sqlalchemy import text
# Validate critical SQLite PRAGMAs early so misconfiguration surfaces fast.
try:
    with engine.connect() as connection:
        journal_mode = connection.execute(text("PRAGMA journal_mode;")).scalar()
        if journal_mode and journal_mode.lower() != 'wal':
            raise RuntimeError(f"Unexpected SQLite journal_mode: {journal_mode}")
        foreign_keys = connection.execute(text("PRAGMA foreign_keys;")).scalar()
        if foreign_keys != 1:
            raise RuntimeError('SQLite foreign key enforcement not enabled')
except Exception:
    logging.exception('SQLite PRAGMA validation failed')
    raise

# DB 테이블 생성 (없으면 새로 만든다)
Base.metadata.create_all(bind=engine)

app = create_app()

if __name__ == "__main__":
    # 기본 포트/디버그 옵션은 환경변수에서 가져오도록
    import os
    port = int(os.getenv("PORT", 4242))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    app.run(host="0.0.0.0", port=port, debug=debug)
