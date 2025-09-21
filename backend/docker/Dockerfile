# CSS Picker Backend - Multi-stage Docker Build
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app" \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libc-dev \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Create directories
RUN mkdir -p /app /var/log/csspicker /var/run/csspicker
WORKDIR /app

# Development stage
FROM base as development

# Copy requirements first for better caching
COPY ../requirements-production.txt ../requirements.txt ./
RUN pip install --no-cache-dir -r requirements-production.txt

# Copy application code (excluding docker directory)
COPY ../src ./src
COPY ../main.py ../production_app.py ./
COPY ../deployment ./deployment

# Set ownership
RUN chown -R appuser:appuser /app /var/log/csspicker /var/run/csspicker

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Default command for development
CMD ["python", "production_app.py"]

# Production stage
FROM base as production

# Install production dependencies only
COPY ../requirements-production.txt ./
RUN pip install --no-cache-dir -r requirements-production.txt

# Copy application code (excluding docker directory)
COPY ../src ./src
COPY ../main.py ../production_app.py ./
COPY ../deployment ./deployment

# Create optimized Python bytecode
RUN python -m compileall .

# Set ownership
RUN chown -R appuser:appuser /app /var/log/csspicker /var/run/csspicker

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Production command with Gunicorn
CMD ["gunicorn", "--config", "deployment/gunicorn_docker_config.py", "production_app:application"]