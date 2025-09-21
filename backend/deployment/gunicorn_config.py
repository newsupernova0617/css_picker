"""
Gunicorn Configuration for CSS Picker Backend

This file contains the production configuration for running the Flask app
with Gunicorn WSGI server for better performance and scalability.
"""

import os
import multiprocessing

# Server socket
bind = "127.0.0.1:5000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1  # (2 * CPU cores) + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 50

# Restart workers after this many requests, with up to 50 requests variation
# This helps prevent memory leaks in long-running processes
preload_app = True

# Logging
log_dir = "/var/log/csspicker"
os.makedirs(log_dir, exist_ok=True)

accesslog = f"{log_dir}/gunicorn_access.log"
errorlog = f"{log_dir}/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "csspicker_backend"

# Server mechanics
daemon = False
pidfile = "/var/run/csspicker/gunicorn.pid"
user = "www-data"
group = "www-data"
tmp_upload_dir = None

# SSL (if needed - typically handled by Nginx)
# keyfile = None
# certfile = None

# Performance tuning
worker_tmp_dir = "/dev/shm"  # Use RAM for worker temporary directory

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190