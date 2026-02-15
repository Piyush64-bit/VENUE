# Security Policy

## Security Features

### Authentication & Authorization
- JWT-based authentication with HttpOnly cookies
- Role-based access control (User, Organizer, Admin)
- Password hashing using Argon2 (OWASP recommended)

### Input Validation & Protection
- Zod schemas for request validation
- express-mongo-sanitize prevents NoSQL injection
- sanitize-html for user content
- Helmet.js security headers (CSP, X-Frame-Options)

### Rate Limiting
Multi-tier protection using Redis:
- Global: 1000 req/hour per IP
- Auth endpoints: 5 attempts/15min
- Authenticated users: 100 req/15min
- Booking endpoints: 10 req/min

### Database Security
- MongoDB transactions for ACID compliance
- Atomic operations prevent race conditions
- Environment-based connection strings
- Mongoose prepared statements

### API Security
- CORS with explicit origin whitelisting
- Request ID tracking for audit trails
- Structured logging (Winston) with rotation
- No sensitive data in logs

### File Upload
- Cloudinary integration for secure storage
- File type validation (images only)
- Size limits (5MB max)

## Reporting Vulnerabilities

This is a portfolio project. Security issues are welcome as learning opportunities:

1. Open a GitHub Issue with "security" label
2. Provide:
   - Steps to reproduce
   - Expected vs actual behavior
   - Impact assessment
3. Response time: 48-72 hours

## Security Testing

```bash
# Audit dependencies
cd venue-backend && npm audit
cd venue-frontend && npm audit

# Fix non-breaking issues
npm audit fix
```

## CI/CD Security

### Automated Security Pipeline

Every code push triggers comprehensive security validation:

#### 1. Dependency Scanning
```bash
# Automated in CI pipeline
npm audit --audit-level=moderate
```
- **Backend**: Scans 60+ production dependencies
- **Frontend**: Scans React + Vite ecosystem
- **Threshold**: Moderate+ vulnerabilities flagged
- **Action**: JSON reports uploaded as CI artifacts
- **Notification**: PR comments with vulnerability counts

#### 2. Container Security (Trivy)
- **Scan Target**: Docker images (backend + frontend)
- **Severity Levels**: CRITICAL and HIGH
- **Output**: SARIF format for GitHub Security integration
- **CVE Database**: Updated vulnerability definitions
- **Verdict**: Non-blocking (logs findings, doesn't fail build)

#### 3. Code Quality Analysis
- **Static Analysis**: ESLint with security rules
- **Format Validation**: Prettier consistency checks
- **Future**: CodeQL planned for advanced analysis

#### 4. Secrets Detection
- **Prevention**: `.gitignore` blocks `.env` files
- **Validation**: CI checks for hardcoded secrets
- **Best Practice**: GitHub Secrets for sensitive values

### Test Environment Security

#### Isolation Guarantees
- **Database**: Mandatory `*_test` suffix validation
- **Redis**: Separate namespace (`test:*`)
- **Rate Limiting**: Disabled in test (prevents false negatives)
- **Transactions**: Optional in test (standalone MongoDB support)

#### Safety Checks
```javascript
// Enforced in tests/setup.js
if (!process.env.MONGO_URI || !process.env.MONGO_URI.includes('test')) {
  throw new Error('MONGO_URI must contain "test" for safety');
}
```

### Load Testing Security

**k6 Scripts Validate**:
- Rate limiter effectiveness under load
- Authentication bypass attempts
- Race condition exploitation
- Transaction rollback integrity
- Session fixation vulnerabilities

**Commands**:
```bash
npm run k6:rate-limit  # Validates multi-tier rate limiting
npm run k6:booking     # Tests booking race conditions
```

### Continuous Monitoring

#### Metrics Tracked:
- Failed authentication attempts
- Rate limit triggers per IP
- Booking transaction rollbacks
- Unauthorized access attempts
- Input validation failures

#### Logging + Alerting:
- Winston structured logs with request IDs
- Error-level logs for security events
- Production: JSON format → Log aggregation (ELK, CloudWatch)
- Development: Pretty-printed with color coding

### Security in Production

**Required Environment Variables**:
```bash
# Strong JWT secret (32+ chars)
JWT_SECRET=<cryptographically-random-string>

# Explicit CORS origins (no wildcards)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Secure Redis connection
REDIS_URL=rediss://user:pass@redis-host:6380/0  # Note: rediss (TLS)

# Database with auth
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/venue?retryWrites=true
```

**Deployment Checklist**:
- ✅ Enable rate limiting (`DISABLE_RATE_LIMIT` unset)
- ✅ Use HTTPS-only (enforce with Helmet middleware)
- ✅ Set `NODE_ENV=production`
- ✅ Enable MongoDB transactions (replica set)
- ✅ Configure Redis persistence (AOF + RDB)
- ✅ Set secure cookie flags (`httpOnly`, `secure`, `sameSite`)
- ✅ Implement log rotation (Winston transports)
- ✅ Set up SSL termination at load balancer

## Known Limitations

This is a demonstration project. Production systems should add:
- API Gateway with WAF (AWS WAF, Cloudflare)
- Secrets management (Vault, AWS Secrets Manager, Google KMS)
- Database encryption at rest (MongoDB encryption)
- SSL/TLS certificate pinning (mobile clients)
- Regular penetration testing (OWASP ZAP, Burp Suite)
- Multi-factor authentication (2FA via TOTP/SMS)
- DDoS protection beyond rate limiting (Cloudflare, AWS Shield)
- API key rotation policies
- Audit logging to immutable storage

## Supported Versions

| Version | Supported | Security Updates |
|---------|-----------|------------------|
| 1.x.x   | ✅ Yes    | Active           |
| 0.x.x   | ❌ No     | EOL              |

## Dependencies

Dependencies are monitored for known vulnerabilities. Critical/High severity issues are patched within 7 days of disclosure.

**Audit Commands**:
```bash
# Backend dependency audit
cd venue-backend && npm audit

# Frontend dependency audit
cd venue-frontend && npm audit

# Check for known vulnerabilities (optional)
npm install -g snyk
snyk test
```
