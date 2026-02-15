# Load Balancer Testing Suite

Comprehensive load balancer testing suite for the VENUE application using k6. These tests validate load balancing, failover, session persistence, and distribution across multiple backend instances.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Files](#test-files)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running Tests](#running-tests)
- [Understanding Results](#understanding-results)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This suite includes specialized tests for load balancer validation:

| Test | Purpose | Duration | VUs |
|------|---------|----------|-----|
| **load-balancer-health.js** | Health check distribution | 2m | 10-50 |
| **load-balancer-distribution.js** | Request distribution across instances | 10m | 50-150 |
| **load-balancer-session.js** | Session persistence validation | 8m | 20-80 |
| **load-balancer-failover.js** | Failover behavior testing | 5m | 30 |
| **load-balancer-stress.js** | Comprehensive stress testing | 17m | 50-200 |
| **load-balancer-websocket.js** | WebSocket/real-time connection testing | 4m | 20-50 |

## 📦 Test Files

### 1. load-balancer-health.js
Tests health check endpoints and load balancer monitoring.

**Scenarios:**
- Constant rate health checking (100 req/s)
- Validates response times
- Monitors instance availability

**Run:** `npm run k6:lb-health`

### 2. load-balancer-distribution.js
Validates even distribution of requests across backend instances.

**Scenarios:**
- Mixed endpoint requests
- Request distribution tracking
- Statistical analysis of distribution

**Key Metrics:**
- Instance request counts
- Distribution variance
- Coefficient of variation

**Run:** `npm run k6:lb-distribution`

### 3. load-balancer-session.js
Tests session persistence across load-balanced requests.

**Scenarios:**
- User registration and login
- Multiple authenticated operations
- Session consistency validation
- Cookie/token persistence

**Run:** `npm run k6:lb-session`

### 4. load-balancer-failover.js
Tests load balancer behavior during backend failures.

**Manual Testing Required:**
1. Start the test
2. Stop one backend instance during execution
3. Observe failover behavior
4. Restart the instance
5. Observe recovery

**Run:** `npm run k6:lb-failover`

### 5. load-balancer-stress.js
Comprehensive stress test with multiple scenarios.

**Scenarios:**
- Normal traffic (read-heavy)
- Spike traffic (sudden surges)
- Booking rush (write-heavy)

**Run:** `npm run k6:lb-stress`

### 6. load-balancer-websocket.js
Tests real-time connection handling through load balancer.

**Run:** `npm run k6:lb-websocket`

## ⚙️ Prerequisites

### 1. Install k6

**Windows:**
```powershell
choco install k6
# or
winget install k6
```

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 2. Set Up Load Balancer Environment

You need multiple backend instances for proper load balancer testing.

**Option A: Docker Compose (Recommended)**

Use the provided `docker-compose.loadbalancer.yml`:

```bash
# Start 3 backend instances + nginx load balancer
docker-compose -f docker-compose.loadbalancer.yml up -d

# Scale backend instances
docker-compose -f docker-compose.loadbalancer.yml up -d --scale backend=5
```

**Option B: Manual Setup**

Run multiple backend instances on different ports:

```bash
# Terminal 1
PORT=5001 DISABLE_RATE_LIMIT=true npm start

# Terminal 2
PORT=5002 DISABLE_RATE_LIMIT=true npm start

# Terminal 3
PORT=5003 DISABLE_RATE_LIMIT=true npm start
```

Then configure your load balancer (nginx, haproxy, etc.) to distribute across these instances.

## 🚀 Running Tests

### Quick Start

```bash
# Install dependencies
npm install

# Start load-balanced environment
docker-compose -f docker-compose.loadbalancer.yml up -d

# Wait for services to be healthy
sleep 10

# Run all load balancer tests
npm run k6:lb-all
```

### Individual Tests

```bash
# Health check distribution
npm run k6:lb-health

# Request distribution analysis
npm run k6:lb-distribution

# Session persistence
npm run k6:lb-session

# Failover testing (manual intervention required)
npm run k6:lb-failover

# Comprehensive stress test
npm run k6:lb-stress

# WebSocket/real-time testing
npm run k6:lb-websocket
```

### Custom Configuration

```bash
# Custom base URL
k6 run --env BASE_URL=http://load-balancer:8080 load-balancer-distribution.js

# Specify backend instances for monitoring
k6 run --env BACKEND_INSTANCES=http://backend1:5000,http://backend2:5000,http://backend3:5000 load-balancer-health.js

# Adjust load levels
k6 run --vus 100 --duration 5m load-balancer-stress.js

# Output to JSON for analysis
k6 run --out json=results.json load-balancer-distribution.js

# Multiple outputs
k6 run --out json=results.json --out influxdb=http://localhost:8086/k6 load-balancer-stress.js
```

## 📊 Understanding Results

### Key Metrics

**Request Metrics:**
- `http_req_duration` - Response time (p50, p95, p99)
- `http_req_failed` - Failed request percentage
- `http_reqs` - Total requests per second

**Custom Metrics:**
- `errors` - Application error rate
- `session_consistency` - Session persistence rate
- `failover_success` - Successful failover rate
- `instance_responses` - Requests per instance

### Success Criteria

#### Health Check Test
✅ p95 < 100ms  
✅ p99 < 200ms  
✅ Error rate < 1%

#### Distribution Test
✅ Even distribution across instances  
✅ Coefficient of variation < 20%  
✅ Error rate < 5%

#### Session Test
✅ Session consistency > 95%  
✅ No authentication failures  
✅ Cookie persistence works

#### Failover Test
✅ Error rate < 15% during failover  
✅ Quick recovery (< 5s)  
✅ No cascading failures

#### Stress Test
✅ p95 < 700ms  
✅ p99 < 1500ms  
✅ Error rate < 5%  
✅ Successful logins > 1000

### Interpreting Distribution Results

The distribution test provides detailed statistics:

```
Instance Request Distribution:
  Instance backend-1: 3421 requests (33.2%)
  Instance backend-2: 3398 requests (33.0%)
  Instance backend-3: 3481 requests (33.8%)

Distribution Statistics:
  Average per instance: 3433.33
  Standard deviation: 42.18
  Coefficient of variation: 1.23%
  ✓ Excellent load distribution
```

**Coefficient of Variation:**
- < 10% = Excellent distribution
- 10-20% = Good distribution
- 20-30% = Fair distribution
- > 30% = Poor distribution (investigate)

## 🎯 Best Practices

### 1. Test Environment Setup

- **Use realistic data volumes** - Pre-populate database with test data
- **Disable rate limiting** - Set `DISABLE_RATE_LIMIT=true` for load testing
- **Monitor resources** - Watch CPU, memory, network during tests
- **Isolate test environment** - Don't run on production

### 2. Load Balancer Configuration

**Nginx Example:**
```nginx
upstream backend {
    least_conn;  # or ip_hash for sticky sessions
    server backend1:5000 max_fails=3 fail_timeout=30s;
    server backend2:5000 max_fails=3 fail_timeout=30s;
    server backend3:5000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        
        # For session persistence
        proxy_cookie_path / "/; SameSite=Lax";
    }
}
```

**HAProxy Example:**
```haproxy
backend venue_backend
    balance roundrobin
    option httpchk GET /health
    server backend1 backend1:5000 check inter 5s rise 2 fall 3
    server backend2 backend2:5000 check inter 5s rise 2 fall 3
    server backend3 backend3:5000 check inter 5s rise 2 fall 3
```

### 3. Progressive Testing

1. **Start small** - Begin with health checks
2. **Add load gradually** - Use distribution test
3. **Test persistence** - Run session test
4. **Simulate failures** - Execute failover test
5. **Full stress** - Run comprehensive test

### 4. Monitoring During Tests

Monitor these metrics:

- **Load Balancer:**
  - Connection count
  - Request distribution
  - Response times
  - Error rates

- **Backend Instances:**
  - CPU usage
  - Memory consumption
  - Active connections
  - Database connections

- **Database:**
  - Query performance
  - Connection pool
  - Lock contention

### 5. Test Data Management

```bash
# Clean test data between runs
mongo venue --eval "db.users.deleteMany({email: /test@example.com/})"
mongo venue --eval "db.bookings.deleteMany({testData: true})"

# Or reset entire test database
mongo venue --eval "db.dropDatabase()"
```

## 🔧 Troubleshooting

### High Error Rates

**Symptoms:** Error rate > 10%

**Causes:**
- Rate limiting enabled
- Backend instances overloaded
- Database connection exhaustion
- Network issues

**Solutions:**
```bash
# Check backend logs
docker-compose logs backend

# Verify rate limiting is disabled
grep DISABLE_RATE_LIMIT .env

# Check database connections
mongo venue --eval "db.serverStatus().connections"

# Monitor system resources
docker stats
```

### Poor Load Distribution

**Symptoms:** Coefficient of variation > 30%

**Causes:**
- Incorrect load balancer algorithm
- Sticky sessions when not needed
- Instance health check failures
- Connection reuse issues

**Solutions:**
- Review load balancer configuration
- Verify health check endpoint
- Check instance logs for errors
- Adjust balancing algorithm

### Session Consistency Failures

**Symptoms:** Session consistency < 95%

**Causes:**
- Missing sticky sessions configuration
- Cookie domain/path mismatch
- JWT not properly shared
- Session storage not distributed

**Solutions:**
```nginx
# Enable sticky sessions in nginx
upstream backend {
    ip_hash;  # Sticky sessions
    server backend1:5000;
    server backend2:5000;
}

# Or use shared session store
# Configure Redis for session storage
```

### Slow Response Times

**Symptoms:** p95 > 1000ms

**Causes:**
- Backend instances undersized
- Database query optimization needed
- Connection pool too small
- Network latency

**Solutions:**
- Scale up backend resources
- Optimize database queries
- Increase connection pool size
- Review network configuration

### Failover Test Issues

**Symptoms:** Service completely unavailable during instance failure

**Causes:**
- Health checks not configured
- Fail timeout too long
- No graceful shutdown
- Circuit breaker not implemented

**Solutions:**
- Configure active health checks
- Adjust fail_timeout and max_fails
- Implement graceful shutdown in app
- Add circuit breaker pattern

## 📈 Advanced Usage

### Continuous Load Testing

Set up automated load testing in CI/CD:

```yaml
# .github/workflows/load-test.yml
name: Load Test

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start services
        run: docker-compose -f docker-compose.loadbalancer.yml up -d
      - name: Run load tests
        run: |
          npm run k6:lb-distribution
          npm run k6:lb-session
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: '*.html'
```

### Monitoring Integration

Export results to monitoring systems:

```bash
# InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 load-balancer-stress.js

# Prometheus
k6 run --out prometheus load-balancer-stress.js

# Grafana Cloud
k6 run --out cloud load-balancer-stress.js
```

### Custom Scenarios

Create custom test scenarios:

```javascript
export const options = {
  scenarios: {
    custom_scenario: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '1m', target: 0 },
      ],
    },
  },
};
```

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [Load Balancing Strategies](https://www.nginx.com/blog/nginx-load-balancing-strategy/)
- [HAProxy Best Practices](https://www.haproxy.com/documentation/hapee/latest/load-balancing/health-checking/best-practices/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)

## 🤝 Contributing

When adding new load balancer tests:

1. Follow the existing test structure
2. Add comprehensive comments
3. Include success criteria
4. Update this README
5. Add npm scripts to package.json

## 📝 License

Part of the VENUE project. See LICENSE file for details.
