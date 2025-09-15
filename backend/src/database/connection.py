"""
데이터베이스 연결 및 테이블 관리

이 파일은 Turso 클라우드 데이터베이스와의 연결을 관리하고
필요한 테이블들을 생성하는 역할을 합니다.
"""
import libsql  # Turso 데이터베이스 연결용 라이브러리 (SQLite 호환)
from src.config import get_config  # 환경별 설정 가져오기

class DatabaseManager:
    """
    데이터베이스 연결 및 테이블 관리를 담당하는 클래스
    
    이 클래스는 데이터베이스 연결, 테이블 생성, 트랜잭션 관리 등
    데이터베이스와 관련된 모든 기본 작업을 처리합니다.
    """
    
    def __init__(self):
        """DatabaseManager 초기화 - DB 연결 및 테이블 생성"""
        self.config = get_config()()  # 설정 클래스의 인스턴스 생성
        self.db = None  # 데이터베이스 연결 객체
        self.connect()  # 데이터베이스 연결
        self.create_tables()  # 필요한 테이블들 생성
    
    def connect(self):
        """
        Turso 데이터베이스에 연결
        
        환경변수에서 읽은 URL과 인증 토큰을 사용하여
        Turso 클라우드 데이터베이스에 연결합니다.
        """
        try:
            self.db = libsql.connect(
                self.config.TURSO_DATABASE_URL,  # 데이터베이스 URL (예: libsql://xxx.turso.io)
                auth_token=self.config.TURSO_AUTH_TOKEN  # 인증 토큰 (보안을 위해 환경변수에서 읽음)
            )
            print("Turso 데이터베이스 연결 성공")
        except Exception as e:
            print(f"데이터베이스 연결 실패: {e}")
            raise  # 연결 실패시 예외를 다시 발생시켜 서버 시작 중단
    
    def create_tables(self):
        """
        데이터베이스 테이블들을 생성 (존재하지 않을 경우)
        
        애플리케이션에 필요한 모든 테이블을 생성합니다.
        CREATE TABLE IF NOT EXISTS를 사용하여 테이블이 이미 존재하면 건너뜁니다.
        """
        try:
            cursor = self.db.cursor()  # SQL 쿼리를 실행할 커서 생성
            
            # 사용자 테이블
            # 사용자 정보와 구독 플랜을 저장하는 테이블
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,                          -- 고유 식별자 (UUID)
                    clerk_user_id TEXT UNIQUE NOT NULL,           -- Clerk 서비스의 사용자 ID (중복 불가)
                    email TEXT NOT NULL,                          -- 사용자 이메일
                    plan TEXT DEFAULT 'free',                     -- 구독 플랜 (free/premium)
                    premium_activated_at DATETIME,                -- 프리미엄 활성화 시간
                    stripe_customer_id TEXT,                      -- Stripe 고객 ID (결제용)
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,-- 계정 생성 시간
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 마지막 업데이트 시간
                )
            """)
            
            # 결제 테이블
            # Stripe 결제 정보를 저장하는 테이블
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,                          -- 고유 식별자 (UUID)
                    user_id TEXT REFERENCES users(id),            -- 사용자 ID (외래키)
                    stripe_payment_intent_id TEXT UNIQUE,         -- Stripe 결제 인텐트 ID
                    amount INTEGER NOT NULL,                      -- 결제 금액 (센트 단위)
                    status TEXT NOT NULL,                         -- 결제 상태 (succeeded/failed 등)
                    payment_date DATETIME,                        -- 결제 완료 시간
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 레코드 생성 시간
                )
            """)
            
            # 사용량 추적 테이블
            # 사용자의 기능 사용 내역을 추적하는 테이블 (요금 제한 체크용)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usage_logs (
                    id TEXT PRIMARY KEY,                          -- 고유 식별자 (UUID)
                    user_id TEXT REFERENCES users(id),            -- 사용자 ID (외래키)
                    feature TEXT NOT NULL,                        -- 사용한 기능 이름 (css_extraction, color_picker 등)
                    count INTEGER DEFAULT 1,                      -- 사용 횟수
                    metadata TEXT,                                -- 추가 정보 (JSON 형태로 저장)
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 사용 시간
                )
            """)
            
            
            self.db.commit()  # 모든 테이블 생성 쿼리를 커밋 (실제로 DB에 적용)
            print("데이터베이스 테이블 생성/검증 완료")
            
        except Exception as e:
            print(f"테이블 생성 실패: {e}")
            raise  # 테이블 생성 실패시 예외를 다시 발생시켜 서버 시작 중단
    
    def get_cursor(self):
        """
        데이터베이스 커서 반환
        
        SQL 쿼리를 실행하기 위한 커서 객체를 반환합니다.
        커서는 데이터베이스와 상호작용하는 인터페이스입니다.
        """
        return self.db.cursor()
    
    def commit(self):
        """
        트랜잭션 커밋
        
        지금까지 실행한 모든 SQL 명령을 데이터베이스에 영구적으로 저장합니다.
        커밋하지 않으면 변경사항이 저장되지 않습니다.
        """
        self.db.commit()
    
    def rollback(self):
        """
        트랜잭션 롤백
        
        마지막 커밋 이후의 모든 변경사항을 취소합니다.
        오류 발생시 데이터 무결성을 보장하기 위해 사용합니다.
        """
        self.db.rollback()
    
    def close(self):
        """
        데이터베이스 연결 종료
        
        데이터베이스와의 연결을 안전하게 종료합니다.
        애플리케이션 종료시 호출되어야 합니다.
        """
        if self.db:
            self.db.close()