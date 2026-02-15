# Load Balancer Testing - Quick Reference

## 🚀 Quick Start

```bash
# Linux/Mac
cd venue-backend/k6
chmod +x run-lb-tests.sh
./run-lb-tests.sh

# Windows (PowerShell)
cd venue-backend\k6
.\run-lb-tests.ps1
```

## 📝 Test Commands

| Test | Command | Duration | Purpose |
|------|---------|----------|---------|
| Health | `npm run k6:lb-health` | 2m | Verify health check distribution |
| Distribution | `npm run k6:lb-distribution` | 10m | Analyze request distribution |
| Session | `npm run k6:lb-session` | 8m | Validate session persistence |
| Failover | `npm run k6:lb-failover` | 5m | Test instance failure handling |
| Stress | `npm run k6:lb-stress` | 17m | Comprehensive load test |
| WebSocket | `npm run k6:lb-websocket` | 4m | Real-time connection test |
| All | `npm run k6:lb-all` | ~20m | Run health + distribution + session |

## 🐳 Docker Commands

```bash
# Start load balancer environment
docker-compose -f docker-compose.loadbalancer.yml up -d

# Scale backend instances
docker-compose -f docker-compose.loadbalancer.yml up -d --scale backend=5

# View logs
docker-compose -f docker-compose.loadbalancer.yml logs -f

# Stop one instance (for failover test)
docker stop venue-backend-2

# Restart instance
docker start venue-backend-2

# Stop everything
docker-compose -f docker-compose.loadbalancer.yml down
```

## 🎯 Environment Variables

```bash
# Set custom base URL
k6 run --env BASE_URL=http://localhost:8080 load-balancer-health.js

# Specify backend instances for monitoring
k6 run --env BACKEND_INSTANCES=http://b1:5000,http://b2:5000,http://b3:5000 load-balancer-health.js

# Enable failover test mode
k6 run --env FAILOVER_TEST_MODE=true load-balancer-failover.js
```

## 📊 Success Criteria

### Health Check Test
- ✅ p95 < 100ms
- ✅ p99 < 200ms
- ✅ Error rate < 1%

### Distribution Test
- ✅ Coefficient of variation < 20%
- ✅ Even load across instances
- ✅ Error rate < 5%

### Session Test
- ✅ Session consistency > 95%
- ✅ No auth failures
- ✅ p95 < 600ms

### Failover Test
- ✅ Error rate < 15% during failover
- ✅ Recovery time < 5s
- ✅ No cascading failures

### Stress Test
- ✅ p95 < 700ms
- ✅ p99 < 1500ms
- ✅ Error rate < 5%
- ✅ 1000+ successful logins

## 🔍 Monitoring

### Check Instance Health
```bash
# All healthy instances
docker ps --filter "health=healthy"

# Specific instance
docker inspect venue-backend-1 --format='{{.State.Health.Status}}'

# View instance logs
docker logs venue-backend-1 -f
```

### Check Load Balancer
```bash
# Test load balancer
curl http://localhost:8080/health

# Follow nginx logs
docker logs venue-load-balancer -f
```

### Monitor Resources
```bash
# Real-time stats
docker stats

# Specific container
docker stats venue-backend-1
```

## ⚠️ Troubleshooting

### High Error Rate
```bash
# Check backend logs
docker-compose -f docker-compose.loadbalancer.yml logs backend-1

# Verify rate limiting is disabled
docker exec venue-backend-1 env | grep DISABLE_RATE_LIMIT

# Check MongoDB connection
docker exec venue-backend-1 curl -f http://localhost:5000/health
```

### Poor Distribution
```bash
# Check nginx config
docker exec venue-load-balancer cat /etc/nginx/nginx.conf

# View nginx stats
docker exec venue-load-balancer nginx -T

# Restart load balancer
docker-compose -f docker-compose.loadbalancer.yml restart load-balancer
```

### Session Issues
```bash
# Test cookie persistence
curl -v -c cookies.txt http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test123!"}'

# Use cookie in subsequent request
curl -v -b cookies.txt http://localhost:8080/api/v1/users/me
```

## 📈 Output Files

After running tests, check these files:
- `load-balancer-distribution-report.html` - Distribution analysis
- `load-balancer-stress-report.html` - Stress test report
- `load-balancer-stress-summary.json` - Detailed metrics

## 🔗 Resources

- [Full Documentation](./LOAD_BALANCER_TESTING.md)
- [k6 Documentation](https://k6.io/docs/)
- [Nginx Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)

## 💡 Tips

1. **Start with health test** - Verify basic connectivity
2. **Run distribution test** - Ensure even load balancing
3. **Test session persistence** - Critical for stateful apps
4. **Simulate failures** - Use failover test
5. **Full stress test** - Comprehensive validation

## 🎪 Common Scenarios

### Testing New Load Balancer Config
```bash
# 1. Update nginx-lb.conf
# 2. Restart load balancer
docker-compose -f docker-compose.loadbalancer.yml restart load-balancer

# 3. Run health test
npm run k6:lb-health

# 4. Run distribution test
npm run k6:lb-distribution
```

### Testing Instance Scaling
```bash
# Scale to 5 instances
docker-compose -f docker-compose.loadbalancer.yml up -d --scale backend=5

# Wait for health checks
sleep 20

# Run distribution test
npm run k6:lb-distribution
```

### Testing Failover
```bash
# Terminal 1: Start failover test
npm run k6:lb-failover

# Terminal 2: Stop instance after 1 minute
sleep 60 && docker stop venue-backend-2

# Terminal 3: Restart after 30 seconds
sleep 30 && docker start venue-backend-2
```

### Pre-Production Validation
```bash
# Run complete test suite
npm run k6:lb-health
npm run k6:lb-distribution
npm run k6:lb-session
npm run k6:lb-stress

# Review all HTML reports
```
