from app import create_app

app = create_app()

if __name__ == "__main__":
    # 기본 포트/디버그 옵션은 환경변수에서 가져오도록
    import os
    port = int(os.getenv("PORT", 4242))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    app.run(host="0.0.0.0", port=port, debug=debug)
