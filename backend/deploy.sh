#!/bin/bash

# CSS Picker Backend - Production Deployment Script
# This script automates the deployment of the Flask app with Gunicorn and Nginx

set -e  # Exit on any error

echo "🚀 Starting CSS Picker Backend Deployment..."

# Configuration
APP_NAME="csspicker"
APP_USER="www-data"
APP_GROUP="www-data"
APP_DIR="/var/www/csspicker"
BACKEND_DIR="$APP_DIR/backend"
SERVICE_FILE="csspicker.service"
NGINX_CONFIG="nginx/conf.d/csspicker.conf"
DOMAIN="csspickerpro.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_status "Starting deployment process..."

# Step 1: Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Step 2: Install required system packages
print_status "Installing system dependencies..."
apt install -y python3 python3-venv python3-pip nginx supervisor certbot python3-certbot-nginx ufw

# Step 3: Create application directories
print_status "Creating application directories..."
mkdir -p $APP_DIR
mkdir -p $BACKEND_DIR
mkdir -p /var/log/csspicker
mkdir -p /var/run/csspicker

# Step 4: Set up Python virtual environment
print_status "Setting up Python virtual environment..."
cd $BACKEND_DIR
python3 -m venv venv
source venv/bin/activate

# Step 5: Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
if [ -f "requirements-production.txt" ]; then
    pip install -r requirements-production.txt
else
    print_warning "requirements-production.txt not found, installing basic dependencies..."
    pip install flask gunicorn flask-cors python-dotenv libsql-client PyJWT stripe requests
fi

# Step 6: Set up environment variables
print_status "Setting up environment variables..."
if [ ! -f ".env.production" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        print_warning "Please edit .env.production with your actual production values"
    else
        print_error ".env.example not found!"
        exit 1
    fi
fi

# Step 7: Set correct permissions
print_status "Setting file permissions..."
chown -R $APP_USER:$APP_GROUP $APP_DIR
chmod -R 755 $APP_DIR
chmod 640 $BACKEND_DIR/.env.production
chown -R $APP_USER:$APP_GROUP /var/log/csspicker
chown -R $APP_USER:$APP_GROUP /var/run/csspicker

# Step 8: Install systemd service
print_status "Installing systemd service..."
if [ -f "$SERVICE_FILE" ]; then
    cp $SERVICE_FILE /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable $APP_NAME
    print_status "Systemd service installed and enabled"
else
    print_error "$SERVICE_FILE not found!"
    exit 1
fi

# Step 9: Configure Nginx
print_status "Configuring Nginx..."
if [ -f "$NGINX_CONFIG" ]; then
    cp $NGINX_CONFIG /etc/nginx/sites-available/$APP_NAME

    # Remove default site if exists
    rm -f /etc/nginx/sites-enabled/default

    # Enable our site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

    # Test Nginx configuration
    if nginx -t; then
        print_status "Nginx configuration is valid"
    else
        print_error "Nginx configuration test failed!"
        exit 1
    fi
else
    print_error "$NGINX_CONFIG not found!"
    exit 1
fi

# Step 10: Configure Firewall
print_status "Configuring UFW firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw status

# Step 11: Obtain SSL Certificate
print_status "Setting up SSL certificate..."
print_warning "Make sure your domain points to this server before continuing"
read -p "Do you want to obtain SSL certificate now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    print_status "SSL certificate obtained"
else
    print_warning "SSL certificate skipped. You can run 'sudo certbot --nginx -d $DOMAIN' later"
fi

# Step 12: Start services
print_status "Starting services..."
systemctl start $APP_NAME
systemctl restart nginx

# Step 13: Check service status
print_status "Checking service status..."
if systemctl is-active --quiet $APP_NAME; then
    print_status "CSS Picker backend service is running"
else
    print_error "CSS Picker backend service failed to start"
    systemctl status $APP_NAME
    exit 1
fi

if systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx failed to start"
    systemctl status nginx
    exit 1
fi

# Step 14: Set up log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/csspicker << EOF
/var/log/csspicker/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_GROUP
    postrotate
        systemctl reload $APP_NAME
    endscript
}
EOF

# Step 15: Create basic monitoring script
print_status "Creating monitoring script..."
cat > /usr/local/bin/csspicker-health.sh << 'EOF'
#!/bin/bash
# CSS Picker Health Check Script

APP_NAME="csspicker"
LOG_FILE="/var/log/csspicker/health.log"

check_service() {
    if systemctl is-active --quiet $1; then
        echo "$(date): $1 is running" >> $LOG_FILE
        return 0
    else
        echo "$(date): $1 is NOT running" >> $LOG_FILE
        return 1
    fi
}

# Check services
check_service csspicker
check_service nginx

# Check HTTP response
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "$(date): HTTP health check passed" >> $LOG_FILE
else
    echo "$(date): HTTP health check failed with status $HTTP_STATUS" >> $LOG_FILE
fi
EOF

chmod +x /usr/local/bin/csspicker-health.sh

# Set up cron job for health checks
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/csspicker-health.sh") | crontab -

print_status "Deployment completed successfully! 🎉"

echo -e """
${GREEN}=== Deployment Summary ===${NC}
✅ System packages updated
✅ Python virtual environment created
✅ Dependencies installed
✅ Systemd service configured
✅ Nginx configured
✅ Firewall configured
✅ Services started
✅ Log rotation configured
✅ Health monitoring configured

${YELLOW}Next Steps:${NC}
1. Edit /var/www/csspicker/backend/.env.production with your actual values
2. Test your application: curl -I https://$DOMAIN
3. Check logs: journalctl -u $APP_NAME -f
4. Monitor: systemctl status $APP_NAME

${YELLOW}Useful Commands:${NC}
• Restart app: systemctl restart $APP_NAME
• Check logs: journalctl -u $APP_NAME -f
• Nginx status: systemctl status nginx
• Test config: nginx -t
• View health: tail -f /var/log/csspicker/health.log
"""

print_status "Deployment script completed!"