"""
Logging Configuration for CSS Picker Backend

This module provides centralized logging configuration for the Flask application
with support for both development and production environments.
"""

import os
import logging
import logging.handlers
from datetime import datetime
from pythonjsonlogger import jsonlogger


class ProductionFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for production logging"""

    def add_fields(self, log_record, record, message_dict):
        super(ProductionFormatter, self).add_fields(log_record, record, message_dict)

        # Add timestamp
        if not log_record.get('timestamp'):
            log_record['timestamp'] = datetime.utcnow().isoformat()

        # Add application info
        log_record['application'] = 'csspicker-backend'
        log_record['environment'] = os.getenv('FLASK_ENV', 'development')

        # Add request context if available (Flask-specific)
        try:
            from flask import request, g
            if request:
                log_record['request_id'] = getattr(g, 'request_id', None)
                log_record['remote_addr'] = request.remote_addr
                log_record['url'] = request.url
                log_record['method'] = request.method
        except (ImportError, RuntimeError):
            # Outside of Flask request context
            pass


def setup_logging(app=None):
    """
    Set up logging configuration for the application

    Args:
        app: Flask application instance (optional)
    """

    # Get configuration
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    log_dir = os.getenv('LOG_DIR', '/var/log/csspicker')
    flask_env = os.getenv('FLASK_ENV', 'development')

    # Create log directory if it doesn't exist
    os.makedirs(log_dir, exist_ok=True)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))

    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Production logging configuration
    if flask_env == 'production':
        # JSON formatter for production
        json_formatter = ProductionFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )

        # Application log file
        app_handler = logging.handlers.RotatingFileHandler(
            filename=os.path.join(log_dir, 'application.log'),
            maxBytes=50 * 1024 * 1024,  # 50MB
            backupCount=10,
            encoding='utf-8'
        )
        app_handler.setLevel(logging.INFO)
        app_handler.setFormatter(json_formatter)
        root_logger.addHandler(app_handler)

        # Error log file (errors and critical only)
        error_handler = logging.handlers.RotatingFileHandler(
            filename=os.path.join(log_dir, 'error.log'),
            maxBytes=50 * 1024 * 1024,  # 50MB
            backupCount=10,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(json_formatter)
        root_logger.addHandler(error_handler)

        # Console handler for systemd
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(json_formatter)
        root_logger.addHandler(console_handler)

    else:
        # Development logging configuration
        dev_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

        # Console handler for development
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(dev_formatter)
        root_logger.addHandler(console_handler)

        # File handler for development
        file_handler = logging.FileHandler(
            filename=os.path.join(log_dir, 'development.log'),
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(dev_formatter)
        root_logger.addHandler(file_handler)

    # Configure specific loggers
    configure_specific_loggers()

    # Configure Flask app logging if provided
    if app:
        configure_flask_logging(app)

    logging.info(f"Logging configured for {flask_env} environment")


def configure_specific_loggers():
    """Configure specific loggers with appropriate levels"""

    # Werkzeug (Flask's WSGI server)
    logging.getLogger('werkzeug').setLevel(logging.WARNING)

    # Urllib3 (used by requests)
    logging.getLogger('urllib3').setLevel(logging.WARNING)

    # Stripe
    logging.getLogger('stripe').setLevel(logging.INFO)

    # Database
    logging.getLogger('libsql_client').setLevel(logging.INFO)

    # Our application loggers
    logging.getLogger('csspicker').setLevel(logging.INFO)
    logging.getLogger('csspicker.auth').setLevel(logging.INFO)
    logging.getLogger('csspicker.api').setLevel(logging.INFO)
    logging.getLogger('csspicker.database').setLevel(logging.INFO)


def configure_flask_logging(app):
    """
    Configure Flask-specific logging

    Args:
        app: Flask application instance
    """

    # Use our configured logger instead of Flask's default
    app.logger.handlers = []
    app.logger.propagate = True

    # Set Flask logger level
    if app.config.get('DEBUG'):
        app.logger.setLevel(logging.DEBUG)
    else:
        app.logger.setLevel(logging.INFO)


# Request ID middleware for better log tracing
def setup_request_logging(app):
    """
    Set up request-level logging with unique request IDs

    Args:
        app: Flask application instance
    """
    import uuid
    from flask import g, request

    @app.before_request
    def before_request():
        g.request_id = str(uuid.uuid4())

        # Log request start
        app.logger.info(
            f"Request started",
            extra={
                'request_id': g.request_id,
                'method': request.method,
                'url': request.url,
                'remote_addr': request.remote_addr,
                'user_agent': request.headers.get('User-Agent')
            }
        )

    @app.after_request
    def after_request(response):
        # Log request end
        app.logger.info(
            f"Request completed",
            extra={
                'request_id': getattr(g, 'request_id', None),
                'status_code': response.status_code,
                'content_length': response.content_length
            }
        )
        return response


def get_logger(name):
    """
    Get a logger instance for a specific module

    Args:
        name: Logger name (usually __name__)

    Returns:
        logging.Logger: Configured logger instance
    """
    return logging.getLogger(f'csspicker.{name}')


# Security-focused logging helpers
def log_security_event(event_type, details, severity='WARNING'):
    """
    Log security-related events

    Args:
        event_type: Type of security event
        details: Event details
        severity: Log severity level
    """
    logger = get_logger('security')
    log_func = getattr(logger, severity.lower())

    log_func(
        f"Security event: {event_type}",
        extra={
            'event_type': event_type,
            'event_category': 'security',
            'details': details
        }
    )


def log_performance_metric(metric_name, value, unit='ms'):
    """
    Log performance metrics

    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Unit of measurement
    """
    logger = get_logger('performance')
    logger.info(
        f"Performance metric: {metric_name}",
        extra={
            'metric_name': metric_name,
            'metric_value': value,
            'metric_unit': unit,
            'event_category': 'performance'
        }
    )


# Example usage in Flask app
if __name__ == '__main__':
    # Test logging setup
    setup_logging()

    logger = get_logger('test')
    logger.info("Test log message")
    logger.warning("Test warning message")
    logger.error("Test error message")

    log_security_event('test_security_event', {'test': 'data'})
    log_performance_metric('test_response_time', 250)