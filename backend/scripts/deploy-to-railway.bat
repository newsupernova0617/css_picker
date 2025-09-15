@echo off
setlocal enabledelayedexpansion

REM CSS Picker - Railway 배포 스크립트 (Windows)
REM 사용법: scripts\deploy-to-railway.bat

echo 🚀 CSS Picker Railway 배포 시작...
echo.

REM railway.toml 파일 존재 확인
if not exist "railway.toml" (
    echo ❌ railway.toml이 없습니다. backend 디렉토리에서 실행해주세요.
    pause
    exit /b 1
)

echo ✅ 현재 디렉토리 확인 완료
echo.

REM Git 상태 확인
git status >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Git 저장소가 아닙니다. git init을 먼저 실행해주세요.
    pause
    exit /b 1
)

echo ℹ️ Git 상태 확인 중...

REM 변경사항 확인
git diff --quiet >nul 2>&1
if !errorlevel! neq 0 (
    echo ⚠️ 커밋되지 않은 변경사항이 있습니다.
    echo 변경된 파일들:
    git status --porcelain
    echo.

    set /p continue="계속 진행하시겠습니까? 변경사항을 커밋하고 푸시합니다. (y/n): "
    if /i "!continue!" neq "y" (
        echo ℹ️ 배포를 취소했습니다.
        pause
        exit /b 0
    )

    echo ℹ️ 변경사항 커밋 중...
    git add .
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set mydate=%%c-%%a-%%b
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a:%%b
    git commit -m "Deploy to Railway - !mydate! !mytime!"
)

REM 원격 저장소 확인
git remote get-url origin >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ 원격 저장소(origin)가 설정되지 않았습니다.
    echo ℹ️ 다음 명령어로 원격 저장소를 추가해주세요:
    echo git remote add origin https://github.com/USERNAME/REPOSITORY.git
    pause
    exit /b 1
)

echo ✅ 원격 저장소 확인 완료

REM 푸시
echo ℹ️ GitHub에 코드 푸시 중...
git push origin main

if !errorlevel! neq 0 (
    echo ❌ GitHub 푸시 실패. 네트워크 연결이나 권한을 확인해주세요.
    pause
    exit /b 1
)

echo ✅ 코드 푸시 완료
echo.

REM Railway 배포 정보 표시
echo 🚀 Railway 배포가 시작됩니다!
echo.
echo 다음 단계를 확인해주세요:
echo.
echo 1. Railway 대시보드 접속: https://railway.app/dashboard
echo 2. 프로젝트 선택: css-picker-backend
echo 3. Deployments 탭에서 배포 진행상황 확인
echo.
echo 배포 완료 후 테스트:
echo • 헬스체크: curl https://your-app.railway.app/health
echo • API 테스트: curl https://your-app.railway.app/api/user/profile
echo.

REM Railway CLI 확인
railway --version >nul 2>&1
if !errorlevel! equ 0 (
    set /p showlogs="Railway CLI로 배포 로그를 실시간으로 보시겠습니까? (y/n): "
    if /i "!showlogs!" equ "y" (
        echo ℹ️ Railway 로그 표시 중... (Ctrl+C로 종료)
        railway logs
    )
) else (
    echo ⚠️ Railway CLI가 설치되지 않았습니다.
    echo ℹ️ 설치하려면: npm install -g @railway/cli
)

echo.
echo ✅ 배포 스크립트 완료! 🎉
pause