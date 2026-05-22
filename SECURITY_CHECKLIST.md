# SOOM Security Checklist for Deployment

## ⚠️ Critical Security Issues to Address Before Production

### 1. JWT Secret Key
**Status**: Default value must be changed
**Risk Level**: CRITICAL

Current default: `soom-super-secret-key-ganti-ini-sekarang-2026`

**Action Required**:
```bash
# Generate secure secret (at least 32 characters)
openssl rand -base64 32

# Add to .env
JWT_SECRET=<generated-secret-here>
```

### 2. Database Password
**Status**: Default value is insecure
**Risk Level**: CRITICAL

Current default: `postgres`

**Action Required**:
```bash
# Generate strong password
DB_PASSWORD=<strong-random-password>
```

### 3. Email Credentials
**Status**: Placeholder values in config
**Risk Level**: HIGH

Default values use placeholder emails.

**Action Required for Gmail**:
1. Enable 2-factor authentication on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Set in .env:
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=<generated-app-password>
```

### 4. Redis Security
**Status**: No authentication configured
**Risk Level**: MEDIUM (if exposed to network)

**Action Required**:
```env
REDIS_PASSWORD=<strong-redis-password>
```

Update docker-compose.yml:
```yaml
redis:
  command: redis-server --requirepass ${REDIS_PASSWORD}
```

---

## 🔒 Security Best Practices

### API Security
- [ ] Enable HTTPS in production
- [ ] Set secure CORS origins (not wildcard)
- [ ] Validate all input on backend
- [ ] Implement rate limiting
- [ ] Use security headers:
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security

### Authentication & Authorization
- [ ] JWT tokens use HTTPS only
- [ ] Token refresh mechanism tested
- [ ] Password hashing verified (should use BCrypt)
- [ ] Multi-factor authentication (recommended)
- [ ] Session timeout configured

### Database Security
- [ ] Connection uses strong password
- [ ] SSL/TLS enabled for remote connections
- [ ] Backups encrypted
- [ ] Sensitive data fields encrypted
- [ ] Access restricted by IP whitelist (if possible)
- [ ] Read replicas for sensitive data (optional)

### Data Privacy
- [ ] PII data handling documented
- [ ] Data retention policy defined
- [ ] GDPR compliance reviewed
- [ ] Audit logging enabled
- [ ] Encryption at rest enabled

### Dependency Security
```bash
# Check for known vulnerabilities
# Backend
cd backend
mvn dependency-check:check

# Frontend
cd frontend
npm audit

# Fix vulnerabilities
npm audit fix
```

### Infrastructure Security
- [ ] Firewall configured
- [ ] VPN for database access
- [ ] DDoS protection enabled
- [ ] WAF rules configured
- [ ] Intrusion detection enabled

---

## 🔍 Security Testing Checklist

### Authentication Testing
```bash
# Test login
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test expired token
# Verify 401 response

# Test invalid token
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:8081/api/v1/products
# Should return 401
```

### Input Validation Testing
- [ ] Test SQL injection: `' OR '1'='1`
- [ ] Test XSS: `<script>alert('xss')</script>`
- [ ] Test CSRF tokens
- [ ] Test file upload restrictions
- [ ] Test numeric boundary conditions

### API Security Testing
- [ ] Test CORS headers
- [ ] Test rate limiting
- [ ] Test authentication required endpoints
- [ ] Test authorization (user can only access own data)
- [ ] Test error messages don't expose internals

---

## 📋 Deployment Security Checklist

Before deploying to production:

- [ ] JWT_SECRET changed and strong
- [ ] DB_PASSWORD is strong
- [ ] MAIL credentials configured
- [ ] REDIS_PASSWORD set
- [ ] HTTPS configured
- [ ] CORS origins properly set
- [ ] Environment variables in secure vault
- [ ] .env file never committed to git
- [ ] All logs configured and monitored
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Security monitoring enabled
- [ ] DDoS protection configured
- [ ] Web Application Firewall enabled
- [ ] Regular security updates scheduled

---

## 🚨 Incident Response

If security breach suspected:

1. **Immediate Actions**
   - Rotate JWT_SECRET immediately
   - Reset all user passwords
   - Revoke active sessions
   - Enable enhanced monitoring

2. **Investigation**
   - Review access logs
   - Check for unauthorized access
   - Review database changes
   - Check application logs

3. **Communication**
   - Notify affected users
   - Prepare incident report
   - Document lessons learned
   - Update procedures

4. **Prevention**
   - Implement security improvements
   - Add monitoring for similar issues
   - Conduct security training
   - Update security policies

---

## 📚 Security Resources

- OWASP Top 10: https://owasp.org/Top10/
- Spring Security: https://spring.io/projects/spring-security
- React Security: https://react.dev/learn/security
- PostgreSQL Security: https://www.postgresql.org/docs/current/sql-syntax.html#SQL-SYNTAX-LEXICAL-COMMENTS

---

## 🔄 Regular Security Maintenance

**Daily**:
- Monitor logs for suspicious activity
- Check alert notifications

**Weekly**:
- Review access logs
- Check for failed authentication attempts
- Verify backups completed

**Monthly**:
- Review user access permissions
- Update dependencies
- Security audit

**Quarterly**:
- Penetration testing
- Security assessment
- Policy review

**Annually**:
- Full security audit
- Compliance verification
- Disaster recovery test

---

Last updated: 2026-05-22
Maintained by: Security Team
Next review: 2026-08-22
