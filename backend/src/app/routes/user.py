"""
사용자 관련 API 엔드포인트

이 파일은 사용자 프로필, 사용량 추적, 플랜 관리 등
사용자와 관련된 모든 API 엔드포인트를 포함합니다.
"""
from flask import Blueprint, request, jsonify
from src.app.middleware.auth import clerk_token_required  # Clerk 인증 데코레이터
from src.models import UserModel, UsageModel  # 데이터베이스 모델
from src.database import DatabaseManager  # DB 연결 관리자

# Blueprint 생성: /api/user/* 경로로 들어오는 요청을 처리
user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route('/profile', methods=['GET', 'POST'])
@clerk_token_required  # Clerk JWT 토큰 검증 필수
def handle_user_profile():
    """
    사용자 프로필 조회 및 업데이트
    
    GET: 사용자 프로필과 사용량 데이터를 반환
    POST: 사용자 프로필 업데이트 (현재 미구현)
    """
    db_manager = DatabaseManager()  # 데이터베이스 연결 생성
    
    if request.method == 'GET':
        try:
            # Clerk 사용자 ID로 DB에서 사용자 조회
            # request.clerk_user_id는 clerk_token_required 데코레이터가 설정함
            user = UserModel.get_by_clerk_id(db_manager, request.clerk_user_id)
            
            if not user:
                # 사용자가 DB에 없으면 새로 생성 (최초 로그인시)
                email = request.clerk_payload.get('email', '')  # JWT 토큰에서 이메일 추출
                user = UserModel.get_or_create(db_manager, request.clerk_user_id, email)
            
            # 사용량 데이터 조회 (기능별 사용 횟수)
            usage_data = UsageModel.get_user_usage(db_manager, user['id'])
            
            # 응답 데이터 구성
            # Chrome 확장 프로그램에서 필요한 사용자 정보와 사용량을 반환
            response_data = {
                'success': True,
                'user': {
                    'id': user['id'],                                     # 사용자 고유 ID
                    'email': user['email'],                               # 사용자 이메일
                    'plan': user['plan'],                                 # 구독 플랜 (free/premium)
                    'premium_activated_at': user['premium_activated_at'], # 프리미엄 시작 날짜
                    'created_at': user['created_at']                      # 계정 생성일
                },
                'usage': {
                    'elements_extracted': usage_data.get('elements_extracted', 0),  # HTML 요소 추출 횟수
                    'css_exports': usage_data.get('css_exports', 0),                # CSS 내보내기 횟수
                    'color_samples': usage_data.get('color_samples', 0)             # 색상 샘플링 횟수
                }
            }
            
            return jsonify(response_data), 200
            
        except Exception as e:
            print(f"프로필 조회 오류: {e}")
            return jsonify({'error': '프로필 조회 실패'}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()  # 요청 바디에서 JSON 데이터 추출
            
            # 업데이트 가능한 필드 처리
            # TODO: 향후 프로필 이미지, 닉네임 등을 업데이트하는 기능 추가 가능
            # 현재는 Clerk에서 사용자 정보를 관리하므로 구현 필요 없음
            
            return jsonify({'success': True, 'message': '프로필 업데이트 완료'}), 200
            
        except Exception as e:
            print(f"프로필 업데이트 오류: {e}")
            return jsonify({'error': '프로필 업데이트 실패'}), 500

@user_bp.route('/usage', methods=['POST'])
@clerk_token_required  
def track_usage():
    """
    사용량 추적
    
    Chrome 확장 프로그램에서 기능을 사용할 때마다 호출하여
    사용량을 기록합니다. 프리미엄 플랜의 사용 제한 체크에 사용됩니다.
    """
    try:
        data = request.get_json()
        feature = data.get('feature')    # 사용한 기능 이름
        metadata = data.get('metadata')  # 추가 정보 (JSON 형태)
        
        if not feature:
            return jsonify({'error': 'feature 필드가 필요합니다'}), 400
        
        # 유효한 feature 타입 검증
        # 현재 추적 가능한 기능들
        valid_features = ['elements_extracted', 'css_exports', 'color_samples']
        if feature not in valid_features:
            return jsonify({'error': f'유효하지 않은 feature입니다. 허용된 값: {valid_features}'}), 400
        
        # 사용자 조회
        db_manager = DatabaseManager()
        user = UserModel.get_by_clerk_id(db_manager, request.clerk_user_id)
        
        if not user:
            return jsonify({'error': '사용자를 찾을 수 없습니다'}), 404
        
        # 사용량 로깅 (usage_logs 테이블에 기록)
        # 나중에 요금 제한이나 통계 분석에 사용
        usage_id = UsageModel.log_usage(db_manager, user['id'], feature, metadata)
        
        return jsonify({
            'success': True,
            'message': '사용량이 기록되었습니다',
            'usage_id': usage_id
        }), 200
        
    except Exception as e:
        print(f"사용량 추적 오류: {e}")
        return jsonify({'error': '사용량 추적 실패'}), 500

@user_bp.route('/test-upgrade', methods=['POST'])
@clerk_token_required  
def test_upgrade_to_premium():
    """
    테스트용: 사용자를 프리미엄으로 업그레이드
    
    개발 환경에서 Stripe 결제 없이 프리미엄 기능을 테스트하기 위한 엔드포인트
    실제 프로덕션에서는 이 엔드포인트를 비활성화해야 합니다.
    """
    try:
        db_manager = DatabaseManager()
        user = UserModel.get_by_clerk_id(db_manager, request.clerk_user_id)
        
        if not user:
            return jsonify({'error': '사용자를 찾을 수 없습니다'}), 404
        
        # 프리미엄으로 업그레이드 (데이터베이스에서 plan 필드를 'premium'으로 변경)
        UserModel.update_plan(db_manager, user['id'], 'premium')
        
        return jsonify({
            'success': True,
            'message': '테스트용 프리미엄 업그레이드 완료',
            'plan': 'premium'
        }), 200
        
    except Exception as e:
        print(f"테스트 업그레이드 오류: {e}")
        return jsonify({'error': '테스트 업그레이드 실패'}), 500

@user_bp.route('/test-downgrade', methods=['POST'])
@clerk_token_required  
def test_downgrade_to_free():
    """
    테스트용: 사용자를 무료로 다운그레이드
    
    개발 환경에서 무료 플랜의 제한을 테스트하기 위한 엔드포인트
    실제 프로덕션에서는 이 엔드포인트를 비활성화해야 합니다.
    """
    try:
        db_manager = DatabaseManager()
        user = UserModel.get_by_clerk_id(db_manager, request.clerk_user_id)
        
        if not user:
            return jsonify({'error': '사용자를 찾을 수 없습니다'}), 404
        
        # 무료로 다운그레이드 (데이터베이스에서 plan 필드를 'free'로 변경)
        UserModel.update_plan(db_manager, user['id'], 'free')
        
        return jsonify({
            'success': True,
            'message': '테스트용 무료 다운그레이드 완료',
            'plan': 'free'
        }), 200
        
    except Exception as e:
        print(f"테스트 다운그레이드 오류: {e}")
        return jsonify({'error': '테스트 다운그레이드 실패'}), 500