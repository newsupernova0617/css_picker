# 🚀 CSS Picker Backend - Production Deployment Guide

Complete guide for deploying Flask backend with Gunicorn + Nginx in production.

## 📋 Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Root access (sudo privileges)
- Domain name pointing to your server
- Basic Linux command line knowledge

## 🛠️ Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Upload your code to the server
scp -r backend/ user@your-server:/tmp/

# 2. SSH into your server
ssh user@your-server

# 3. Run the automated deployment script
cd /tmp/backend
sudo ./deploy.sh
```

### Option 2: Manual Step-by-Step

Follow the manual steps below if you want full control over the deployment process.

---

## 📁 File Structure Overview

```
backend/
├── app.py                      # Main Flask application
├── wsgi.py                     # WSGI entry point for Gunicorn
├── production_app.py           # Production-ready app with middleware
├── gunicorn_config.py          # Gunicorn configuration
├── csspicker.service           # Systemd service file
├── nginx_csspicker.conf        # Nginx configuration
├── logging_config.py           # Centralized logging setup
├── requirements-production.txt  # Production dependencies
├── .env.production.template    # Environment variables template
└── deploy.sh                   # Automated deployment script
```

---

## 🔧 Manual Deployment Steps

### Step 1: System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-venv python3-pip nginx supervisor certbot python3-certbot-nginx ufw git
```

### Step 2: Create Application Environment

```bash
# Create application directory
sudo mkdir -p /var/www/csspicker/backend
cd /var/www/csspicker/backend

# Copy your application files
sudo cp -r /path/to/your/backend/* .

# Create Python virtual environment
sudo python3 -m venv venv
sudo ./venv/bin/pip install --upgrade pip

# Install dependencies
sudo ./venv/bin/pip install -r requirements-production.txt
```

### Step 3: Environment Configuration

```bash
# Copy environment template
sudo cp .env.production.template .env.production

# Edit environment variables
sudo nano .env.production
```

**Important:** Fill in all the required values in `.env.production`:

```bash
FLASK_ENV=production
SECRET_KEY=your-super-secure-secret-key-here
TURSO_DATABASE_URL=your-production-database-url
TURSO_AUTH_TOKEN=your-production-auth-token
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
CLERK_SECRET_KEY=sk_live_your_live_clerk_key
# ... other required variables
```

### Step 4: Set Permissions

```bash
# Create necessary directories
sudo mkdir -p /var/log/csspicker
sudo mkdir -p /var/run/csspicker

# Set ownership
sudo chown -R www-data:www-data /var/www/csspicker
sudo chown -R www-data:www-data /var/log/csspicker
sudo chown -R www-data:www-data /var/run/csspicker

# Set permissions
sudo chmod -R 755 /var/www/csspicker
sudo chmod 640 /var/www/csspicker/backend/.env.production
```

### Step 5: Install Systemd Service

```bash
# Copy service file
sudo cp csspicker.service /etc/systemd/system/

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable csspicker

# Start the service
sudo systemctl start csspicker

# Check status
sudo systemctl status csspicker
```

### Step 6: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp nginx_csspicker.conf /etc/nginx/sites-available/csspicker

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Enable our site
sudo ln -s /etc/nginx/sites-available/csspicker /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Configure Firewall

```bash
# Enable UFW
sudo ufw --force enable

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

### Step 8: Obtain SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

---

## ✅ Verification & Testing

### Check Services

```bash
# Check application service
sudo systemctl status csspicker

# Check Nginx
sudo systemctl status nginx

# Check application logs
sudo journalctl -u csspicker -f

# Check Nginx logs
sudo tail -f /var/log/nginx/csspicker_access.log
sudo tail -f /var/log/nginx/csspicker_error.log
```

### Test Application

```bash
# Test local health check
curl http://localhost:5000/health

# Test through Nginx (HTTP - should redirect to HTTPS)
curl -I http://yourdomain.com

# Test HTTPS
curl -I https://yourdomain.com

# Test detailed health check
curl https://yourdomain.com/health/detailed
```

### Performance Testing

```bash
# Install Apache Bench (optional)
sudo apt install apache2-utils

# Basic load test
ab -n 1000 -c 10 https://yourdomain.com/

# Test API endpoints
ab -n 100 -c 5 -H "Authorization: Bearer your-test-token" https://yourdomain.com/api/user/profile
```

---

## 📊 Monitoring & Maintenance

### Log Files

- **Application Logs:** `/var/log/csspicker/`
- **Nginx Logs:** `/var/log/nginx/`
- **System Logs:** `journalctl -u csspicker`

### Useful Commands

```bash
# Restart application
sudo systemctl restart csspicker

# Reload Gunicorn (graceful restart)
sudo systemctl reload csspicker

# Check resource usage
htop
sudo iotop
sudo netstat -tulpn

# Monitor logs in real-time
sudo tail -f /var/log/csspicker/application.log
sudo journalctl -u csspicker -f
```

### Health Monitoring

The deployment includes a health check script at `/usr/local/bin/csspicker-health.sh` that runs every 5 minutes via cron.

View health check logs:
```bash
sudo tail -f /var/log/csspicker/health.log
```

---

## 🔒 Security Best Practices

### Server Security

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure SSH:**
   - Disable root login
   - Use key-based authentication
   - Change default SSH port

3. **Monitor failed login attempts:**
   ```bash
   sudo tail -f /var/log/auth.log
   ```

### Application Security

1. **Environment Variables:**
   - Never commit `.env.production` to version control
   - Use strong, unique passwords and secrets
   - Rotate credentials regularly

2. **SSL/TLS:**
   - Use strong cipher suites (configured in Nginx)
   - Enable HSTS headers
   - Regular certificate renewal

3. **Rate Limiting:**
   - Configured in Nginx for API endpoints
   - Monitor for unusual traffic patterns

---

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check service status and logs
sudo systemctl status csspicker
sudo journalctl -u csspicker -n 50

# Common causes:
# 1. Permission issues
sudo chown -R www-data:www-data /var/www/csspicker

# 2. Missing environment variables
sudo nano /var/www/csspicker/backend/.env.production

# 3. Python path issues
sudo systemctl edit csspicker
# Add: Environment=PYTHONPATH=/var/www/csspicker/backend
```

#### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Common causes:
# 1. Port conflicts
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 2. File permissions
sudo chown -R www-data:www-data /var/www/csspicker
```

#### Database Connection Issues

```bash
# Check environment variables
cat /var/www/csspicker/backend/.env.production

# Test database connection
cd /var/www/csspicker/backend
sudo -u www-data ./venv/bin/python -c "from database.connection import DatabaseManager; db = DatabaseManager(); print('Database connection successful')"
```

#### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -noout -dates
```

### Getting Help

1. **Check logs first:**
   ```bash
   sudo journalctl -u csspicker -f
   tail -f /var/log/csspicker/error.log
   ```

2. **Verify configuration:**
   ```bash
   # Check if all files are in place
   ls -la /var/www/csspicker/backend/

   # Check service file
   sudo systemctl cat csspicker

   # Check Nginx config
   sudo nginx -T
   ```

3. **Test individual components:**
   ```bash
   # Test Flask app directly
   cd /var/www/csspicker/backend
   sudo -u www-data ./venv/bin/python wsgi.py

   # Test Gunicorn directly
   sudo -u www-data ./venv/bin/gunicorn --config gunicorn_config.py wsgi:application
   ```

---

## 🔄 Updates & Maintenance

### Deploying Updates

```bash
# 1. Backup current version
sudo cp -r /var/www/csspicker/backend /var/backups/csspicker-$(date +%Y%m%d)

# 2. Upload new code
# (upload your updated code)

# 3. Install new dependencies
cd /var/www/csspicker/backend
sudo ./venv/bin/pip install -r requirements-production.txt

# 4. Run database migrations (if any)
# sudo -u www-data ./venv/bin/python migrate.py

# 5. Restart services
sudo systemctl restart csspicker
sudo systemctl reload nginx
```

### Backup Strategy

```bash
# Create backup script
cat > /usr/local/bin/csspicker-backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/csspicker"
mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/csspicker_app_$DATE.tar.gz -C /var/www csspicker

# Backup logs
tar -czf $BACKUP_DIR/csspicker_logs_$DATE.tar.gz -C /var/log csspicker

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/csspicker-backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /usr/local/bin/csspicker-backup.sh" | sudo crontab -
```

---

## 📈 Performance Optimization

### Gunicorn Tuning

Edit `/var/www/csspicker/backend/gunicorn_config.py`:

```python
# For high-traffic sites, adjust these values:
workers = (2 * cpu_count()) + 1  # Increase workers
worker_connections = 1000         # Increase connections
max_requests = 1000              # Restart workers after N requests
preload_app = True               # Preload application code
```

### Nginx Tuning

Add to `/etc/nginx/nginx.conf` in the `http` block:

```nginx
# Worker processes
worker_processes auto;
worker_rlimit_nofile 65535;

# Events
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

# HTTP optimizations
http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 30;
    keepalive_requests 100;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Database Optimization

For high-traffic sites, consider:
- Connection pooling
- Redis caching for sessions
- Database query optimization
- CDN for static assets

---

## ✨ Success!

Your CSS Picker backend is now running in production with:

- ✅ Gunicorn WSGI server with multiple workers
- ✅ Nginx reverse proxy with SSL/TLS
- ✅ Systemd service management
- ✅ Comprehensive logging
- ✅ Security headers and firewall
- ✅ Automatic SSL certificate renewal
- ✅ Health monitoring
- ✅ Performance optimization

**Test your deployment:** https://yourdomain.com

---

## 📞 Support

For issues with this deployment guide, check:
1. Application logs: `/var/log/csspicker/`
2. System logs: `journalctl -u csspicker`
3. Nginx logs: `/var/log/nginx/`

Happy deploying! 🚀