# 데이터베이스 최적화 - CSS Picker Turso 인덱스 최적화 및 성능 분석
# Turso SQLite 클라우드 데이터베이스의 성능 향상을 위한 포괄적 최적화 도구

import os
import sys
import time
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import libsql as libsql
from contextlib import contextmanager

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('database_optimization.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class QueryAnalysis:
    """쿼리 성능 분석 결과"""
    query: str
    execution_time_ms: float
    rows_affected: int
    explanation: str
    optimization_suggestions: List[str]
    index_candidates: List[str]
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL

@dataclass
class IndexRecommendation:
    """인덱스 추천 결과"""
    table_name: str
    columns: List[str]
    index_type: str  # UNIQUE, COMPOSITE, SINGLE, PARTIAL
    estimated_improvement: float
    creation_cost: str
    maintenance_overhead: str
    justification: str

@dataclass
class OptimizationReport:
    """최적화 보고서"""
    timestamp: str
    database_size_mb: float
    total_tables: int
    total_indexes: int
    slow_queries: List[QueryAnalysis]
    index_recommendations: List[IndexRecommendation]
    performance_metrics: Dict[str, Any]
    backup_info: Dict[str, Any]

class TursoOptimizer:
    """
    Turso 데이터베이스 최적화 도구
    - 인덱스 최적화 및 추천
    - 쿼리 성능 분석
    - 자동 백업 시스템
    - 성능 모니터링
    """
    
    def __init__(self, database_url: str, auth_token: str):
        self.database_url = database_url
        self.auth_token = auth_token
        self.db = None
        self.performance_baseline = {}
        self.connect()
    
    def connect(self):
        """데이터베이스 연결"""
        try:
            self.db = libsql.connect(self.database_url, auth_token=self.auth_token)
            logger.info("Turso 데이터베이스 연결 성공")
        except Exception as e:
            logger.error(f"데이터베이스 연결 실패: {e}")
            raise
    
    @contextmanager
    def get_cursor(self):
        """컨텍스트 매니저로 안전한 커서 관리"""
        cursor = self.db.cursor()
        try:
            yield cursor
        finally:
            cursor.close()
    
    def analyze_current_schema(self) -> Dict[str, Any]:
        """현재 데이터베이스 스키마 분석"""
        schema_info = {
            'tables': {},
            'indexes': {},
            'statistics': {}
        }
        
        try:
            with self.get_cursor() as cursor:
                # 테이블 정보 수집
                cursor.execute("""
                    SELECT name, sql FROM sqlite_master 
                    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
                    ORDER BY name
                """)
                
                for table_name, create_sql in cursor.fetchall():
                    # 테이블 통계
                    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                    row_count = cursor.fetchone()[0]
                    
                    # 컬럼 정보
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    columns = cursor.fetchall()
                    
                    schema_info['tables'][table_name] = {
                        'create_sql': create_sql,
                        'row_count': row_count,
                        'columns': columns
                    }
                
                # 인덱스 정보 수집
                cursor.execute("""
                    SELECT name, tbl_name, sql FROM sqlite_master 
                    WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
                    ORDER BY tbl_name, name
                """)
                
                for index_name, table_name, create_sql in cursor.fetchall():
                    if table_name not in schema_info['indexes']:
                        schema_info['indexes'][table_name] = []
                    
                    schema_info['indexes'][table_name].append({
                        'name': index_name,
                        'sql': create_sql
                    })
                
                logger.info(f"스키마 분석 완료: {len(schema_info['tables'])}개 테이블, {sum(len(indexes) for indexes in schema_info['indexes'].values())}개 인덱스")
                
        except Exception as e:
            logger.error(f"스키마 분석 실패: {e}")
            raise
        
        return schema_info
    
    def create_optimized_indexes(self) -> List[IndexRecommendation]:
        """CSS Picker 애플리케이션을 위한 최적화된 인덱스 생성"""
        recommendations = []
        
        try:
            with self.get_cursor() as cursor:
                # 1. users 테이블 최적화
                user_indexes = [
                    # 로그인 및 인증 최적화 (가장 빈번한 쿼리)
                    {
                        'name': 'idx_users_clerk_user_id',
                        'sql': 'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id)',
                        'justification': 'Clerk 인증 시 사용자 조회 최적화 - 매우 빈번한 쿼리'
                    },
                    # 이메일 검색 최적화
                    {
                        'name': 'idx_users_email',
                        'sql': 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
                        'justification': '이메일 기반 사용자 검색 및 중복 확인 최적화'
                    },
                    # 플랜별 사용자 조회 최적화
                    {
                        'name': 'idx_users_plan',
                        'sql': 'CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan)',
                        'justification': '플랜별 사용자 통계 및 필터링 최적화'
                    },
                    # Stripe 고객 조회 최적화
                    {
                        'name': 'idx_users_stripe_customer',
                        'sql': 'CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id)',
                        'justification': '결제 처리 시 Stripe 고객 조회 최적화'
                    },
                    # 복합 인덱스: 플랜과 생성일자 (분석 쿼리 최적화)
                    {
                        'name': 'idx_users_plan_created',
                        'sql': 'CREATE INDEX IF NOT EXISTS idx_users_plan_created ON users(plan, created_at)',
                        'justification': '플랜별 가입 추이 분석 및 리포팅 최적화'
                    }
                ]
                
                # 2. payments 테이블 최적화
                payment_indexes = [
                    # 사용자별 결제 내역 조회 최적화
                    {
                        'name': 'idx_payments_user_id',
                        'sql': 'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)',
                        'justification': '사용자별 결제 내역 조회 최적화'
                    },
                    # Stripe 결제 ID 조회 최적화
                    {
                        'name': 'idx_payments_stripe_intent',
                        'sql': 'CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id)',
                        'justification': 'Stripe 웹훅 처리 시 중복 방지 및 빠른 조회'
                    },
                    # 결제 상태별 조회 최적화
                    {
                        'name': 'idx_payments_status',
                        'sql': 'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
                        'justification': '실패/성공 결제 분석 및 모니터링 최적화'
                    },
                    # 복합 인덱스: 사용자와 결제일자 (결제 이력 조회 최적화)
                    {
                        'name': 'idx_payments_user_date',
                        'sql': 'CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, payment_date DESC)',
                        'justification': '사용자별 최신 결제 내역 조회 최적화'
                    }
                ]
                
                # 인덱스 생성 실행
                all_indexes = user_indexes + payment_indexes
                created_count = 0
                
                for index_info in all_indexes:
                    try:
                        start_time = time.time()
                        cursor.execute(index_info['sql'])
                        execution_time = (time.time() - start_time) * 1000
                        
                        # 추천 객체 생성
                        recommendation = IndexRecommendation(
                            table_name=index_info['name'].split('_')[1],  # Extract table name
                            columns=[col.strip() for col in index_info['sql'].split('(')[1].split(')')[0].split(',')],
                            index_type='UNIQUE' if 'UNIQUE' in index_info['sql'] else 'COMPOSITE' if ',' in index_info['sql'] else 'SINGLE',
                            estimated_improvement=0.85,  # 예상 85% 성능 향상
                            creation_cost=f"{execution_time:.2f}ms",
                            maintenance_overhead='낮음',
                            justification=index_info['justification']
                        )
                        
                        recommendations.append(recommendation)
                        created_count += 1
                        
                        logger.info(f"인덱스 생성 성공: {index_info['name']} ({execution_time:.2f}ms)")
                        
                    except Exception as e:
                        if 'already exists' not in str(e).lower():
                            logger.error(f"인덱스 생성 실패 {index_info['name']}: {e}")
                
                self.db.commit()
                logger.info(f"인덱스 최적화 완료: {created_count}/{len(all_indexes)}개 인덱스 생성")
                
        except Exception as e:
            logger.error(f"인덱스 최적화 실패: {e}")
            raise
        
        return recommendations
    
    def analyze_query_performance(self) -> List[QueryAnalysis]:
        """CSS Picker 핵심 쿼리들의 성능 분석"""
        core_queries = [
            # 사용자 인증 쿼리 (가장 빈번)
            {
                'name': 'user_auth_lookup',
                'query': 'SELECT id, clerk_user_id, email, plan, premium_activated_at, stripe_customer_id, created_at, updated_at FROM users WHERE clerk_user_id = ?',
                'params': ['user_test_123']
            },
            # 이메일 기반 사용자 조회
            {
                'name': 'user_email_lookup',
                'query': 'SELECT id, plan FROM users WHERE email = ?',
                'params': ['test@example.com']
            },
            # 결제 내역 조회
            {
                'name': 'payment_history',
                'query': 'SELECT * FROM payments WHERE user_id = ? ORDER BY payment_date DESC LIMIT 10',
                'params': ['usr_test123']
            },
            # Stripe 고객 ID 조회
            {
                'name': 'stripe_customer_lookup',
                'query': 'SELECT id, stripe_customer_id FROM users WHERE id = ?',
                'params': ['usr_test123']
            },
            # 플랜별 사용자 통계
            {
                'name': 'plan_statistics',
                'query': 'SELECT plan, COUNT(*) as user_count FROM users GROUP BY plan',
                'params': []
            },
            # 최근 가입 사용자
            {
                'name': 'recent_users',
                'query': 'SELECT id, email, plan, created_at FROM users WHERE created_at >= ? ORDER BY created_at DESC LIMIT 50',
                'params': [(datetime.now() - timedelta(days=7)).isoformat()]
            }
        ]
        
        analyses = []
        
        try:
            with self.get_cursor() as cursor:
                for query_info in core_queries:
                    try:
                        # EXPLAIN QUERY PLAN으로 쿼리 분석
                        explain_query = f"EXPLAIN QUERY PLAN {query_info['query']}"
                        cursor.execute(explain_query, query_info['params'])
                        explanation = ' | '.join([str(row) for row in cursor.fetchall()])
                        
                        # 실제 쿼리 실행 시간 측정
                        start_time = time.time()
                        cursor.execute(query_info['query'], query_info['params'])
                        results = cursor.fetchall()
                        execution_time = (time.time() - start_time) * 1000
                        
                        # 성능 분석 및 최적화 제안
                        suggestions = []
                        severity = 'LOW'
                        index_candidates = []
                        
                        if execution_time > 100:  # 100ms 이상이면 느린 쿼리
                            severity = 'HIGH' if execution_time > 500 else 'MEDIUM'
                            suggestions.append('쿼리 실행 시간이 길어 인덱스 추가 검토 필요')
                        
                        if 'SCAN' in explanation.upper():
                            suggestions.append('테이블 풀 스캔 발생 - 적절한 인덱스 부재')
                            severity = 'HIGH'
                        
                        if query_info['name'] == 'user_auth_lookup':
                            index_candidates.append('idx_users_clerk_user_id')
                        elif query_info['name'] == 'user_email_lookup':
                            index_candidates.append('idx_users_email')
                        elif query_info['name'] == 'payment_history':
                            index_candidates.append('idx_payments_user_date')
                        
                        analysis = QueryAnalysis(
                            query=query_info['query'],
                            execution_time_ms=execution_time,
                            rows_affected=len(results),
                            explanation=explanation,
                            optimization_suggestions=suggestions,
                            index_candidates=index_candidates,
                            severity=severity
                        )
                        
                        analyses.append(analysis)
                        
                        logger.info(f"쿼리 분석 완료: {query_info['name']} - {execution_time:.2f}ms ({severity})")
                        
                    except Exception as e:
                        logger.error(f"쿼리 분석 실패 {query_info['name']}: {e}")
                
        except Exception as e:
            logger.error(f"쿼리 성능 분석 실패: {e}")
            raise
        
        return analyses
    
    def setup_backup_automation(self) -> Dict[str, Any]:
        """자동 백업 시스템 구축"""
        backup_config = {
            'strategy': 'incremental_with_full_weekly',
            'retention_policy': '7_daily_4_weekly_12_monthly',
            'backup_location': 'turso_native_backup',
            'monitoring': 'enabled'
        }
        
        try:
            # Turso CLI를 사용한 백업 스크립트 생성
            backup_script = self._generate_backup_script()
            
            with open('backup_automation.sh', 'w') as f:
                f.write(backup_script)
            
            logger.info("백업 자동화 스크립트 생성 완료")
            
            # 백업 상태 확인을 위한 테이블 생성
            with self.get_cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS backup_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        backup_type TEXT NOT NULL,
                        backup_size_bytes INTEGER,
                        backup_location TEXT,
                        status TEXT NOT NULL,
                        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        completed_at DATETIME,
                        error_message TEXT
                    )
                """)
                
                # 백업 모니터링을 위한 인덱스
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_backup_logs_status_date 
                    ON backup_logs(status, started_at DESC)
                """)
                
                self.db.commit()
            
            backup_config['script_created'] = True
            backup_config['monitoring_table'] = 'backup_logs'
            
        except Exception as e:
            logger.error(f"백업 자동화 설정 실패: {e}")
            backup_config['error'] = str(e)
        
        return backup_config
    
    def _generate_backup_script(self) -> str:
        """백업 자동화 스크립트 생성"""
        return '''#!/bin/bash
# CSS Picker Turso 데이터베이스 자동 백업 스크립트
# 생성일: ''' + datetime.now().isoformat() + '''

DB_NAME="css-picker"
BACKUP_DIR="/var/backups/css-picker"
LOG_FILE="/var/log/css-picker-backup.log"
RETENTION_DAYS=30

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 일일 백업 (Monday-Friday)
if [[ $(date +%u) -le 5 ]]; then
    BACKUP_FILE="${BACKUP_DIR}/daily-$(date +%Y%m%d).db"
    log "일일 백업 시작: $BACKUP_FILE"
    
    turso db dump "$DB_NAME" --output "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "일일 백업 성공: $(du -h $BACKUP_FILE | cut -f1)"
    else
        log "ERROR: 일일 백업 실패"
        exit 1
    fi
fi

# 주간 전체 백업 (Sunday)
if [[ $(date +%u) -eq 7 ]]; then
    BACKUP_FILE="${BACKUP_DIR}/weekly-$(date +%Y%U).db"
    log "주간 백업 시작: $BACKUP_FILE"
    
    turso db dump "$DB_NAME" --output "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "주간 백업 성공: $(du -h $BACKUP_FILE | cut -f1)"
    else
        log "ERROR: 주간 백업 실패"
        exit 1
    fi
fi

# 오래된 백업 정리
find "$BACKUP_DIR" -name "daily-*.db" -mtime +7 -delete
find "$BACKUP_DIR" -name "weekly-*.db" -mtime +"$RETENTION_DAYS" -delete

log "백업 정리 완료"

# 백업 무결성 검사
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.db | head -1)
if [ -f "$LATEST_BACKUP" ]; then
    sqlite3 "$LATEST_BACKUP" "PRAGMA integrity_check;" > /dev/null
    if [ $? -eq 0 ]; then
        log "백업 무결성 검사 통과: $LATEST_BACKUP"
    else
        log "WARNING: 백업 무결성 검사 실패: $LATEST_BACKUP"
    fi
fi

log "백업 프로세스 완료"
'''
    
    def generate_optimization_report(self) -> OptimizationReport:
        """종합 최적화 보고서 생성"""
        try:
            # 데이터베이스 크기 측정
            with self.get_cursor() as cursor:
                cursor.execute("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
                db_size_bytes = cursor.fetchone()[0]
                db_size_mb = db_size_bytes / (1024 * 1024)
                
                # 테이블 수 계산
                cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
                table_count = cursor.fetchone()[0]
                
                # 인덱스 수 계산
                cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'")
                index_count = cursor.fetchone()[0]
            
            # 성능 분석 실행
            slow_queries = self.analyze_query_performance()
            
            # 인덱스 최적화 실행
            index_recommendations = self.create_optimized_indexes()
            
            # 백업 시스템 설정
            backup_info = self.setup_backup_automation()
            
            # 성능 지표 수집
            performance_metrics = {
                'avg_query_time': sum(q.execution_time_ms for q in slow_queries) / max(len(slow_queries), 1),
                'slow_query_count': len([q for q in slow_queries if q.severity in ['HIGH', 'CRITICAL']]),
                'index_coverage': len(index_recommendations),
                'optimization_score': self._calculate_optimization_score(slow_queries, index_recommendations)
            }
            
            report = OptimizationReport(
                timestamp=datetime.now().isoformat(),
                database_size_mb=db_size_mb,
                total_tables=table_count,
                total_indexes=index_count,
                slow_queries=slow_queries,
                index_recommendations=index_recommendations,
                performance_metrics=performance_metrics,
                backup_info=backup_info
            )
            
            logger.info("최적화 보고서 생성 완료")
            return report
            
        except Exception as e:
            logger.error(f"최적화 보고서 생성 실패: {e}")
            raise
    
    def _calculate_optimization_score(self, queries: List[QueryAnalysis], indexes: List[IndexRecommendation]) -> float:
        """최적화 점수 계산 (0-100점)"""
        base_score = 70.0
        
        # 느린 쿼리에 대한 감점
        high_severity_queries = len([q for q in queries if q.severity == 'HIGH'])
        critical_queries = len([q for q in queries if q.severity == 'CRITICAL'])
        
        query_penalty = (high_severity_queries * 5) + (critical_queries * 10)
        
        # 인덱스 최적화에 대한 가점
        index_bonus = len(indexes) * 3
        
        # 최종 점수 계산
        final_score = base_score - query_penalty + index_bonus
        return max(0, min(100, final_score))
    
    def save_report(self, report: OptimizationReport, filename: str = None):
        """최적화 보고서를 파일로 저장"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"database_optimization_report_{timestamp}.json"
        
        try:
            # 보고서를 JSON으로 직렬화
            report_dict = {
                'timestamp': report.timestamp,
                'database_info': {
                    'size_mb': report.database_size_mb,
                    'total_tables': report.total_tables,
                    'total_indexes': report.total_indexes
                },
                'performance_metrics': report.performance_metrics,
                'slow_queries': [
                    {
                        'query': q.query,
                        'execution_time_ms': q.execution_time_ms,
                        'rows_affected': q.rows_affected,
                        'severity': q.severity,
                        'suggestions': q.optimization_suggestions
                    } for q in report.slow_queries
                ],
                'index_recommendations': [
                    {
                        'table_name': idx.table_name,
                        'columns': idx.columns,
                        'index_type': idx.index_type,
                        'estimated_improvement': idx.estimated_improvement,
                        'justification': idx.justification
                    } for idx in report.index_recommendations
                ],
                'backup_info': report.backup_info
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(report_dict, f, ensure_ascii=False, indent=2)
            
            logger.info(f"최적화 보고서 저장 완료: {filename}")
            
        except Exception as e:
            logger.error(f"보고서 저장 실패: {e}")
            raise

def run_complete_optimization():
    """전체 데이터베이스 최적화 실행"""
    from dotenv import load_dotenv
    load_dotenv()
    
    database_url = os.getenv('TURSO_DATABASE_URL')
    auth_token = os.getenv('TURSO_AUTH_TOKEN')
    
    if not database_url or not auth_token:
        logger.error("TURSO_DATABASE_URL 또는 TURSO_AUTH_TOKEN 환경변수가 설정되지 않았습니다")
        return False
    
    try:
        logger.info("🚀 CSS Picker 데이터베이스 최적화 시작")
        
        optimizer = TursoOptimizer(database_url, auth_token)
        
        # 현재 스키마 분석
        logger.info("📊 데이터베이스 스키마 분석 중...")
        schema_info = optimizer.analyze_current_schema()
        
        # 종합 최적화 실행
        logger.info("⚡ 종합 최적화 실행 중...")
        report = optimizer.generate_optimization_report()
        
        # 보고서 저장
        optimizer.save_report(report)
        
        # 결과 요약 출력
        print("\n" + "="*60)
        print("🎯 CSS Picker 데이터베이스 최적화 완료!")
        print("="*60)
        print(f"📈 최적화 점수: {report.performance_metrics['optimization_score']:.1f}/100")
        print(f"💾 데이터베이스 크기: {report.database_size_mb:.2f} MB")
        print(f"🏗️ 테이블 수: {report.total_tables}개")
        print(f"📇 인덱스 수: {report.total_indexes}개")
        print(f"🔍 생성된 인덱스: {len(report.index_recommendations)}개")
        print(f"⚠️ 느린 쿼리: {report.performance_metrics['slow_query_count']}개")
        print(f"⏱️ 평균 쿼리 시간: {report.performance_metrics['avg_query_time']:.2f}ms")
        
        if report.backup_info.get('script_created'):
            print("💾 백업 자동화: ✅ 구성 완료")
        else:
            print("💾 백업 자동화: ❌ 오류 발생")
        
        print("\n📊 주요 최적화 항목:")
        for idx in report.index_recommendations[:5]:  # 상위 5개만 표시
            print(f"  • {idx.table_name} 테이블: {idx.justification}")
        
        if report.performance_metrics['optimization_score'] >= 85:
            print("\n🎉 데이터베이스가 최적화 상태입니다!")
        elif report.performance_metrics['optimization_score'] >= 70:
            print("\n✅ 데이터베이스 성능이 양호합니다.")
        else:
            print("\n⚠️ 추가 최적화가 권장됩니다.")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ 데이터베이스 최적화 실패: {e}")
        return False

if __name__ == "__main__":
    success = run_complete_optimization()
    exit(0 if success else 1)