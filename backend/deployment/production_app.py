"""
Production-Ready Flask Application Entry Point

This file integrates all production configurations including:
- Enhanced logging
- Security middleware
- Performance monitoring
- Error handling
"""

import os
import sys
from flask import Flask, request, g
import time
# sys path 설정을 logging_config import 전에 해야 함
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from logging_config import setup_logging, setup_request_logging, get_logger, log_security_event, log_performance_metric
except ImportError:
    # For Railway deployment, create minimal logging setup
    import logging

    def setup_logging():
        logging.basicConfig(level=logging.INFO)

    def setup_request_logging(app):
        pass

    def get_logger(name):
        return logging.getLogger(name)

    def log_security_event(event, data, level='WARNING'):
        get_logger('security').warning(f"{event}: {data}")

    def log_performance_metric(metric, value, unit):
        get_logger('performance').info(f"{metric}: {value}{unit}")
from src.app import create_app

def create_production_app():
    """Create production-ready Flask application with all enhancements"""

    # Set up logging first
    setup_logging()
    logger = get_logger('production')

    # Create Flask app
    app = create_app('production')

    # Set up request logging
    setup_request_logging(app)

    # Add production middleware
    add_security_middleware(app)
    add_performance_monitoring(app)
    add_error_handling(app)

    logger.info("Production Flask application created successfully")
    return app


def add_security_middleware(app):
    """Add security-focused middleware"""

    @app.before_request
    def security_checks():
        # Log suspicious requests
        if len(request.url) > 2000:  # Unusually long URL
            log_security_event('suspicious_long_url', {
                'url_length': len(request.url),
                'remote_addr': request.remote_addr
            })

        # Check for common attack patterns
        suspicious_patterns = ['<script', 'javascript:', 'eval(', 'union select']
        query_string = request.query_string.decode('utf-8', errors='ignore').lower()

        for pattern in suspicious_patterns:
            if pattern in query_string:
                log_security_event('suspicious_query_pattern', {
                    'pattern': pattern,
                    'query': query_string[:200],  # Truncate for logging
                    'remote_addr': request.remote_addr
                }, 'ERROR')

    @app.after_request
    def add_security_headers(response):
        # Add security headers (complementing Nginx headers)
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Remove server signature
        response.headers.pop('Server', None)

        return response


def add_performance_monitoring(app):
    """Add performance monitoring middleware"""

    @app.before_request
    def start_timer():
        g.start_time = time.time()

    @app.after_request
    def log_performance(response):
        if hasattr(g, 'start_time'):
            duration = (time.time() - g.start_time) * 1000  # Convert to milliseconds

            # Log slow requests
            if duration > 1000:  # More than 1 second
                get_logger('performance').warning(
                    f"Slow request detected",
                    extra={
                        'duration_ms': duration,
                        'method': request.method,
                        'url': request.url,
                        'status_code': response.status_code
                    }
                )

            # Log performance metric
            log_performance_metric(
                f"{request.method}_{request.endpoint or 'unknown'}",
                duration,
                'ms'
            )

        return response


def add_error_handling(app):
    """Add comprehensive error handling"""

    @app.errorhandler(404)
    def handle_not_found(error):
        logger = get_logger('errors')
        logger.warning(f"404 Not Found: {request.url}")
        return {'error': 'Resource not found'}, 404

    @app.errorhandler(500)
    def handle_internal_error(error):
        logger = get_logger('errors')
        logger.error(f"Internal server error: {str(error)}", exc_info=True)
        return {'error': 'Internal server error'}, 500

    @app.errorhandler(403)
    def handle_forbidden(error):
        log_security_event('access_forbidden', {
            'url': request.url,
            'remote_addr': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', 'Unknown')
        })
        return {'error': 'Access forbidden'}, 403

    @app.errorhandler(429)
    def handle_rate_limit(error):
        log_security_event('rate_limit_exceeded', {
            'remote_addr': request.remote_addr,
            'url': request.url
        })
        return {'error': 'Too many requests'}, 429


# Health check enhancement for production
def enhanced_health_check():
    """Enhanced health check with system metrics"""
    import psutil

    try:
        # Basic health check
        health_data = {
            'status': 'healthy',
            'timestamp': time.time(),
            'version': '1.0.0'
        }

        # Add system metrics
        health_data['system'] = {
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_percent': psutil.disk_usage('/').percent
        }

        return health_data, 200

    except Exception as e:
        get_logger('health').error(f"Health check failed: {str(e)}")
        return {'status': 'unhealthy', 'error': str(e)}, 503


if __name__ == '__main__':
    # This should not be used in production
    # Use Gunicorn instead: gunicorn --config gunicorn_config.py production_app:application
    print("WARNING: Do not run this directly in production!")
    print("Use: gunicorn --config gunicorn_config.py production_app:application")
    sys.exit(1)


# Create the application instance for Gunicorn
application = create_production_app()

# Add enhanced health check route
@application.route('/health/detailed')
def detailed_health():
    return enhanced_health_check()