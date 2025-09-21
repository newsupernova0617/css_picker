#!/bin/bash

# CSS Picker - Git Subtree 동기화 설정 스크립트
# 메인 저장소의 backend 폴더를 별도 저장소로 자동 동기화

echo "🔄 Git Subtree 동기화 설정..."

# 메인 프로젝트 루트로 이동
cd ..

# Subtree를 사용하여 backend 폴더를 별도 저장소로 푸시
echo "Backend 저장소 URL을 입력하세요 (예: https://github.com/USERNAME/css-picker-backend.git):"
read BACKEND_REPO_URL

if [[ -z "$BACKEND_REPO_URL" ]]; then
    echo "❌ 저장소 URL이 필요합니다."
    exit 1
fi

# Subtree 원격 저장소 추가
git remote add backend-origin "$BACKEND_REPO_URL" 2>/dev/null || true

# Backend 폴더를 별도 저장소로 푸시
echo "🚀 Backend 폴더를 별도 저장소로 푸시 중..."
git subtree push --prefix=backend backend-origin main

echo "✅ Subtree 동기화 설정 완료!"
echo ""
echo "앞으로 backend 변경사항을 별도 저장소에 동기화하려면:"
echo "git subtree push --prefix=backend backend-origin main"
echo ""
echo "별도 저장소의 변경사항을 가져오려면:"
echo "git subtree pull --prefix=backend backend-origin main"