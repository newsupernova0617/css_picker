# Railway 환경변수 설정 체크리스트

## 📋 배포 전 필수 체크리스트

배포하기 전에 다음 항목들을 모두 확인하고 체크해주세요.

### ✅ 1. 기본 Flask 설정

- [ ] **FLASK_ENV** = `production`
- [ ] **SECRET_KEY** = `32자리 이상의 안전한 랜덤 문자열`

SECRET_KEY 생성 명령어:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### ✅ 2. 데이터베이스 (Turso) 설정

- [ ] Turso 계정 생성 완료
- [ ] 데이터베이스 생성 완료
- [ ] **DATABASE_URL** = `libsql://your-database-name-username.turso.io`
- [ ] **AUTH_TOKEN** = `turso db tokens create 명령어로 생성된 토큰`

Turso 설정 명령어:
```bash
# 데이터베이스 생성
turso db create css-picker-prod

# 연결 정보 확인
turso db show css-picker-prod

# 토큰 생성
turso db tokens create css-picker-prod
```

### ✅ 3. 인증 (Clerk) 설정

- [ ] Clerk 계정 생성 완료
- [ ] 애플리케이션 생성 완료
- [ ] **CLERK_PUBLISHABLE_KEY** = `pk_live_...`
- [ ] **CLERK_SECRET_KEY** = `sk_live_...`
- [ ] **CLERK_WEBHOOK_SECRET** = `whsec_...`
- [ ] Clerk 대시보드에서 Railway 도메인 허용 설정 완료

Clerk 설정 위치:
- API Keys: Dashboard → API Keys
- Domains: Dashboard → Domains → Add domain

### ✅ 4. 결제 (Stripe) 설정

- [ ] Stripe 계정 생성 완료
- [ ] Live mode 활성화 완료
- [ ] **STRIPE_PUBLISHABLE_KEY** = `pk_live_...`
- [ ] **STRIPE_SECRET_KEY** = `sk_live_...`
- [ ] **STRIPE_WEBHOOK_SECRET** = `whsec_...`
- [ ] Stripe 웹훅 엔드포인트 설정 완료

Stripe 웹훅 설정:
- URL: `https://your-app.railway.app/api/webhooks/stripe`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### ✅ 5. CORS 설정

- [ ] **CORS_ORIGINS** 설정 완료

설정 예시:
```
https://your-app.railway.app,chrome-extension://your-extension-id,http://localhost:3000
```

## 🔧 Railway 대시보드 설정 방법

### 1. 환경변수 추가하는 방법
1. Railway 프로젝트 대시보드 이동
2. `Variables` 탭 클릭
3. `New Variable` 클릭
4. Name과 Value 입력
5. `Add` 클릭

### 2. 환경변수 복사-붙여넣기 방법
```env
FLASK_ENV=production
SECRET_KEY=여기에-생성된-SECRET-KEY-입력
DATABASE_URL=libsql://your-database-url.turso.io
AUTH_TOKEN=여기에-turso-토큰-입력
CLERK_PUBLISHABLE_KEY=pk_live_여기에-clerk-키-입력
CLERK_SECRET_KEY=sk_live_여기에-clerk-시크릿-입력
CLERK_WEBHOOK_SECRET=whsec_여기에-clerk-웹훅-시크릿-입력
STRIPE_PUBLISHABLE_KEY=pk_live_여기에-stripe-키-입력
STRIPE_SECRET_KEY=sk_live_여기에-stripe-시크릿-입력
STRIPE_WEBHOOK_SECRET=whsec_여기에-stripe-웹훅-시크릿-입력
CORS_ORIGINS=https://your-app.railway.app,chrome-extension://your-extension-id
```

## 🚀 배포 후 확인사항

### ✅ 배포 완료 후 테스트

- [ ] **기본 헬스체크**: `curl https://your-app.railway.app/health`
- [ ] **상세 헬스체크**: `curl https://your-app.railway.app/health/detailed`
- [ ] **API 엔드포인트**: `curl https://your-app.railway.app/api/user/profile` (401 응답이 정상)
- [ ] **Railway 로그 확인**: 오류 메시지 없음

### ✅ 서비스 연동 확인

- [ ] **데이터베이스 연결**: 로그에서 "Database initialization completed" 메시지 확인
- [ ] **Clerk 연동**: Chrome 확장프로그램에서 로그인 테스트
- [ ] **Stripe 연동**: 결제 기능 테스트
- [ ] **CORS 설정**: Chrome 확장프로그램에서 API 호출 테스트

## 🔍 문제 해결 가이드

### 데이터베이스 연결 실패
```bash
# Turso 연결 테스트
turso db shell css-picker-prod

# DATABASE_URL 형식 확인 (libsql:// 프로토콜 사용)
# AUTH_TOKEN 값 재확인
```

### Clerk 인증 실패
- Clerk 대시보드에서 Railway 도메인이 허용되었는지 확인
- API Keys가 Live 모드 키인지 확인 (Test 모드 아님)

### Stripe 결제 실패
- Stripe가 Live 모드인지 확인
- 웹훅 엔드포인트 URL이 정확한지 확인
- 웹훅 시크릿이 올바른지 확인

### CORS 오류
- Chrome 확장프로그램 ID가 정확한지 확인
- Railway 도메인이 정확한지 확인
- 프로토콜(https://)이 포함되었는지 확인

## 📞 지원 및 문의

- **Railway 문서**: https://docs.railway.app
- **Turso 문서**: https://docs.turso.tech
- **Clerk 문서**: https://clerk.dev/docs
- **Stripe 문서**: https://stripe.com/docs

## 🎉 배포 완료!

모든 체크리스트를 완료했다면 Railway 배포가 성공적으로 완료되었습니다!

Chrome 확장프로그램의 API 엔드포인트를 Railway 도메인으로 업데이트하는 것을 잊지 마세요.