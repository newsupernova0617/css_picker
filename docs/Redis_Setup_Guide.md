# Redis Session Storage 설정 가이드

## 개요

CSS Picker 백엔드는 고성능 세션 관리를 위해 Redis를 선택적으로 사용할 수 있습니다. Redis가 설치되지 않은 환경에서도 정상 작동하도록 fallback 메커니즘이 구현되어 있습니다.

## Redis 설치

### Windows 환경
```bash
# Chocolatey를 사용한 설치
choco install redis-64

# 또는 WSL에서 설치
wsl --install Ubuntu
wsl
sudo apt update
sudo apt install redis-server
```

### Linux/macOS
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# macOS (Homebrew)
brew install redis

# CentOS/RHEL
sudo yum install redis
```

### Docker를 사용한 설치
```bash
# Redis 컨테이너 실행
docker run -d --name css-picker-redis -p 6379:6379 redis:7-alpine

# 영구 데이터 저장을 위한 볼륨 마운트
docker run -d --name css-picker-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine redis-server --appendonly yes
```

## 환경변수 설정

`.env` 파일에 다음 환경변수를 추가하세요:

```env
# Redis 설정 (선택사항)
REDIS_URL=redis://localhost:6379/0
SESSION_TIMEOUT=3600          # 세션 유효시간 (초) - 기본 1시간
REMEMBER_ME_TIMEOUT=2592000   # "나를 기억해" 세션 시간 (초) - 기본 30일

# 클라우드 Redis (예: Redis Cloud, AWS ElastiCache)
# REDIS_URL=redis://username:password@host:port/db
```

## 클라우드 Redis 설정

### Redis Cloud
1. [Redis Cloud](https://cloud.redislabs.com)에서 무료 계정 생성
2. 새 데이터베이스 생성 (30MB 무료)
3. 연결 정보를 환경변수에 설정:
```env
REDIS_URL=redis://default:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
```

### AWS ElastiCache
```env
# ElastiCache 클러스터 엔드포인트
REDIS_URL=redis://your-cluster.cache.amazonaws.com:6379
```

### Google Cloud Memorystore
```env
# Memorystore 인스턴스 IP
REDIS_URL=redis://10.0.0.1:6379
```

## API 엔드포인트

Redis 세션 관리를 위한 API 엔드포인트:

### 세션 관리
- `POST /api/session/create` - 새 세션 생성
- `GET /api/session/validate` - 세션 유효성 확인
- `POST /api/session/refresh` - 세션 갱신
- `POST /api/session/logout` - 단일 세션 로그아웃
- `POST /api/session/logout-all` - 모든 세션 로그아웃
- `GET /api/session/stats` - 세션 통계

### 캐시 관리
- `GET /api/cache/user/{user_id}` - 사용자 데이터 캐시 조회
- `POST /api/cache/user/{user_id}` - 사용자 데이터 캐시 저장

## 사용 예제

### JavaScript (Chrome Extension)
```javascript
// 세션 생성
async function createSession(rememberMe = false) {
    const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${clerkToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ remember_me: rememberMe })
    });
    
    const data = await response.json();
    if (data.success) {
        // 세션 토큰을 안전하게 저장
        localStorage.setItem('session_token', data.session_token);
    }
}

// 세션 유효성 검증
async function validateSession() {
    const sessionToken = localStorage.getItem('session_token');
    
    const response = await fetch('/api/session/validate', {
        headers: {
            'X-Session-Token': sessionToken
        }
    });
    
    const data = await response.json();
    return data.valid;
}

// 로그아웃
async function logout() {
    const sessionToken = localStorage.getItem('session_token');
    
    await fetch('/api/session/logout', {
        method: 'POST',
        headers: {
            'X-Session-Token': sessionToken
        }
    });
    
    localStorage.removeItem('session_token');
}
```

## 성능 최적화

### Redis 설정 최적화
```redis
# /etc/redis/redis.conf 또는 redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 연결 풀링
```python
# Redis 연결 풀 설정 (이미 구현됨)
REDIS_CONFIG = {
    'decode_responses': True,
    'health_check_interval': 30,
    'retry_on_timeout': True,
    'socket_connect_timeout': 5,
    'socket_timeout': 5
}
```

## 모니터링

### Redis 상태 확인
```bash
# Redis 서버 상태
redis-cli ping

# 메모리 사용량
redis-cli info memory

# 연결된 클라이언트
redis-cli info clients

# 키 통계
redis-cli info keyspace
```

### API를 통한 모니터링
```javascript
// 세션 통계 조회
async function getSessionStats() {
    const response = await fetch('/api/session/stats', {
        headers: {
            'Authorization': `Bearer ${clerkToken}`
        }
    });
    
    const data = await response.json();
    console.log('세션 통계:', data.stats);
}
```

## 보안 설정

### Redis 보안 권장사항
```redis
# redis.conf 보안 설정
requirepass your-strong-password
bind 127.0.0.1 ::1  # 로컬 연결만 허용
protected-mode yes
port 6379
timeout 0
```

### 네트워크 보안
- 방화벽에서 Redis 포트(6379) 외부 접근 차단
- VPN 또는 프라이빗 네트워크 사용
- TLS/SSL 암호화 활성화 (Redis 6.0+)

## 백업 및 복구

### 자동 백업 설정
```bash
# Cron job으로 일일 백업
0 2 * * * /usr/bin/redis-cli --rdb /backup/redis-$(date +\%Y\%m\%d).rdb
```

### 데이터 복구
```bash
# RDB 파일로부터 복구
cp /backup/redis-20231201.rdb /var/lib/redis/dump.rdb
sudo systemctl restart redis
```

## 트러블슈팅

### 일반적인 문제

1. **연결 실패**
```
Error 10061 connecting to localhost:6379
```
- Redis 서버가 실행 중인지 확인
- 포트 번호와 호스트 주소 확인

2. **메모리 부족**
```
OOM command not allowed when used memory > maxmemory
```
- `maxmemory` 설정 증가
- `maxmemory-policy` 확인

3. **권한 오류**
```
NOAUTH Authentication required
```
- Redis 비밀번호 확인
- REDIS_URL에 인증 정보 포함

### 로그 확인
```bash
# Redis 로그
sudo tail -f /var/log/redis/redis-server.log

# Flask 앱 로그에서 Redis 메시지 확인
grep "Redis" app.log
```

## Fallback 모드

Redis를 사용할 수 없는 환경에서는 자동으로 표준 Flask 세션으로 fallback됩니다:

```python
# 자동 fallback 메커니즘
if not REDIS_AVAILABLE:
    print("Redis session manager not available - using standard sessions")
```

이 경우 다음 기능들은 제한됩니다:
- 고성능 세션 관리
- 분산 세션 저장
- 세션 통계
- 사용자 데이터 캐싱

## 성능 벤치마크

Redis 사용시 예상 성능 향상:
- 세션 조회: ~90% 빠름 (메모리 기반)
- 사용자 데이터 캐싱: API 호출 80% 감소
- 동시 세션 처리: 10배+ 향상
- 메모리 사용량: SQLite 대비 60% 절약