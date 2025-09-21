#!/bin/bash

# CSS Picker - Railway 배포 스크립트
# 사용법: ./scripts/deploy-to-railway.sh

set -e

echo "🚀 CSS Picker Railway 배포 시작..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 현재 디렉토리 확인
if [[ ! -f "railway.toml" ]]; then
    print_error "railway.toml이 없습니다. backend 디렉토리에서 실행해주세요."
    exit 1
fi

print_status "현재 디렉토리 확인 완료"

# Git 상태 확인
print_info "Git 상태 확인 중..."
if ! git status &> /dev/null; then
    print_error "Git 저장소가 아닙니다. git init을 먼저 실행해주세요."
    exit 1
fi

# 변경사항 확인
if ! git diff --quiet; then
    print_warning "커밋되지 않은 변경사항이 있습니다."
    echo "변경된 파일들:"
    git status --porcelain
    echo ""

    read -p "계속 진행하시겠습니까? 변경사항을 커밋하고 푸시합니다. (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "배포를 취소했습니다."
        exit 0
    fi

    # 변경사항 커밋
    print_info "변경사항 커밋 중..."
    git add .
    git commit -m "Deploy to Railway - $(date '+%Y-%m-%d %H:%M:%S')"
fi

# 원격 저장소 확인
if ! git remote get-url origin &> /dev/null; then
    print_error "원격 저장소(origin)가 설정되지 않았습니다."
    print_info "다음 명령어로 원격 저장소를 추가해주세요:"
    print_info "git remote add origin https://github.com/USERNAME/REPOSITORY.git"
    exit 1
fi

print_status "원격 저장소 확인 완료"

# 푸시
print_info "GitHub에 코드 푸시 중..."
git push origin main

print_status "코드 푸시 완료"

# Railway 배포 정보 표시
echo ""
echo -e "${BLUE}🚀 Railway 배포가 시작됩니다!${NC}"
echo ""
echo "다음 단계를 확인해주세요:"
echo ""
echo "1. Railway 대시보드 접속: https://railway.app/dashboard"
echo "2. 프로젝트 선택: css-picker-backend"
echo "3. Deployments 탭에서 배포 진행상황 확인"
echo ""
echo "배포 완료 후 테스트:"
echo "• 헬스체크: curl https://your-app.railway.app/health"
echo "• API 테스트: curl https://your-app.railway.app/api/user/profile"
echo ""

# Railway CLI가 설치되어 있다면 자동으로 로그 표시
if command -v railway &> /dev/null; then
    read -p "Railway CLI로 배포 로그를 실시간으로 보시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Railway 로그 표시 중... (Ctrl+C로 종료)"
        railway logs
    fi
else
    print_warning "Railway CLI가 설치되지 않았습니다."
    print_info "설치하려면: npm install -g @railway/cli"
fi

print_status "배포 스크립트 완료! 🎉"