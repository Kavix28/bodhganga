# Production Deployment Checklist

## Pre-Deployment Requirements

### 1. Infrastructure Setup
- [ ] PostgreSQL database server configured
- [ ] SMTP server for email notifications
- [ ] Domain name and DNS configuration
- [ ] SSL certificates obtained
- [ ] Server with Docker and Docker Compose installed

### 2. Environment Configuration
- [ ] `.env` file created from `.env.example`
- [ ] Database credentials configured
- [ ] JWT secret key generated (minimum 32 characters)
- [ ] Stripe API keys (live keys for production)
- [ ] SMTP credentials configured
- [ ] Frontend URL configured
- [ ] Upload directory configured

### 3. Security Configuration
- [ ] Strong database passwords
- [ ] Secure JWT secret
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Security headers configured

## Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/gangabhodh
sudo chown $USER:$USER /opt/gangabhodh
cd /opt/gangabhodh
```

### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url> .

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Deploy application
./deploy.sh deploy
```

### 3. SSL Certificate Setup
```bash
# Using Let's Encrypt (recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx directory
sudo mkdir -p ./ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*

# Update nginx.conf to enable HTTPS
# Uncomment HTTPS server block and update server_name
```

### 4. Database Setup
```bash
# Connect to PostgreSQL
psql -h localhost -U gangabhodh -d gangabhodh

# Verify tables are created
\dt

# Check if admin user exists
SELECT * FROM users WHERE role = 'ADMIN';
```

## Post-Deployment Verification

### 1. Health Checks
- [ ] Application health: `curl http://localhost:5000/actuator/health`
- [ ] Database connectivity: Check health endpoint response
- [ ] Email service: Test registration flow
- [ ] Payment service: Test with Stripe test mode

### 2. API Testing
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"test@example.com","password":"Test123!","name":"Test User"}'

# Test login (after OTP verification)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"test@example.com","password":"Test123!"}'

# Test content listing
curl http://localhost:5000/api/content
```

### 3. Security Testing
- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] Rate limiting functional
- [ ] Authentication required for protected endpoints
- [ ] Admin endpoints restricted

### 4. Performance Testing
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] File upload/download working
- [ ] PDF streaming functional

## Monitoring Setup

### 1. Log Monitoring
```bash
# View application logs
docker-compose logs -f app

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f postgres
```

### 2. Health Monitoring
- [ ] Set up monitoring for `/actuator/health`
- [ ] Configure alerts for service failures
- [ ] Monitor disk space for uploads
- [ ] Monitor database performance

### 3. Backup Strategy
```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec gangabhodh-postgres pg_dump -U gangabhodh gangabhodh > $BACKUP_DIR/db_backup_$DATE.sql

# Schedule with cron
0 2 * * * /opt/gangabhodh/backup.sh
```

## Maintenance Tasks

### 1. Regular Updates
- [ ] Update Docker images monthly
- [ ] Update SSL certificates (automated with Let's Encrypt)
- [ ] Review and update dependencies
- [ ] Monitor security advisories

### 2. Database Maintenance
- [ ] Regular backups
- [ ] Monitor database size
- [ ] Clean up expired tokens (automated)
- [ ] Optimize queries if needed

### 3. File Management
- [ ] Monitor upload directory size
- [ ] Implement file cleanup policies
- [ ] Backup important files
- [ ] Monitor disk space

## Troubleshooting

### Common Issues

#### Application Won't Start
1. Check Docker logs: `docker-compose logs app`
2. Verify environment variables
3. Check database connectivity
4. Ensure ports are available

#### Database Connection Issues
1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check database credentials in `.env`
3. Test connection: `docker exec -it gangabhodh-postgres psql -U gangabhodh -d gangabhodh`

#### Email Not Working
1. Verify SMTP credentials
2. Check firewall rules for SMTP ports
3. Test with a simple email client

#### Payment Issues
1. Verify Stripe API keys
2. Check webhook endpoint accessibility
3. Review Stripe dashboard for errors

### Performance Issues
1. Monitor database queries
2. Check available memory and CPU
3. Review nginx access logs
4. Optimize database indexes if needed

## Security Considerations

### 1. Regular Security Tasks
- [ ] Update system packages
- [ ] Review access logs
- [ ] Monitor failed login attempts
- [ ] Check for unusual API usage

### 2. Security Hardening
- [ ] Disable unnecessary services
- [ ] Configure fail2ban
- [ ] Set up intrusion detection
- [ ] Regular security audits

### 3. Data Protection
- [ ] Encrypt sensitive data
- [ ] Secure backup storage
- [ ] Implement data retention policies
- [ ] GDPR compliance (if applicable)

## Rollback Plan

### In Case of Issues
1. Stop current deployment: `docker-compose down`
2. Restore previous version: `git checkout <previous-tag>`
3. Restore database backup if needed
4. Redeploy: `./deploy.sh deploy`

### Database Rollback
```bash
# Restore from backup
docker exec -i gangabhodh-postgres psql -U gangabhodh -d gangabhodh < backup_file.sql
```

## Support Contacts

- **Technical Issues**: [Your support email]
- **Security Issues**: [Your security email]
- **Emergency Contact**: [Your emergency contact]

---

**Note**: This checklist should be customized based on your specific infrastructure and requirements. Always test the deployment process in a staging environment before production deployment.