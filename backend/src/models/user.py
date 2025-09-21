"""
사용자 데이터 모델
"""
from datetime import datetime
import uuid

class UserModel:
    """사용자 데이터 모델"""

    @staticmethod
    def get_or_create(db_manager, clerk_user_id, email):
        """사용자 조회 또는 생성"""
        cursor = db_manager.get_cursor()

        # 기존 사용자 확인
        cursor.execute(
            "SELECT * FROM users WHERE clerk_user_id = ?",
            (clerk_user_id,)
        )
        user = cursor.fetchone()

        if user:
            # 기존 사용자 반환
            return {
                'id': user[0],
                'clerk_user_id': user[1],
                'email': user[2],
                'plan': user[3],
                'premium_activated_at': user[4],
                'stripe_customer_id': user[5],
                'created_at': user[6],
                'updated_at': user[7]
            }
        else:
            # 새 사용자 생성
            user_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO users (id, clerk_user_id, email)
                VALUES (?, ?, ?)
            """, (user_id, clerk_user_id, email))
            db_manager.commit()

            return {
                'id': user_id,
                'clerk_user_id': clerk_user_id,
                'email': email,
                'plan': 'premium',  # TEMPORARY: Set new users to premium for testing
                'premium_activated_at': datetime.now().isoformat(),
                'stripe_customer_id': None,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }

    @staticmethod
    def get_by_clerk_id(db_manager, clerk_user_id):
        """Clerk ID로 사용자 조회"""
        cursor = db_manager.get_cursor()
        cursor.execute(
            "SELECT * FROM users WHERE clerk_user_id = ?",
            (clerk_user_id,)
        )
        user = cursor.fetchone()

        if user:
            return {
                'id': user[0],
                'clerk_user_id': user[1],
                'email': user[2],
                'plan': user[3],
                'premium_activated_at': user[4],
                'stripe_customer_id': user[5],
                'created_at': user[6],
                'updated_at': user[7]
            }
        return None

    @staticmethod
    def update_plan(db_manager, user_id, plan, stripe_customer_id=None):
        """사용자 플랜 업데이트"""
        cursor = db_manager.get_cursor()

        if plan == 'premium':
            cursor.execute("""
                UPDATE users
                SET plan = ?, premium_activated_at = ?, stripe_customer_id = ?, updated_at = ?
                WHERE id = ?
            """, (plan, datetime.now(), stripe_customer_id, datetime.now(), user_id))
        else:
            cursor.execute("""
                UPDATE users
                SET plan = ?, updated_at = ?
                WHERE id = ?
            """, (plan, datetime.now(), user_id))

        db_manager.commit()
        return True