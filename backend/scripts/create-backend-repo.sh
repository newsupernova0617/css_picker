#!/bin/bash

# CSS Picker Backend - 별도 저장소 생성 스크립트

echo "🚀 CSS Picker Backend 별도 저장소 생성..."

# 현재 디렉토리가 backend인지 확인
if [[ ! -f "railway.toml" ]]; then
    echo "❌ backend 디렉토리에서 실행해주세요."
    exit 1
fi

# 새 Git 저장소 초기화
rm -rf .git
git init
git branch -M main

# 모든 파일 추가
git add .
git commit -m "Initial commit: CSS Picker Backend for Railway deployment

Features:
- Flask API with Clerk authentication
- Stripe payment integration
- Turso database connection
- Railway deployment ready
- Production-grade logging and monitoring"

echo "✅ 로컬 저장소 초기화 완료"
echo ""
echo "다음 단계:"
echo "1. GitHub에서 새 저장소 생성: css-picker-backend"
echo "2. 다음 명령어 실행:"
echo "   git remote add origin https://github.com/USERNAME/css-picker-backend.git"
echo "   git push -u origin main"
echo "3. Railway에서 새 저장소 연결"