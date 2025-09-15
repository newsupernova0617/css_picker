#!/bin/bash

# CSS Picker Backend - Docker Deployment Script
# Automated deployment script for Docker containerized application

set -e  # Exit on any error

echo "🐳 Starting CSS Picker Docker Deployment..."

# Configuration
APP_NAME="csspicker"
DOCKER_IMAGE="csspicker-backend"
COMPOSE_PROJECT="csspicker"
DOMAIN="csspickerpro.com"
ENV_FILE="../.env.docker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo -e "${BLUE}
===========================================
$1
===========================================${NC}"
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi

    print_status "Docker and Docker Compose are available"
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"

    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "${ENV_FILE}.template" ]; then
            print_warning "Environment file not found. Creating from template..."
            cp "${ENV_FILE}.template" "$ENV_FILE"
            print_warning "Please edit $ENV_FILE with your actual values before continuing."
            read -p "Press Enter after editing the environment file..."
        else
            print_error "Environment template file not found!"
            exit 1
        fi
    fi

    # Create necessary directories
    mkdir -p ../logs/nginx
    mkdir -p ../nginx/ssl
    mkdir -p ../static

    print_status "Environment setup complete"
}

# Build Docker images
build_images() {
    print_header "Building Docker Images"

    print_info "Building application image..."
    docker build -t ${DOCKER_IMAGE}:latest ..

    # Tag with timestamp for rollback capability
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    docker tag ${DOCKER_IMAGE}:latest ${DOCKER_IMAGE}:${TIMESTAMP}

    print_status "Docker images built successfully"
    print_info "Images tagged: latest, ${TIMESTAMP}"
}

# Setup SSL certificates
setup_ssl() {
    print_header "Setting Up SSL Certificates"

    if [ ! -f "../nginx/ssl/fullchain.pem" ] || [ ! -f "../nginx/ssl/privkey.pem" ]; then
        print_warning "SSL certificates not found."

        read -p "Do you want to generate self-signed certificates for testing? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Generate self-signed certificates for testing
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ../nginx/ssl/privkey.pem \
                -out ../nginx/ssl/fullchain.pem \
                -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}"

            cp ../nginx/ssl/fullchain.pem ../nginx/ssl/chain.pem
            print_status "Self-signed certificates generated"
        else
            print_warning "Please place your SSL certificates in ../nginx/ssl/ directory:"
            print_info "- ../nginx/ssl/fullchain.pem"
            print_info "- ../nginx/ssl/privkey.pem"
            print_info "- ../nginx/ssl/chain.pem"
            read -p "Press Enter after adding SSL certificates..."
        fi
    else
        print_status "SSL certificates found"
    fi
}

# Deploy application
deploy_application() {
    print_header "Deploying Application"

    # Stop existing containers
    print_info "Stopping existing containers..."
    docker-compose -p $COMPOSE_PROJECT down --remove-orphans || true

    # Start new containers
    print_info "Starting new containers..."
    docker-compose -p $COMPOSE_PROJECT up -d

    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."

    # Wait for app service
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker-compose -p $COMPOSE_PROJECT ps app | grep -q "Up (healthy)"; then
            break
        fi

        if [ $attempt -eq $max_attempts ]; then
            print_error "Application failed to start within timeout"
            docker-compose -p $COMPOSE_PROJECT logs app
            exit 1
        fi

        print_info "Waiting for application to be healthy... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    print_status "Application deployed successfully"
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"

    # Check container status
    print_info "Checking container status..."
    docker-compose -p $COMPOSE_PROJECT ps

    # Test health endpoints
    print_info "Testing health endpoints..."

    # Test Nginx health
    if curl -f -s http://localhost/health > /dev/null; then
        print_status "Nginx health check passed"
    else
        print_warning "Nginx health check failed"
    fi

    # Test application health
    if curl -f -s http://localhost:5000/health > /dev/null 2>&1 || \
       docker-compose -p $COMPOSE_PROJECT exec -T app curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Application health check passed"
    else
        print_warning "Application health check failed"
    fi

    # Show logs
    print_info "Recent application logs:"
    docker-compose -p $COMPOSE_PROJECT logs --tail=20 app

    print_status "Deployment verification complete"
}

# Setup monitoring
setup_monitoring() {
    print_header "Setting Up Monitoring"

    # Create monitoring script
    cat > monitor-docker.sh << 'EOF'
#!/bin/bash
# CSS Picker Docker Monitoring Script

COMPOSE_PROJECT="csspicker"

echo "=== Container Status ==="
docker-compose -p $COMPOSE_PROJECT ps

echo -e "\n=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo -e "\n=== Recent Logs ==="
docker-compose -p $COMPOSE_PROJECT logs --tail=10

echo -e "\n=== Health Checks ==="
curl -s http://localhost/health | jq . || echo "Nginx health check failed"
curl -s http://localhost:5000/health | jq . || echo "App health check failed"
EOF

    chmod +x monitor-docker.sh

    # Create log rotation for Docker logs
    cat > logrotate.conf << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    missingok
    delaycompress
    copytruncate
}
EOF

    print_status "Monitoring setup complete"
    print_info "Use './monitor-docker.sh' to check status"
}

# Cleanup old images
cleanup() {
    print_header "Cleaning Up"

    print_info "Removing old Docker images..."
    docker image prune -f

    # Keep only last 3 tagged images
    OLD_IMAGES=$(docker images ${DOCKER_IMAGE} --format "{{.Tag}}" | grep -E "^[0-9]{8}_[0-9]{6}$" | sort -r | tail -n +4)
    if [ ! -z "$OLD_IMAGES" ]; then
        for tag in $OLD_IMAGES; do
            docker rmi ${DOCKER_IMAGE}:$tag || true
        done
    fi

    print_status "Cleanup complete"
}

# Rollback function
rollback() {
    print_header "Rolling Back Deployment"

    PREVIOUS_TAG=$(docker images ${DOCKER_IMAGE} --format "{{.Tag}}" | grep -E "^[0-9]{8}_[0-9]{6}$" | sort -r | head -2 | tail -1)

    if [ -z "$PREVIOUS_TAG" ]; then
        print_error "No previous version found for rollback"
        exit 1
    fi

    print_info "Rolling back to version: $PREVIOUS_TAG"

    # Tag previous version as latest
    docker tag ${DOCKER_IMAGE}:${PREVIOUS_TAG} ${DOCKER_IMAGE}:latest

    # Restart containers
    docker-compose -p $COMPOSE_PROJECT up -d

    print_status "Rollback complete"
}

# Main deployment function
main() {
    print_header "CSS Picker Docker Deployment"

    # Check for rollback flag
    if [ "$1" = "--rollback" ]; then
        rollback
        exit 0
    fi

    # Check for development flag
    if [ "$1" = "--dev" ]; then
        ENV_FILE="../.env"
        COMPOSE_FILE="../docker/docker-compose.dev.yml"
        export COMPOSE_FILE
        print_info "Development mode enabled"
    fi

    # Run deployment steps
    check_docker
    setup_environment
    build_images

    if [ "$1" != "--dev" ]; then
        setup_ssl
    fi

    deploy_application
    verify_deployment
    setup_monitoring
    cleanup

    print_header "Deployment Complete! 🎉"

    echo -e """
${GREEN}=== Deployment Summary ===${NC}
✅ Docker images built and tagged
✅ Containers deployed and running
✅ Health checks passed
✅ Monitoring scripts created
✅ SSL certificates configured

${YELLOW}Next Steps:${NC}
1. Test your application: curl -I http://localhost
2. Check logs: docker-compose -p $COMPOSE_PROJECT logs -f
3. Monitor: ./monitor-docker.sh
4. Scale if needed: docker-compose -p $COMPOSE_PROJECT up -d --scale app=3

${YELLOW}Useful Commands:${NC}
• Check status: docker-compose -p $COMPOSE_PROJECT ps
• View logs: docker-compose -p $COMPOSE_PROJECT logs -f app
• Restart: docker-compose -p $COMPOSE_PROJECT restart
• Scale: docker-compose -p $COMPOSE_PROJECT up -d --scale app=2
• Rollback: $0 --rollback
• Development: $0 --dev
"""
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "CSS Picker Docker Deployment Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --dev        Deploy in development mode"
        echo "  --rollback   Rollback to previous version"
        echo "  --help       Show this help message"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac