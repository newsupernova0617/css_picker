# 🐳 CSS Picker Backend - Docker Deployment

Complete Docker containerization for CSS Picker Flask backend with production-ready configuration.

## 🚀 Quick Start

### Development Mode
```bash
# 1. Copy environment file
cp .env.docker.dev .env.docker

# 2. Start development environment
./docker-deploy.sh --dev

# 3. Access application
# - App: http://localhost:5000
# - Nginx: http://localhost:8080
# - Redis: http://localhost:6379
# - Database Admin: http://localhost:8081
```

### Production Mode
```bash
# 1. Setup environment
cp .env.docker.template .env.docker
# Edit .env.docker with your production values

# 2. Add SSL certificates (or generate self-signed)
mkdir -p nginx/ssl
# Place your certificates:
# - nginx/ssl/fullchain.pem
# - nginx/ssl/privkey.pem
# - nginx/ssl/chain.pem

# 3. Deploy
./docker-deploy.sh

# 4. Verify deployment
./docker-healthcheck.sh
```

---

## 📁 Docker Architecture

```
CSS Picker Docker Stack
├── app (Flask + Gunicorn)
├── nginx (Reverse proxy + SSL)
├── redis (Caching + Sessions)
└── logrotate (Log management)
```

### Container Details

| Service | Image | Purpose | Ports |
|---------|-------|---------|-------|
| **app** | `csspicker-backend:latest` | Flask application with Gunicorn | Internal: 5000 |
| **nginx** | `nginx:alpine` | Reverse proxy, SSL termination | 80, 443 |
| **redis** | `redis:7-alpine` | Caching and session storage | Internal: 6379 |
| **logrotate** | `linkyard/docker-logrotate` | Log file management | - |

---

## 🔧 Configuration Files

### Core Files
- **`Dockerfile`** - Multi-stage build for development/production
- **`docker-compose.yml`** - Production container orchestration
- **`docker-compose.dev.yml`** - Development environment
- **`gunicorn_docker_config.py`** - Container-optimized Gunicorn config

### Environment Files
- **`.env.docker.template`** - Production environment variables template
- **`.env.docker.dev`** - Development environment variables
- **`.env.docker`** - Your production environment (create from template)

### Nginx Configuration
- **`nginx/nginx.conf`** - Main Nginx configuration
- **`nginx/conf.d/csspicker.conf`** - Virtual host configuration
- **`nginx/dev.conf`** - Development Nginx config

### Scripts
- **`docker-deploy.sh`** - Automated deployment script
- **`docker-healthcheck.sh`** - Comprehensive health monitoring
- **`monitor-docker.sh`** - Container monitoring (generated)

---

## 🛠️ Development Workflow

### 1. Setup Development Environment
```bash
# Clone repository
git clone <repository-url>
cd css_picker/backend

# Start development stack
./docker-deploy.sh --dev
```

### 2. Code Changes
- Code is mounted as volume in development mode
- Flask auto-reloads on changes
- No need to rebuild container for code changes

### 3. Database Changes
```bash
# Access app container
docker-compose exec app bash

# Run migrations (if any)
python migrate.py
```

### 4. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx
```

---

## 🚀 Production Deployment

### 1. Server Setup
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Application Deployment
```bash
# Upload application code
scp -r backend/ user@your-server:/opt/csspicker/

# SSH to server
ssh user@your-server
cd /opt/csspicker/backend

# Configure environment
cp .env.docker.template .env.docker
nano .env.docker  # Fill in production values

# Deploy
./docker-deploy.sh
```

### 3. SSL Certificate Setup
```bash
# Option 1: Let's Encrypt (recommended)
docker run --rm -it \
  -v /opt/csspicker/backend/nginx/ssl:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone -d csspickerpro.com

# Option 2: Self-signed (development/testing)
./docker-deploy.sh  # Will prompt to generate self-signed certs
```

### 4. Production Monitoring
```bash
# Setup monitoring cron job
echo "*/5 * * * * /opt/csspicker/backend/docker-healthcheck.sh" | crontab -

# Manual health check
./docker-healthcheck.sh

# View monitoring dashboard
./monitor-docker.sh
```

---

## 📊 Monitoring & Operations

### Health Checks
```bash
# Run comprehensive health check
./docker-healthcheck.sh

# Continuous monitoring
./docker-healthcheck.sh --continuous

# View health logs
./docker-healthcheck.sh --logs
```

### Container Management
```bash
# Check status
docker-compose ps

# Scale application
docker-compose up -d --scale app=3

# Restart services
docker-compose restart

# View resource usage
docker stats
```

### Log Management
```bash
# View logs
docker-compose logs -f app
docker-compose logs --tail=100 nginx

# Application logs location
ls -la logs/

# Nginx logs
docker-compose exec nginx ls -la /var/log/nginx/
```

### Backup & Recovery
```bash
# Backup application data
docker run --rm -v csspicker_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup-$(date +%Y%m%d).tar.gz /data

# Backup configuration
tar czf csspicker-config-$(date +%Y%m%d).tar.gz .env.docker nginx/ docker-compose.yml

# Rollback to previous version
./docker-deploy.sh --rollback
```

---

## 🔒 Security Best Practices

### Container Security
- ✅ Non-root user in containers
- ✅ Multi-stage builds (smaller attack surface)
- ✅ Security headers in Nginx
- ✅ Resource limits on containers
- ✅ Private network for inter-container communication

### SSL/TLS Security
- ✅ TLS 1.2+ only
- ✅ Strong cipher suites
- ✅ HSTS headers
- ✅ Certificate auto-renewal

### Network Security
- ✅ Rate limiting on API endpoints
- ✅ Firewall rules (ports 80, 443, 22 only)
- ✅ DDoS protection via Nginx
- ✅ CORS configuration

### Environment Security
```bash
# Secure environment file
chmod 600 .env.docker

# Regular security updates
docker-compose pull
docker-compose up -d

# Security scanning
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd):/tmp aquasec/trivy image csspicker-backend:latest
```

---

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check configuration
docker-compose config

# Validate environment
cat .env.docker
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Test SSL connection
openssl s_client -connect localhost:443

# Renew Let's Encrypt certificate
docker run --rm -it \
  -v /opt/csspicker/backend/nginx/ssl:/etc/letsencrypt \
  certbot/certbot renew
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Check container limits
docker inspect csspicker-app | grep -A 10 "Memory"

# Scale application
docker-compose up -d --scale app=2
```

#### Database Connection Issues
```bash
# Check Redis connection
docker-compose exec redis redis-cli ping

# Check application database connection
docker-compose exec app python -c "from database.connection import DatabaseManager; db = DatabaseManager(); print('DB OK')"
```

### Debug Commands
```bash
# Access container shell
docker-compose exec app bash
docker-compose exec nginx sh

# Check network connectivity
docker-compose exec app ping nginx
docker-compose exec app ping redis

# View container process
docker-compose exec app ps aux

# Check port bindings
docker-compose port nginx 80
docker-compose port nginx 443
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy CSS Picker Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Deploy to production
      run: |
        ssh user@server 'cd /opt/csspicker/backend && git pull && ./docker-deploy.sh'
```

### Automated Testing
```bash
# Add to docker-compose.test.yml
version: '3.8'
services:
  app-test:
    build:
      context: .
      target: development
    command: pytest tests/
    environment:
      - FLASK_ENV=testing
```

---

## 📈 Scaling Strategies

### Horizontal Scaling
```bash
# Scale app containers
docker-compose up -d --scale app=3

# Load balance with Nginx upstream
# (already configured in nginx/conf.d/csspicker.conf)
```

### Vertical Scaling
```yaml
# In docker-compose.yml, increase resources
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 2G
```

### Multi-Host Deployment
```bash
# Use Docker Swarm or Kubernetes
docker swarm init
docker stack deploy -c docker-compose.yml csspicker
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Update Docker images monthly
- [ ] Rotate SSL certificates (automated with Let's Encrypt)
- [ ] Review and rotate secrets quarterly
- [ ] Monitor resource usage and scale as needed
- [ ] Backup configuration and data weekly

### Performance Tuning
- Monitor response times with health checks
- Adjust Gunicorn worker count based on load
- Optimize Nginx caching for static content
- Scale Redis memory based on session usage

### Updates & Patches
```bash
# Update Docker images
docker-compose pull

# Apply updates
docker-compose up -d

# Verify deployment
./docker-healthcheck.sh
```

---

## 🎉 Success Metrics

Your CSS Picker backend Docker deployment is successful when:

- ✅ All containers are healthy and running
- ✅ SSL certificates are valid and auto-renewing
- ✅ Application responds to health checks
- ✅ Nginx serves static files efficiently
- ✅ Redis is connected and functional
- ✅ Logs are being rotated properly
- ✅ Resource usage is within limits
- ✅ Monitoring and alerts are working

**Test your deployment:**
- HTTP redirect: `curl -I http://yourdomain.com`
- HTTPS response: `curl -I https://yourdomain.com`
- API health: `curl https://yourdomain.com/health`
- Load test: `ab -n 1000 -c 10 https://yourdomain.com/`

Happy containerizing! 🐳✨