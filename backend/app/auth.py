import requests
import jwt
import logging
from flask import request, jsonify
from functools import wraps
from .config import Config


def fetch_jwks() -> dict:
    """Clerk JWKS 키셋 가져오기"""
    jwks_url = "https://meet-warthog-82.clerk.accounts.dev/.well-known/jwks.json"
    response = requests.get(jwks_url)
    response.raise_for_status()
    return response.json()


def get_public_key_from_jwks(token: str, jwks: dict):
    """JWT 헤더 kid 값에 맞는 공개키 추출"""
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    for jwk in jwks["keys"]:
        if jwk["kid"] == kid:
            return jwt.algorithms.RSAAlgorithm.from_jwk(jwk)

    raise ValueError("JWKS에서 일치하는 키를 찾을 수 없음")


def verify_clerk_session_token(token: str):
    """Clerk 세션 토큰 검증 및 페이로드 반환"""
    try:
        jwks = fetch_jwks()
        key = get_public_key_from_jwks(token, jwks)
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except Exception as e:
        logging.error(f"Clerk 토큰 검증 실패: {e}")
        return None


def verify_clerk_token(f):
    """Clerk 인증 토큰 검증 데코레이터"""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization 헤더 없음"}), 401

        token = auth_header.split(" ")[1]
        payload = verify_clerk_session_token(token)

        if not payload:
            return jsonify({"error": "잘못되거나 만료된 토큰"}), 401

        # request 객체에 사용자 정보 추가
        request.user_id = payload.get("sub")
        request.user_email = payload.get("email", None)  # Clerk API 호출로 확장 가능
        return f(*args, **kwargs)

    return decorated
