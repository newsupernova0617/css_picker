# Production Deployment Plan

## 🚀 Move to Real Mode

### Environment Configuration
- [ ] **Update Backend URLs**
  - Change from `localhost:4242` to production domain
  - Update `CLERK_CONFIG.syncHost` in clerk-config.js
  - Update CSP policies for production domains

- [ ] **Production Environment Variables**
  - Set `FLASK_ENV=production` 
  - Configure production database URLs
  - Set secure session configurations
  - Enable production logging

### Database Migration
- [ ] **Production Database Setup**
  - Migrate from local SQLite to production Turso
  - Run database migrations
  - Set up backup strategies
  - Configure connection pooling

### Security Hardening
- [ ] **SSL/TLS Configuration** 
  - Ensure HTTPS-only communications
  - Configure SSL certificates
  - Set secure cookie flags
  - Enable HSTS headers

- [ ] **Production Secrets**
  - Rotate API keys and tokens
  - Use environment-specific secrets
  - Secure credential storage
  - Remove debug/development keys

## 🌐 Render Deployment

### Backend Deployment (Flask API)
- [ ] **Render Service Configuration**
  - Create new Web Service on Render
  - Configure Python environment
  - Set up environment variables
  - Configure build and start commands

- [ ] **Dependencies & Requirements**
  - Update requirements.txt with production packages
  - Configure gunicorn for production serving
  - Set up health check endpoints
  - Configure logging and monitoring

### Frontend Deployment Considerations
- [ ] **Chrome Extension Package**
  - Update manifest.json with production URLs
  - Test extension with production backend
  - Package extension for distribution
  - Prepare Chrome Web Store submission

### Monitoring & Observability  
- [ ] **Production Monitoring**
  - Set up error tracking (Sentry)
  - Configure performance monitoring
  - Set up uptime monitoring
  - Create alerting rules

- [ ] **Logging Strategy**
  - Centralized logging configuration
  - Log rotation and retention
  - Security event logging
  - Performance metrics collection

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] Code review completed
- [ ] Performance benchmarks met
- [ ] Security review passed

### Configuration
- [ ] Environment variables set
- [ ] Database connections tested
- [ ] External service integrations verified
- [ ] SSL certificates valid

### Backup & Recovery
- [ ] Database backup procedures
- [ ] Configuration backup
- [ ] Rollback plan documented
- [ ] Recovery procedures tested

## 🔄 Deployment Process

### Phase 1: Staging Deployment
- [ ] Deploy to Render staging environment
- [ ] Run full test suite against staging
- [ ] Performance testing on staging
- [ ] Security testing on staging

### Phase 2: Production Deployment
- [ ] Deploy backend to production
- [ ] Update DNS records if needed
- [ ] Monitor deployment health
- [ ] Verify all services operational

### Phase 3: Extension Update
- [ ] Update extension with production URLs
- [ ] Test extension against production
- [ ] Package final extension version
- [ ] Prepare for Chrome Web Store

---

## 🏗️ Render-Specific Configuration

### Web Service Settings
```yaml
name: css-picker-backend
environment: python
build_command: pip install -r requirements.txt
start_command: gunicorn app:app
```

### Environment Variables
```
FLASK_ENV=production
SECRET_KEY=<production-secret>
CLERK_SECRET_KEY=<production-clerk-key>
STRIPE_SECRET_KEY=<production-stripe-key>
TURSO_DATABASE_URL=<production-db-url>
TURSO_AUTH_TOKEN=<production-db-token>
```

---

*Status: Deployment planning complete*