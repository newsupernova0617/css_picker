"""
CSS Picker SaaS Backend - 개발 서버 실행
"""
import os
import sys

# src 모듈을 import path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.app import create_app

if __name__ == '__main__':
    app = create_app()

    # 개발 서버 설정
    port = int(os.getenv('PORT', 4242))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'

    # 서버 시작 메시지 출력
    print(f"""
    ========================================
    CSS Picker Backend Server (Reorganized)
    Environment: {os.getenv('FLASK_ENV', 'development')}
    Port: {port}
    Debug: {debug}
    ========================================
    """)

    # Flask 개발 서버 실행
    app.run(host='0.0.0.0', port=port, debug=debug)