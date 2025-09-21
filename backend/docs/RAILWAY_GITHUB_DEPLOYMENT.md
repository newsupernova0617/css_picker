# Railway GitHub 연동 배포 가이드

## 📋 사전 준비사항

### 1. 필수 계정 생성
- [Railway 계정](https://railway.app)
- [GitHub 계정](https://github.com) (기존 계정 사용)
- [Turso 계정](https://turso.tech) (데이터베이스)
- [Clerk 계정](https://clerk.dev) (인증)
- [Stripe 계정](https://stripe.com) (결제)

### 2. 로컬 Git 설정 확인
```bash
# 현재 Git 상태 확인
git status
git remote -v

# Git이 설정되어 있지 않다면
git init
git add .
git commit -m "Initial commit for Railway deployment"
```

## 🚀 단계별 배포 가이드

### 1단계: GitHub Repository 준비

#### 1-1. GitHub에 Repository 생성
1. GitHub.com 접속 → 우상단 `+` → `New repository`
2. Repository name: `css-picker` (또는 원하는 이름)
3. Public/Private 선택 (Private 권장)
4. **❌ Initialize with README 체크하지 말기** (기존 코드가 있으므로)
5. `Create repository` 클릭

#### 1-2. 로컬 코드를 GitHub에 Push
```bash
# GitHub repository URL 복사 후
cd "C:/Users/yj437/OneDrive/Desktop/coding/css_picker/css_picker"

# 기존 remote가 있다면 제거
git remote remove origin

# 새 remote 추가 (본인의 repository URL로 변경)
git remote add origin https://github.com/USERNAME/css-picker.git

# 브랜치명 확인/변경
git branch -M main

# 코드 푸시
git add .
git commit -m "Add Railway deployment configuration"
git push -u origin main
```

### 2단계: Railway 프로젝트 생성

#### 2-1. Railway 로그인 및 프로젝트 생성
1. [Railway.app](https://railway.app) 접속
2. `Login` → GitHub 계정으로 로그인
3. 대시보드에서 `New Project` 클릭
4. `Deploy from GitHub repo` 선택

#### 2-2. Repository 연결
1. **GitHub repository 선택**
   - 방금 생성한 `css-picker` repository 선택
   - Private repo의 경우 권한 승인 필요

2. **프로젝트 설정**
   - Project name: `css-picker-backend`
   - Environment: `Production` 선택

3. **Root Directory 설정 (중요!)**
   - `Configure` 클릭
   - Root Directory: `backend` 입력
   - 이렇게 해야 backend 폴더만 배포됨

### 3단계: 환경변수 설정

#### 3-1. Railway에서 환경변수 추가
Railway 프로젝트 대시보드에서:

1. **`Variables` 탭 클릭**
2. **다음 환경변수들을 하나씩 추가:**

```env
# Flask 기본 설정
FLASK_ENV=production
SECRET_KEY=여기에32자리이상의랜덤문자열입력

# 데이터베이스 (나중에 설정)
DATABASE_URL=libsql://your-database-url.turso.io
AUTH_TOKEN=your-turso-auth-token

# 인증 (나중에 설정)
CLERK_PUBLISHABLE_KEY=pk_live_your-key
CLERK_SECRET_KEY=sk_live_your-key
CLERK_WEBHOOK_SECRET=whsec_your-webhook-secret

# 결제 (나중에 설정)
STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# CORS (나중에 업데이트)
CORS_ORIGINS=https://your-app.railway.app,chrome-extension://your-extension-id
```

#### 3-2. SECRET_KEY 생성
```bash
# Python으로 안전한 SECRET_KEY 생성
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4단계: 서비스별 설정

#### 4-1. Turso 데이터베이스 설정

```bash
# Turso CLI 설치 (Windows)
curl -sSfL https://get.tur.so/install.sh | bash

# 데이터베이스 생성
turso auth login
turso db create css-picker-prod

# 연결 정보 확인
turso db show css-picker-prod
turso db tokens create css-picker-prod
```

**Railway에 추가할 정보:**
- `DATABASE_URL`: `libsql://css-picker-prod-[username].turso.io`
- `AUTH_TOKEN`: 생성된 토큰값

#### 4-2. Clerk 인증 설정

1. **Clerk 대시보드에서:**
   - Applications → 새 앱 생성
   - Settings → API Keys에서 키 복사
   - Settings → Domains에서 Railway 도메인 추가

2. **Railway에 추가할 정보:**
   - `CLERK_PUBLISHABLE_KEY`: `pk_live_...`
   - `CLERK_SECRET_KEY`: `sk_live_...`
   - `CLERK_WEBHOOK_SECRET`: Webhooks에서 생성

#### 4-3. Stripe 결제 설정

1. **Stripe 대시보드에서:**
   - API keys에서 Live keys 복사
   - Webhooks → Add endpoint
   - URL: `https://your-app.railway.app/api/webhooks/stripe`

2. **Railway에 추가할 정보:**
   - `STRIPE_PUBLISHABLE_KEY`: `pk_live_...`
   - `STRIPE_SECRET_KEY`: `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET`: Webhook 시크릿

### 5단계: 배포 실행

#### 5-1. 자동 배포 트리거
```bash
# 코드 변경 후 자동 배포
git add .
git commit -m "Update for Railway deployment"
git push origin main
```

#### 5-2. Railway에서 배포 확인
1. Railway 대시보드에서 `Deployments` 탭 확인
2. 빌드 로그 실시간 모니터링
3. 배포 완료 후 URL 확인

#### 5-3. 도메인 확인 및 업데이트
1. **Railway 도메인 확인:**
   - Settings → Domains에서 생성된 URL 확인
   - 예: `css-picker-backend-production.up.railway.app`

2. **CORS_ORIGINS 업데이트:**
   ```env
   CORS_ORIGINS=https://css-picker-backend-production.up.railway.app,chrome-extension://your-extension-id
   ```

### 6단계: 배포 테스트

#### 6-1. 기본 헬스체크
```bash
# 기본 헬스체크
curl https://your-app.railway.app/health

# 상세 헬스체크
curl https://your-app.railway.app/health/detailed

# API 엔드포인트 테스트 (401 응답이 정상)
curl https://your-app.railway.app/api/user/profile
```

#### 6-2. 로그 확인
Railway 대시보드에서:
1. `Logs` 탭에서 실시간 로그 확인
2. 에러 발생시 로그에서 원인 파악

## 🔧 문제 해결

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# railway.toml의 buildCommand 확인
buildCommand = "pip install -r requirements-production.txt"

# requirements-production.txt 파일 존재 확인
ls backend/requirements-production.txt
```

#### 2. 앱 시작 실패
```bash
# Procfile과 railway.toml의 startCommand 일치 확인
# gunicorn_railway_config.py 파일 존재 확인
```

#### 3. 환경변수 문제
- Railway 대시보드에서 Variables 탭 확인
- 모든 필수 환경변수가 설정되었는지 확인

#### 4. 데이터베이스 연결 실패
```bash
# Turso 연결 테스트
turso db shell css-picker-prod

# DATABASE_URL과 AUTH_TOKEN 값 재확인
```

### 디버깅 팁

#### 1. 로그 실시간 모니터링
Railway CLI 사용:
```bash
npm install -g @railway/cli
railway login
railway logs
```

#### 2. 환경변수 출력으로 확인
임시로 production_app.py에 추가:
```python
print(f"DATABASE_URL: {os.environ.get('DATABASE_URL', 'NOT_SET')}")
print(f"FLASK_ENV: {os.environ.get('FLASK_ENV', 'NOT_SET')}")
```

## 🚀 자동화된 배포 워크플로우

### GitHub Actions 설정 (선택사항)
```yaml
# .github/workflows/railway-deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: echo "Railway will auto-deploy on push"
```

### 자동 배포 플로우
1. **개발 완료** → `git commit`
2. **GitHub Push** → `git push origin main`
3. **Railway 감지** → 자동 빌드 시작
4. **빌드 완료** → 새 버전 배포
5. **헬스체크** → 서비스 정상 확인

## 📊 모니터링 및 유지보수

### Railway 대시보드 활용
1. **Metrics**: CPU, Memory, Network 사용량
2. **Logs**: 실시간 애플리케이션 로그
3. **Deployments**: 배포 히스토리 및 롤백
4. **Variables**: 환경변수 관리

### 알림 설정
1. Railway 프로젝트 → Settings → Notifications
2. 배포 실패시 이메일 알림 설정
3. Webhook 설정으로 Slack 연동 가능

이제 GitHub 연동을 통한 Railway 배포가 완전히 준비되었습니다! 🎉