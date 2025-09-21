"""
Clerk 인증 시스템
"""
import time
import jwt
import requests
from datetime import datetime
from functools import wraps
from flask import request, jsonify
from src.config import get_config

class ClerkAuth:
    """강화된 Clerk 인증 시스템"""
    
    def __init__(self):
        config = get_config()()
        self.secret_key = config.CLERK_SECRET_KEY
        self.domain = config.CLERK_DOMAIN
        self.jwks_url = f"https://{self.domain}.clerk.accounts.dev/.well-known/jwks.json"
        self.api_base = "https://api.clerk.com/v1"
        
        # 캐시 설정
        self.jwks_cache = {}
        self.jwks_cache_ttl = config.JWKS_CACHE_TTL
        self.jwks_last_fetch = 0
        
        # 보안 설정
        self.max_token_age = 1800  # 30분
        self.rate_limit_window = 60  # 1분
        self.rate_limit_max_requests = 60
        
        # 세션 추적
        self.request_tracking = {}
        self.failed_attempts = {}
    
    def get_jwks_with_cache(self):
        """캐시된 JWKS 키 가져오기"""
        current_time = time.time()
        
        if (self.jwks_cache and 
            (current_time - self.jwks_last_fetch) < self.jwks_cache_ttl):
            return self.jwks_cache
        
        try:
            response = requests.get(self.jwks_url, timeout=10)
            response.raise_for_status()
            
            self.jwks_cache = response.json()
            self.jwks_last_fetch = current_time
            
            print("JWKS 캐시 업데이트 완료")
            return self.jwks_cache
            
        except Exception as e:
            print(f"JWKS 가져오기 실패: {e}")
            return self.jwks_cache if self.jwks_cache else {}
    
    def verify_rate_limit(self, client_ip: str) -> bool:
        """속도 제한 검증"""
        current_time = time.time()
        window_start = current_time - self.rate_limit_window
        
        if client_ip not in self.request_tracking:
            self.request_tracking[client_ip] = []
        
        self.request_tracking[client_ip] = [
            req_time for req_time in self.request_tracking[client_ip]
            if req_time > window_start
        ]
        
        self.request_tracking[client_ip].append(current_time)
        
        return len(self.request_tracking[client_ip]) <= self.rate_limit_max_requests
    
    def verify_jwt_token(self, token: str):
        """강화된 JWT 토큰 검증"""
        try:
            jwks = self.get_jwks_with_cache()
            if not jwks:
                print("JWKS를 가져올 수 없음")
                return None
            
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            
            public_key = None
            for jwk in jwks.get('keys', []):
                if jwk['kid'] == kid:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
                    break
            
            if not public_key:
                print(f"키 ID {kid}에 해당하는 공개키를 찾을 수 없음")
                return None
            
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                issuer=f"https://{self.domain}.clerk.accounts.dev",
                verify_signature=True,
                verify_exp=True,
                verify_iat=True,
                verify_nbf=True,
                leeway=30,
                options={
                    "verify_aud": False
                }
            )
            
            current_time = datetime.utcnow().timestamp()
            token_age = current_time - payload.get('iat', 0)
            
            if token_age > self.max_token_age:
                print(f"토큰이 너무 오래됨: {token_age}초")
                return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            print("토큰이 만료됨")
            return None
        except jwt.InvalidTokenError as e:
            print(f"유효하지 않은 토큰: {e}")
            return None
        except Exception as e:
            print(f"토큰 검증 중 오류: {e}")
            return None
    
    def get_user_info(self, user_id: str):
        """Clerk API에서 사용자 정보 가져오기"""
        try:
            headers = {
                'Authorization': f'Bearer {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.api_base}/users/{user_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                
                return {
                    'id': user_data.get('id'),
                    'email': user_data.get('email_addresses', [{}])[0].get('email_address'),
                    'first_name': user_data.get('first_name'),
                    'last_name': user_data.get('last_name'),
                    'created_at': user_data.get('created_at'),
                    'last_sign_in': user_data.get('last_sign_in_at'),
                    'two_factor_enabled': user_data.get('two_factor_enabled', False)
                }
            else:
                print(f"사용자 정보 가져오기 실패: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"사용자 정보 API 오류: {e}")
            return None

def clerk_token_required(f):
    """Clerk 토큰 검증 데코레이터"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization 헤더가 없거나 올바르지 않습니다'}), 401
        
        token = auth_header.split('Bearer ')[1]
        
        clerk_auth = ClerkAuth()
        
        # 속도 제한 확인
        client_ip = request.remote_addr
        if not clerk_auth.verify_rate_limit(client_ip):
            return jsonify({'error': '요청 제한 초과'}), 429
        
        # 토큰 검증
        payload = clerk_auth.verify_jwt_token(token)
        
        if not payload:
            return jsonify({'error': '유효하지 않은 토큰'}), 401
        
        # 사용자 ID 추출
        clerk_user_id = payload.get('sub')
        if not clerk_user_id:
            return jsonify({'error': '사용자 ID를 찾을 수 없습니다'}), 401
        
        # 요청에 사용자 ID 추가
        request.clerk_user_id = clerk_user_id
        request.clerk_payload = payload
        
        return f(*args, **kwargs)
    
    return decorated_function