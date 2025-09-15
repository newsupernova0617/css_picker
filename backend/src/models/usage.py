"""
사용량 추적 데이터 모델
"""
from datetime import datetime
import uuid

class UsageModel:
    """사용량 추적 데이터 모델"""

    @staticmethod
    def log_usage(db_manager, user_id, feature, metadata=None):
        """사용량 로깅"""
        cursor = db_manager.get_cursor()
        usage_id = str(uuid.uuid4())

        cursor.execute("""
            INSERT INTO usage_logs (id, user_id, feature, metadata)
            VALUES (?, ?, ?, ?)
        """, (usage_id, user_id, feature, metadata))

        db_manager.commit()
        return usage_id

    @staticmethod
    def get_user_usage(db_manager, user_id, feature=None):
        """사용자 사용량 조회"""
        cursor = db_manager.get_cursor()

        if feature:
            cursor.execute("""
                SELECT feature, COUNT(*) as count
                FROM usage_logs
                WHERE user_id = ? AND feature = ?
                GROUP BY feature
            """, (user_id, feature))
        else:
            cursor.execute("""
                SELECT feature, COUNT(*) as count
                FROM usage_logs
                WHERE user_id = ?
                GROUP BY feature
            """, (user_id,))

        results = cursor.fetchall()
        usage_dict = {}

        for row in results:
            usage_dict[row[0]] = row[1]

        return usage_dict