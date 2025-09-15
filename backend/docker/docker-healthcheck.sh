#!/bin/bash

# CSS Picker Docker Health Check Script
# Comprehensive health monitoring for all services

set -e

COMPOSE_PROJECT="csspicker"
LOG_FILE="../logs/health-check.log"
ALERT_EMAIL="admin@csspickerpro.com"
SLACK_WEBHOOK_URL=""  # Add your Slack webhook URL if needed

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    log_message "INFO" "$1"
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    log_message "SUCCESS" "$1"
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    log_message "WARNING" "$1"
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    log_message "ERROR" "$1"
    echo -e "${RED}✗${NC} $1"
}

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Health check functions
check_container_status() {
    log_info "Checking container status..."

    local containers=("app" "nginx" "redis")
    local failed_containers=()

    for container in "${containers[@]}"; do
        if docker-compose -p $COMPOSE_PROJECT ps $container | grep -q "Up"; then
            log_success "$container container is running"
        else
            log_error "$container container is not running"
            failed_containers+=($container)
        fi
    done

    return ${#failed_containers[@]}
}

check_health_endpoints() {
    log_info "Checking health endpoints..."

    local failed_checks=0

    # Check Nginx health
    if curl -f -s --max-time 10 http://localhost/health > /dev/null 2>&1; then
        log_success "Nginx health endpoint responding"
    else
        log_error "Nginx health endpoint failed"
        ((failed_checks++))
    fi

    # Check application health via Nginx
    if curl -f -s --max-time 10 http://localhost:5000/health > /dev/null 2>&1; then
        log_success "Application health endpoint responding"
    else
        # Try direct container access
        if docker-compose -p $COMPOSE_PROJECT exec -T app curl -f -s --max-time 10 http://localhost:5000/health > /dev/null 2>&1; then
            log_success "Application health endpoint responding (direct)"
        else
            log_error "Application health endpoint failed"
            ((failed_checks++))
        fi
    fi

    # Check detailed health endpoint
    if curl -f -s --max-time 10 http://localhost:5000/health/detailed > /dev/null 2>&1; then
        local health_data=$(curl -s --max-time 10 http://localhost:5000/health/detailed)
        log_success "Detailed health endpoint responding"
        log_info "Health data: $health_data"
    else
        log_warning "Detailed health endpoint not responding"
    fi

    return $failed_checks
}

check_redis_connection() {
    log_info "Checking Redis connection..."

    if docker-compose -p $COMPOSE_PROJECT exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis is responding to ping"

        # Check Redis memory usage
        local memory_info=$(docker-compose -p $COMPOSE_PROJECT exec -T redis redis-cli info memory | grep "used_memory_human")
        log_info "Redis memory usage: $memory_info"
        return 0
    else
        log_error "Redis is not responding"
        return 1
    fi
}

check_resource_usage() {
    log_info "Checking resource usage..."

    # Get container stats
    local stats=$(docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemUsage}}" | grep $COMPOSE_PROJECT)

    if [ -n "$stats" ]; then
        while IFS= read -r line; do
            local container=$(echo $line | cut -d',' -f1)
            local cpu=$(echo $line | cut -d',' -f2)
            local memory=$(echo $line | cut -d',' -f3)

            log_info "$container: CPU: $cpu, Memory: $memory"

            # Alert on high CPU usage (>80%)
            local cpu_num=$(echo $cpu | sed 's/%//')
            if (( $(echo "$cpu_num > 80" | bc -l) )); then
                log_warning "$container high CPU usage: $cpu"
            fi

        done <<< "$stats"
    else
        log_warning "No container stats available"
    fi
}

check_disk_space() {
    log_info "Checking disk space..."

    local disk_usage=$(df -h / | awk 'NR==2{printf "%s", $5}' | sed 's/%//')

    if [ "$disk_usage" -gt 90 ]; then
        log_error "Disk usage critical: ${disk_usage}%"
        return 1
    elif [ "$disk_usage" -gt 80 ]; then
        log_warning "Disk usage high: ${disk_usage}%"
        return 1
    else
        log_success "Disk usage normal: ${disk_usage}%"
        return 0
    fi
}

check_log_sizes() {
    log_info "Checking log file sizes..."

    local log_dirs=("../logs" "/var/lib/docker/containers")
    local large_logs=()

    for log_dir in "${log_dirs[@]}"; do
        if [ -d "$log_dir" ]; then
            # Find log files larger than 100MB
            local large_files=$(find "$log_dir" -name "*.log" -size +100M 2>/dev/null)
            if [ -n "$large_files" ]; then
                while IFS= read -r file; do
                    local size=$(du -h "$file" | cut -f1)
                    log_warning "Large log file: $file ($size)"
                    large_logs+=("$file")
                done <<< "$large_files"
            fi
        fi
    done

    if [ ${#large_logs[@]} -eq 0 ]; then
        log_success "No oversized log files found"
        return 0
    else
        return 1
    fi
}

check_ssl_certificates() {
    log_info "Checking SSL certificates..."

    local cert_file="../nginx/ssl/fullchain.pem"

    if [ -f "$cert_file" ]; then
        # Check certificate expiration
        local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

        if [ $days_until_expiry -lt 7 ]; then
            log_error "SSL certificate expires in $days_until_expiry days"
            return 1
        elif [ $days_until_expiry -lt 30 ]; then
            log_warning "SSL certificate expires in $days_until_expiry days"
            return 1
        else
            log_success "SSL certificate valid for $days_until_expiry days"
            return 0
        fi
    else
        log_warning "SSL certificate file not found"
        return 1
    fi
}

# Notification functions
send_alert_email() {
    local subject="$1"
    local body="$2"

    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
        log_info "Alert email sent to $ALERT_EMAIL"
    fi
}

send_slack_notification() {
    local message="$1"

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1
        log_info "Slack notification sent"
    fi
}

# Recovery actions
restart_failed_containers() {
    log_info "Attempting to restart failed containers..."

    docker-compose -p $COMPOSE_PROJECT restart
    sleep 30

    # Check if restart was successful
    if check_container_status; then
        log_success "Container restart successful"
        return 0
    else
        log_error "Container restart failed"
        return 1
    fi
}

cleanup_logs() {
    log_info "Performing log cleanup..."

    # Rotate application logs
    find ../logs -name "*.log" -size +100M -exec truncate -s 50M {} \;

    # Clean up old Docker logs
    docker system prune -f --volumes

    log_success "Log cleanup completed"
}

# Main health check function
run_health_checks() {
    local start_time=$(date '+%Y-%m-%d %H:%M:%S')
    local failed_checks=0
    local critical_failures=0

    log_info "=== Starting health check at $start_time ==="

    # Run all health checks
    if ! check_container_status; then
        ((failed_checks++))
        ((critical_failures++))
    fi

    if ! check_health_endpoints; then
        ((failed_checks++))
        ((critical_failures++))
    fi

    if ! check_redis_connection; then
        ((failed_checks++))
    fi

    check_resource_usage

    if ! check_disk_space; then
        ((failed_checks++))
    fi

    if ! check_log_sizes; then
        ((failed_checks++))
    fi

    if ! check_ssl_certificates; then
        ((failed_checks++))
    fi

    local end_time=$(date '+%Y-%m-%d %H:%M:%S')
    log_info "=== Health check completed at $end_time ==="

    # Generate summary
    if [ $failed_checks -eq 0 ]; then
        log_success "All health checks passed ✓"
    else
        log_warning "$failed_checks health check(s) failed"

        # Take recovery actions for critical failures
        if [ $critical_failures -gt 0 ]; then
            log_error "Critical failures detected, attempting recovery..."

            # Try to restart containers
            if restart_failed_containers; then
                log_success "Recovery successful"
                send_slack_notification "🔧 CSS Picker: Auto-recovery successful after $critical_failures critical failure(s)"
            else
                log_error "Recovery failed - manual intervention required"
                send_alert_email "CSS Picker: Critical Health Check Failure" \
                    "Critical health check failures detected and auto-recovery failed. Manual intervention required."
                send_slack_notification "🚨 CSS Picker: Critical failure - manual intervention required!"
            fi
        fi

        # Cleanup if log issues detected
        cleanup_logs
    fi

    return $failed_checks
}

# Usage information
show_usage() {
    echo "CSS Picker Docker Health Check Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --continuous    Run continuous monitoring (every 5 minutes)"
    echo "  --once          Run health check once (default)"
    echo "  --fix           Run health check and attempt fixes"
    echo "  --logs          Show recent health check logs"
    echo "  --help          Show this help message"
    echo ""
}

# Main execution
case "$1" in
    --continuous)
        log_info "Starting continuous health monitoring..."
        while true; do
            run_health_checks
            sleep 300  # 5 minutes
        done
        ;;
    --fix)
        log_info "Running health check with automatic fixes..."
        run_health_checks
        ;;
    --logs)
        if [ -f "$LOG_FILE" ]; then
            tail -n 50 "$LOG_FILE"
        else
            echo "No health check logs found"
        fi
        ;;
    --help|-h)
        show_usage
        exit 0
        ;;
    --once|"")
        run_health_checks
        ;;
    *)
        echo "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac

exit $?