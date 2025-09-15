"""
핵심 비즈니스 서비스
"""
from src.models import UserModel, PaymentModel
from src.database import DatabaseManager

class UserService:
    """사용자 관련 비즈니스 로직"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def get_or_create_user(self, clerk_user_id: str, email: str):
        """사용자 조회 또는 생성"""
        return UserModel.get_or_create(self.db, clerk_user_id, email)
    
    def get_user_by_clerk_id(self, clerk_user_id: str):
        """Clerk ID로 사용자 조회"""
        return UserModel.get_by_clerk_id(self.db, clerk_user_id)
    
    def upgrade_to_premium(self, user_id: str, stripe_customer_id: str):
        """사용자를 프리미엄으로 업그레이드"""
        return UserModel.update_plan(self.db, user_id, 'premium', stripe_customer_id)
    
    def downgrade_to_free(self, user_id: str):
        """사용자를 무료 플랜으로 다운그레이드"""
        return UserModel.update_plan(self.db, user_id, 'free')

class PaymentService:
    """결제 관련 비즈니스 로직"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def record_payment(self, user_id: str, stripe_payment_intent_id: str, amount: int, status: str):
        """결제 기록 생성"""
        return PaymentModel.create(self.db, user_id, stripe_payment_intent_id, amount, status)
    
    def get_payment_by_intent(self, stripe_payment_intent_id: str):
        """Stripe Intent ID로 결제 조회"""
        return PaymentModel.get_by_intent_id(self.db, stripe_payment_intent_id)