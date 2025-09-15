"""
Gunicorn Configuration for Docker Container

This configuration is optimized for running inside Docker containers
with proper logging, health checks, and resource management.
"""

import os
import multiprocessing

# Server socket - bind to all interfaces in container
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes - optimized for container resources
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 50

# Restart workers after this many requests to prevent memory leaks
preload_app = True

# Logging - output to stdout/stderr for Docker logs
accesslog = "-"  # stdout
errorlog = "-"   # stderr
loglevel = os.getenv('LOG_LEVEL', 'info').lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "csspicker_docker"

# Server mechanics - no daemon mode in Docker
daemon = False
pidfile = None  # Not needed in containers
user = None     # Container runs as appuser already
group = None
tmp_upload_dir = "/tmp"

# Performance tuning for containers
worker_tmp_dir = "/dev/shm"  # Use shared memory if available

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Graceful shutdown handling for Docker
graceful_timeout = 30
max_requests_jitter = 50

# Enable stats endpoint for monitoring
enable_stdio_inheritance = True

def when_ready(server):
    """Called when the server is ready to handle requests"""
    server.log.info("CSS Picker Backend is ready to handle requests")

def on_starting(server):
    """Called when the master process is initializing"""
    server.log.info("CSS Picker Backend is starting...")

def on_reload(server):
    """Called when configuration is reloaded"""
    server.log.info("CSS Picker Backend configuration reloaded")

def worker_int(worker):
    """Called when a worker receives a SIGINT or SIGQUIT signal"""
    worker.log.info(f"Worker {worker.pid} received shutdown signal")

def pre_fork(server, worker):
    """Called just before a worker is forked"""
    server.log.info(f"Worker {worker.age} is being created")

def post_fork(server, worker):
    """Called just after a worker has been forked"""
    server.log.info(f"Worker {worker.pid} has been spawned")

def child_exit(server, worker):
    """Called when a worker exits"""
    server.log.info(f"Worker {worker.pid} exited with code {worker.exitcode}")

def worker_abort(worker):
    """Called when a worker is aborted"""
    worker.log.error(f"Worker {worker.pid} was aborted")

# Environment-specific overrides
if os.getenv('FLASK_ENV') == 'development':
    # Development overrides
    reload = True
    loglevel = 'debug'
    workers = 1  # Single worker for easier debugging

# Resource limits based on container resources
if os.path.exists('/.dockerenv'):
    # We're inside a Docker container
    try:
        # Try to read container memory limit
        with open('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'r') as f:
            memory_limit = int(f.read().strip())

        # Adjust workers based on available memory (rough estimation)
        # Assume each worker needs ~100MB
        max_workers_by_memory = max(1, memory_limit // (100 * 1024 * 1024))
        workers = min(workers, max_workers_by_memory)

    except (FileNotFoundError, ValueError, PermissionError):
        # Fallback to default worker count
        pass