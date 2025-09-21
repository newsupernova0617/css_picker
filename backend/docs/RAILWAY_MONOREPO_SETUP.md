# Railway Monorepo 배포 가이드

## 🎯 Backend 폴더만 배포하기

현재 상황: 전체 프로젝트 저장소에서 `backend` 폴더만 Railway에 배포하고 싶음

## ✅ 방법 1: Railway Root Directory 설정 (추천)

### 1단계: Railway 프로젝트 생성
1. [Railway.app](https://railway.app) 로그인
2. `New Project` → `Deploy from GitHub repo`
3. `newsupernova0617/css_picker` 저장소 선택

### 2단계: Root Directory 설정
1. 프로젝트 생성 후 **Settings** 탭 이동
2. **Service** 섹션에서 **Root Directory** 설정:
   ```
   Root Directory: backend
   ```
3. **Save Changes** 클릭

### 3단계: 배포 확인
- Railway가 `backend` 폴더를 프로젝트 루트로 인식
- `backend/railway.toml`, `backend/Procfile` 등이 정상 작동
- 빌드 로그에서 `backend` 폴더 내 파일들만 처리되는 것 확인

## 🔧 방법 2: 별도 Backend 저장소 생성

더 깔끔한 분리를 원한다면:

### 1단계: 새 GitHub 저장소 생성
1. GitHub에서 `css-picker-backend` 저장소 생성
2. Public/Private 선택 (Private 권장)

### 2단계: Backend 폴더를 별도 저장소로 이동
```bash
cd backend

# 새 Git 저장소 초기화
rm -rf .git
git init
git branch -M main

# 모든 파일 추가
git add .
git commit -m "Initial commit: CSS Picker Backend for Railway"

# 새 저장소와 연결
git remote add origin https://github.com/USERNAME/css-picker-backend.git
git push -u origin main
```

### 3단계: Railway에서 새 저장소 연결
- Railway에서 새 프로젝트 생성
- `css-picker-backend` 저장소 선택
- Root Directory 설정 불필요 (이미 루트가 backend)

## 🔄 방법 3: Git Subtree 자동 동기화

메인 저장소와 backend 저장소를 자동 동기화:

### 설정 방법
```bash
# 메인 프로젝트 루트에서
cd css_picker

# Backend 저장소 원격 추가
git remote add backend-repo https://github.com/USERNAME/css-picker-backend.git

# Backend 폴더를 별도 저장소로 푸시
git subtree push --prefix=backend backend-repo main
```

### 동기화 명령어
```bash
# Backend 변경사항을 별도 저장소에 동기화
git subtree push --prefix=backend backend-repo main

# 별도 저장소 변경사항을 메인으로 가져오기
git subtree pull --prefix=backend backend-repo main
```

## 📋 각 방법의 장단점

### 방법 1: Railway Root Directory
**장점:**
- 가장 간단함
- 기존 저장소 구조 유지
- 추가 설정 최소

**단점:**
- 전체 저장소를 클론하지만 backend만 빌드
- 빌드 시간이 약간 길어질 수 있음

### 방법 2: 별도 저장소
**장점:**
- 완전한 분리
- 빌드 시간 최적화
- Backend만의 독립적인 버전 관리

**단점:**
- 수동 동기화 필요
- 저장소 관리 복잡성 증가

### 방법 3: Git Subtree
**장점:**
- 자동 동기화
- 양쪽 저장소 모두 최신 상태 유지
- 완전한 분리 + 동기화

**단점:**
- Git Subtree 명령어 학습 필요
- 설정이 복잡함

## 🎯 권장 사항

**초보자/간단한 프로젝트**: 방법 1 (Railway Root Directory)
**중급자/깔끔한 분리**: 방법 2 (별도 저장소)
**고급자/자동화**: 방법 3 (Git Subtree)

## 🚀 즉시 배포 가능

현재 상태에서 **방법 1**을 사용하면 바로 배포 가능합니다:

1. Railway 프로젝트 생성
2. `newsupernova0617/css_picker` 연결
3. Root Directory: `backend` 설정
4. 환경변수 설정
5. 배포 완료!

모든 Railway 설정 파일이 이미 `backend` 폴더에 준비되어 있습니다.