# 백업 자동화 시스템 설정 가이드

## 개요

CSS Picker 백엔드의 종합적인 백업 자동화 시스템입니다. 데이터베이스, 설정 파일, 애플리케이션 코드, 로그 파일을 자동으로 백업하고 복구 기능을 제공합니다.

## 주요 기능

- ✅ **Turso 데이터베이스 백업** (SQL 덤프)
- ✅ **SQLite 로컬 DB 백업** (온라인 백업)
- ✅ **설정 파일 백업** (app.py, .env, requirements.txt)
- ✅ **애플리케이션 코드 백업** (Python, JavaScript, HTML, CSS)
- ✅ **로그 파일 백업**
- ✅ **정적 파일 백업** (업로드된 파일, assets)
- ✅ **압축 및 체크섬 검증**
- ✅ **AWS S3 클라우드 백업**
- ✅ **자동 정리** (보존 정책)
- ✅ **복구 기능**
- ✅ **Cron/작업 스케줄러 통합**

## 환경변수 설정

`.env` 파일에 다음 설정을 추가하세요:

```env
# 백업 설정
BACKUP_DIR=/var/backups/css_picker              # 백업 저장 디렉토리
BACKUP_RETENTION_DAYS=30                        # 백업 보존 기간 (일)
MAX_BACKUP_COUNT=100                            # 최대 백업 개수

# Turso 데이터베이스 백업용
TURSO_DATABASE_NAME=css-picker                  # Turso DB 이름

# AWS S3 백업 (선택사항)
AWS_S3_BACKUP_BUCKET=css-picker-backups        # S3 버킷명
AWS_ACCESS_KEY_ID=your-access-key               # AWS Access Key
AWS_SECRET_ACCESS_KEY=your-secret-key           # AWS Secret Key
AWS_DEFAULT_REGION=us-east-1                   # AWS 리전
```

## 설치 및 설정

### 1. 의존성 설치

```bash
pip install boto3  # AWS S3 백업용 (선택사항)
```

### 2. Turso CLI 설치 (필수)

```bash
# Linux/macOS
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
powershell -c "irm https://get.tur.so/install.ps1 | iex"
```

### 3. 백업 디렉토리 생성

```bash
# Linux/macOS
sudo mkdir -p /var/backups/css_picker
sudo chown $USER:$USER /var/backups/css_picker

# Windows
mkdir C:\backups\css_picker
```

## 사용 방법

### 수동 백업 실행

```bash
# 전체 백업
python backup_automation.py

# 사용 가능한 백업 목록 확인
python backup_automation.py --list

# 백업 복원
python backup_automation.py --restore css_picker_full_20231201_140530
```

### 자동 백업 설정

#### Linux/macOS (Cron Job)

1. **Cron 스크립트 설정**
```bash
python backup_automation.py --setup-cron
```

2. **Cron Job 등록**
```bash
sudo crontab -e

# 다음 라인 추가 (매일 새벽 2시 실행)
0 2 * * * /usr/local/bin/css_picker_backup.sh
```

3. **Cron 상태 확인**
```bash
sudo crontab -l
sudo systemctl status cron
```

#### Windows (작업 스케줄러)

1. **작업 스케줄러 열기**
   - `Win + R` → `taskschd.msc`

2. **기본 작업 만들기**
   - 이름: `CSS Picker Daily Backup`
   - 트리거: 매일 새벽 2시
   - 동작: 프로그램 시작
   - 프로그램: `C:\path\to\backend\backup_automation_windows.bat`

3. **PowerShell 명령어로 생성**
```powershell
schtasks /create /sc daily /tn "CSS Picker Backup" /tr "C:\path\to\backup_automation_windows.bat" /st 02:00 /ru "SYSTEM"
```

## AWS S3 클라우드 백업 설정

### 1. S3 버킷 생성

```bash
# AWS CLI로 버킷 생성
aws s3 mb s3://css-picker-backups --region us-east-1

# 버킷 정책 설정 (수명 주기 관리)
aws s3api put-bucket-lifecycle-configuration --bucket css-picker-backups --lifecycle-configuration file://lifecycle.json
```

### 2. 수명 주기 정책 (lifecycle.json)

```json
{
  "Rules": [
    {
      "ID": "BackupLifecycle",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "backups/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 2555
      }
    }
  ]
}
```

### 3. IAM 정책 설정

최소 권한 IAM 정책:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::css-picker-backups",
        "arn:aws:s3:::css-picker-backups/*"
      ]
    }
  ]
}
```

## 백업 내용

### 백업되는 파일들

1. **데이터베이스**
   - Turso 데이터베이스 (SQL 덤프)
   - 로컬 SQLite 파일들

2. **설정 파일**
   - `app.py` (메인 애플리케이션)
   - `.env.example` (환경변수 템플릿)
   - `requirements.txt`
   - `mfa_system.py`
   - `redis_session_manager.py`

3. **애플리케이션 코드**
   - Python 파일 (`*.py`)
   - JavaScript 파일 (`*.js`)
   - HTML 템플릿 (`*.html`)
   - CSS 스타일시트 (`*.css`)
   - JSON 설정 (`*.json`)
   - Markdown 문서 (`*.md`)

4. **로그 파일**
   - `app.log`
   - `error.log`
   - `/var/log/css_picker/`

5. **정적 파일**
   - `static/` 디렉토리
   - `uploads/` 디렉토리
   - `assets/` 디렉토리

### 제외되는 파일들

- `__pycache__/` (Python 캐시)
- `.git/` (Git 리포지토리)
- `node_modules/` (Node.js 의존성)
- `.env` (민감한 환경변수)
- `*.log` (실시간 로그 파일)
- `backups/` (기존 백업)

## 백업 검증

### 체크섬 검증

모든 백업 파일은 SHA256 체크섬으로 무결성을 검증합니다:

```python
# 체크섬 확인 예제
import hashlib

def verify_backup(zip_file, expected_checksum):
    sha256_hash = hashlib.sha256()
    with open(zip_file, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    
    actual_checksum = sha256_hash.hexdigest()
    return actual_checksum == expected_checksum
```

### 백업 테스트

```bash
# 백업 생성 및 테스트
python backup_automation.py

# 백업 복원 테스트
python backup_automation.py --restore css_picker_full_YYYYMMDD_HHMMSS

# 복원된 데이터베이스 검증
sqlite3 /tmp/css_picker_restore/databases/backup.db ".tables"
```

## 모니터링 및 알림

### 로그 모니터링

```bash
# 백업 로그 확인
tail -f /var/log/css_picker_backup.log

# 오류만 필터링
grep "ERROR\|FAILED" /var/log/css_picker_backup.log
```

### 알림 설정

#### 이메일 알림 (Linux)

```bash
# postfix 설치
sudo apt-get install postfix mailutils

# 백업 실패시 이메일 발송
if [ $? -ne 0 ]; then
    echo "CSS Picker backup failed at $(date)" | mail -s "Backup Failure Alert" admin@example.com
fi
```

#### Slack 알림

```python
import requests

def send_slack_notification(message):
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    if webhook_url:
        payload = {
            'text': f'CSS Picker Backup: {message}',
            'channel': '#alerts',
            'username': 'backup-bot'
        }
        requests.post(webhook_url, json=payload)
```

## 복구 절차

### 1. 전체 시스템 복구

```bash
# 1. 백업 복원
python backup_automation.py --restore css_picker_full_20231201_140530

# 2. 데이터베이스 복구
# Turso 데이터베이스
turso db shell css-picker < /tmp/css_picker_restore/databases/turso_css-picker.sql

# SQLite 로컬 DB
cp /tmp/css_picker_restore/databases/local_backup.db ./local.db

# 3. 설정 파일 복구
cp /tmp/css_picker_restore/config/.env.example ./.env.example
cp /tmp/css_picker_restore/config/app.py ./app.py

# 4. 애플리케이션 코드 복구
cp -r /tmp/css_picker_restore/application/* ./

# 5. 정적 파일 복구
cp -r /tmp/css_picker_restore/static/* ./static/
```

### 2. 선택적 복구

```bash
# 데이터베이스만 복구
python backup_automation.py --restore css_picker_full_20231201_140530
turso db shell css-picker < /tmp/css_picker_restore/databases/turso_css-picker.sql

# 설정 파일만 복구
cp /tmp/css_picker_restore/config/app.py ./app.py
```

## 성능 최적화

### 백업 크기 최적화

```bash
# 백업 전 임시 파일 정리
find . -name "*.pyc" -delete
find . -name "__pycache__" -exec rm -rf {} +
find . -name "*.log" -size +100M -delete
```

### 압축 최적화

```python
# 압축 레벨 조정 (0-9, 9가 최고 압축률)
zipfile.ZIP_DEFLATED, compresslevel=9
```

### 네트워크 최적화

```python
# S3 멀티파트 업로드 설정
upload_config = boto3.s3.transfer.TransferConfig(
    multipart_threshold=1024 * 25,  # 25MB
    max_concurrency=10,
    multipart_chunksize=1024 * 25,
    use_threads=True
)
```

## 트러블슈팅

### 일반적인 문제

1. **권한 오류**
```
PermissionError: [Errno 13] Permission denied
```
**해결책**: 백업 디렉토리 권한 확인
```bash
sudo chown -R $USER:$USER /var/backups/css_picker
chmod -R 755 /var/backups/css_picker
```

2. **디스크 공간 부족**
```
OSError: [Errno 28] No space left on device
```
**해결책**: 디스크 공간 확인 및 정리
```bash
df -h
python backup_automation.py --list
# 오래된 백업 수동 삭제
```

3. **Turso CLI 오류**
```
turso: command not found
```
**해결책**: Turso CLI 재설치
```bash
curl -sSfL https://get.tur.so/install.sh | bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

4. **S3 업로드 실패**
```
ClientError: The AWS Access Key Id you provided does not exist
```
**해결책**: AWS 자격증명 확인
```bash
aws configure list
aws s3 ls s3://css-picker-backups/
```

### 백업 검증 실패

```bash
# 체크섬 불일치 시
echo "Backup integrity check failed"
# 백업 재생성 또는 이전 백업 사용
```

### 복구 실패

```bash
# 복구 중 오류 발생시
echo "Restore failed, checking backup integrity..."
python -c "
import zipfile
try:
    with zipfile.ZipFile('backup.zip', 'r') as zf:
        zf.testzip()
    print('Backup file is valid')
except:
    print('Backup file is corrupted')
"
```

## 보안 고려사항

1. **백업 파일 암호화**
```bash
# GPG로 백업 파일 암호화
gpg --symmetric --cipher-algo AES256 backup.zip
```

2. **접근 권한 제한**
```bash
chmod 600 /var/backups/css_picker/*
```

3. **AWS 자격증명 보안**
```bash
# IAM 역할 사용 (EC2 인스턴스의 경우)
# 환경변수에서 자격증명 제거
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
```

4. **백업 로그 보안**
```bash
# 로그 파일에서 민감한 정보 제거
sed -i 's/password=[^[:space:]]*/password=***/g' /var/log/css_picker_backup.log
```

## 비용 최적화

### S3 스토리지 클래스

- **Standard**: 즉시 접근 필요한 최근 백업
- **Standard-IA**: 30일 후 자동 이동
- **Glacier**: 장기 보관 (90일 후)
- **Deep Archive**: 초장기 보관 (1년 후)

### 데이터 중복 제거

```python
# 증분 백업 구현 (향후 개선사항)
def create_incremental_backup(last_backup_date):
    # 마지막 백업 이후 변경된 파일만 백업
    pass
```

## 모니터링 대시보드

백업 상태를 웹 대시보드에서 확인할 수 있도록 API 엔드포인트 제공:

- `GET /api/admin/backup/status` - 백업 상태 조회
- `POST /api/admin/backup/create` - 수동 백업 실행
- `GET /api/admin/backup/list` - 백업 목록 조회
- `POST /api/admin/backup/restore` - 백업 복원