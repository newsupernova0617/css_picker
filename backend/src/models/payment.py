"""
결제 데이터 모델
"""
from datetime import datetime
import uuid

class PaymentModel:
    """결제 데이터 모델"""

    @staticmethod
    def create(db_manager, user_id, stripe_payment_intent_id, amount, status):
        """새 결제 레코드 생성"""
        cursor = db_manager.get_cursor()
        payment_id = str(uuid.uuid4())

        cursor.execute("""
            INSERT INTO payments (id, user_id, stripe_payment_intent_id, amount, status, payment_date)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (payment_id, user_id, stripe_payment_intent_id, amount, status, datetime.now()))

        db_manager.commit()
        return payment_id

    @staticmethod
    def get_by_intent_id(db_manager, stripe_payment_intent_id):
        """Stripe Intent ID로 결제 조회"""
        cursor = db_manager.get_cursor()
        cursor.execute(
            "SELECT * FROM payments WHERE stripe_payment_intent_id = ?",
            (stripe_payment_intent_id,)
        )
        payment = cursor.fetchone()

        if payment:
            return {
                'id': payment[0],
                'user_id': payment[1],
                'stripe_payment_intent_id': payment[2],
                'amount': payment[3],
                'status': payment[4],
                'payment_date': payment[5],
                'created_at': payment[6]
            }
        return None