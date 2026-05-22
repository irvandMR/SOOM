# SOOM Deployment Checklist & Guide

## Pre-Deployment Checklist

### 1. **Environment Variables** ✓
- [ ] Copy `.env.example` to `.env`
- [ ] Set `DB_PASSWORD` to a strong password
- [ ] Set `REDIS_PASSWORD` (if using authentication)
- [ ] Set `JWT_SECRET` to a strong secret key (min 32 chars)
  ```bash
  # Generate secure secret:
  openssl rand -base64 32
  ```
- [ ] Configure `MAIL_*` variables for email notifications
- [ ] Set `VITE_API_URL` to your production API URL
- [ ] Review all default values and update for production

### 2. **Database Setup**
- [ ] Ensure PostgreSQL 16 is installed/running
- [ ] Verify database credentials
- [ ] Flyway migrations will run automatically on startup
- [ ] **Database Migrations Status**: 15 migrations from V1 to V15
  - V1: Initial tables
  - V2-V5: User system, admin, password updates
  - V6-V9: Production dates, unit conversions
  - V10-V15: Order items, units, tenant system, COGS

### 3. **Backend Security** ✓
- [ ] Verify JWT secret is not using default value
- [ ] Check that sensitive configs are in environment variables
- [ ] Review SecurityConfig for CORS settings
- [ ] Verify authentication filter is properly configured
- [ ] Test JWT token refresh mechanism

### 4. **Frontend Build**
- [ ] Verify `VITE_API_URL` is set correctly
- [ ] Check that no hardcoded API URLs exist
- [ ] Build optimization:
  ```bash
  cd frontend
  npm install
  npm run build
  ```
- [ ] Verify bundle size is reasonable
- [ ] Test that app works in production mode

### 5. **Docker & Docker Compose**
- [ ] Verify Docker and Docker Compose installed
- [ ] Review docker-compose.yml service configurations
- [ ] Ensure volume mappings are correct
- [ ] Check port mappings (5432 for DB, 6379 for Redis, 8081 for Backend, 80 for Frontend)
- [ ] Build images:
  ```bash
  docker-compose build
  ```

### 6. **Configuration Files**
- [ ] Backend application.yaml - uses environment variables ✓
- [ ] Frontend nginx.conf - serves SPA correctly ✓
- [ ] Dockerfile for backend (multi-stage build) ✓
- [ ] Dockerfile for frontend (multi-stage build) ✓

### 7. **Testing Before Deploy**
- [ ] Run unit tests locally:
  ```bash
  # Backend
  cd backend
  mvn test
  
  # Frontend
  cd frontend
  npm test
  ```
- [ ] Run e2e tests with Cypress:
  ```bash
  npm run cypress:open
  ```
- [ ] Test authentication flow
- [ ] Test pagination (recently fixed)
- [ ] Test card-based product/recipe views

### 8. **API Verification**
- [ ] Health check endpoint: `GET /api/health`
- [ ] Login endpoint: `POST /api/v1/auth/login`
- [ ] Test CORS headers
- [ ] Verify JWT refresh token mechanism
- [ ] Check API error responses

---

## Deployment Steps

### Option A: Docker Compose (Recommended for Development/Testing)

```bash
# 1. Navigate to project root
cd /path/to/SOOM

# 2. Create .env file
cp .env.example .env
# Edit .env with your values

# 3. Build and start services
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:80
# Backend: http://localhost:8081
# Health check: http://localhost:8081/api/health
```

### Option B: Production Deployment (Kubernetes/Cloud)

For production deployments to platforms like AWS, GCP, or Azure:

1. **Database Setup**
   - Use managed PostgreSQL service (RDS, Cloud SQL, Azure Database)
   - Configure automatic backups
   - Set up connection pooling

2. **Backend Deployment**
   - Deploy JAR directly or use Docker container
   - Set environment variables in your platform
   - Configure proper logging
   - Set up monitoring and alerts

3. **Frontend Deployment**
   - Deploy built dist folder to CDN/static hosting
   - Configure CORS origins
   - Set up SSL/TLS certificates
   - Enable gzip compression

4. **Redis Setup**
   - Use managed Redis service if available
   - Or deploy Redis container with persistence
   - Configure monitoring

---

## Post-Deployment Verification

- [ ] Frontend loads without errors
- [ ] Can login with credentials
- [ ] Can navigate to all pages
- [ ] Pagination works correctly
- [ ] Can create/edit/delete entities
- [ ] Email notifications work (if configured)
- [ ] Database migrations completed successfully
- [ ] Check application logs for errors
- [ ] Monitor resource usage
- [ ] Test backup/recovery procedures

---

## Important Security Notes

⚠️ **BEFORE DEPLOYING TO PRODUCTION:**

1. **Change Default JWT Secret**
   - Current default: `soom-super-secret-key-ganti-ini-sekarang-2026`
   - Generate new: `openssl rand -base64 32`
   - Set in `JWT_SECRET` environment variable

2. **Set Strong Database Password**
   - Never use default `postgres` in production
   - Use strong password in `DB_PASSWORD`

3. **Configure HTTPS**
   - Use SSL/TLS certificates
   - Update `VITE_API_URL` to use HTTPS
   - Set secure cookie flags

4. **Email Configuration**
   - Use Gmail App Password (not regular password)
   - Or configure corporate email server
   - Test email sending before deployment

5. **Environment Variables**
   - Never commit `.env` file to git
   - Use `.env.example` as template
   - Store secrets in secure vault (HashiCorp Vault, AWS Secrets Manager, etc.)

6. **Database Backups**
   - Set up automated daily backups
   - Test restore procedures
   - Use separate backup storage

---

## Monitoring & Maintenance

### Logs
- Backend logs: Check Docker logs or application logs
- Frontend: Check browser console and nginx error logs
- Database: Enable PostgreSQL logging

### Performance
- Monitor CPU and memory usage
- Check database query performance
- Monitor API response times

### Updates
- Keep dependencies updated
- Monitor security advisories
- Plan regular security audits

---

## Rollback Procedure

If deployment fails:

```bash
# Stop current deployment
docker-compose down

# Switch to previous version (if using versioning)
docker-compose -f docker-compose.v1.yml up

# Or restore from backup
# [Your backup restoration procedure]
```

---

## Contact & Support

For issues or questions:
- Check application logs
- Verify environment configuration
- Review error messages in console
- Check connectivity to PostgreSQL and Redis
