# k6 Load Testing Scripts

This directory contains k6 load testing scripts for the VENUE backend API.

## Available Tests

### Standard Load Tests

### 1. load-test.js
General purpose load test that simulates realistic user behavior:
- User login
- Fetching user profile
- Browsing events
- Viewing bookings

**Run:** `npm run k6:load`

### 2. booking-concurrency.js
Tests the booking system under high concurrency to verify:
- Race condition handling
- Transaction integrity
- Seat availability accuracy
- Database consistency

**Run:** `npm run k6:booking`

### 3. rate-limit-test.js
Validates rate limiting configuration:
- Verifies rate limits are enforced
- Tests endpoint protection
- Measures limit effectiveness

**Run:** `npm run k6:rate-limit`

### Load Balancer Tests

🆕 **Comprehensive load balancer testing suite** - See [LOAD_BALANCER_TESTING.md](./LOAD_BALANCER_TESTING.md) for detailed documentation.

| Test | Purpose | Run Command |
|------|---------|-------------|
| **load-balancer-health.js** | Health check distribution | `npm run k6:lb-health` |
| **load-balancer-distribution.js** | Request distribution analysis | `npm run k6:lb-distribution` |
| **load-balancer-session.js** | Session persistence validation | `npm run k6:lb-session` |
| **load-balancer-failover.js** | Failover behavior testing | `npm run k6:lb-failover` |
| **load-balancer-stress.js** | Comprehensive stress test | `npm run k6:lb-stress` |
| **load-balancer-websocket.js** | Real-time connection testing | `npm run k6:lb-websocket` |

**Quick Start:**
```bash
# Start load-balanced environment
docker-compose -f ../docker-compose.loadbalancer.yml up -d

# Run all load balancer tests
npm run k6:lb-all
```

See [LOAD_BALANCER_TESTING.md](./LOAD_BALANCER_TESTING.md) for complete setup instructions and documentation.

## Running Tests

**IMPORTANT:** Before running k6 tests, start the backend server with rate limiting disabled:

```bash
# Terminal 1: Start server in load test mode (disables rate limiting)
npm run dev:loadtest

# Terminal 2: Run k6 tests
npm run k6:load
```

> **Why disable rate limiting?** The default rate limits are designed for production use and will block k6 tests. The `dev:loadtest` mode sets `DISABLE_RATE_LIMIT=true` to allow high-volume testing without hitting rate limits.

### Basic Usage
```bash
k6 run load-test.js
```

### Custom Configuration
```bash
# Custom base URL
k6 run --env BASE_URL=http://localhost:5000 load-test.js

# Custom VUs and duration
k6 run --vus 50 --duration 60s load-test.js

# Output results to file
k6 run --out json=results.json load-test.js
```

### Using npm Scripts
```bash
npm run k6:load          # General load test
npm run k6:booking       # Booking concurrency test
npm run k6:rate-limit    # Rate limiting test
```

## Environment Variables

- `BASE_URL` - API base URL (default: http://localhost:5000)

Example:
```bash
k6 run --env BASE_URL=https://api.venue.com load-test.js
```

## Interpreting Results

Key metrics:
- **http_req_duration** - Response time (p95, p99)
- **http_req_failed** - Failed request rate
- **checks** - Assertion pass rate
- **iterations** - Total test iterations

### Good Performance Indicators
- p95 < 500ms
- p99 < 1000ms
- http_req_failed < 5%
- checks > 95%

### Warning Signs
- p95 > 1000ms - Response time too slow
- http_req_failed > 10% - Too many errors
- checks < 90% - Failing assertions

## Best Practices

1. **Start small** - Begin with low VUs, scale gradually
2. **Monitor system** - Watch CPU, memory, database
3. **Test incrementally** - Don't jump from 10 to 1000 VUs
4. **Set baselines** - Record performance before changes
5. **Test regularly** - Include in CI/CD pipeline

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run k6 Load Test
  run: |
    k6 run --out json=results.json k6/load-test.js
```

### Docker Example
```bash
docker run --rm -v $(pwd):/scripts grafana/k6 run /scripts/k6/load-test.js
```

## Custom Metrics

Our scripts include custom metrics:

### load-test.js
- `errors` - Total errors encountered

### booking-concurrency.js
- `successful_bookings` - Bookings created
- `failed_bookings` - Bookings rejected
- `race_conditions_handled` - Concurrent conflicts

### rate-limit-test.js
- `rate_limit_hits` - Times rate limited
- `successful_requests` - Requests passed

## Troubleshooting

### Connection Refused
- Ensure server is running: `npm run dev`
- Check BASE_URL is correct
- Verify firewall allows connections

### High Error Rate
- Check server logs for errors
- Verify database is running
- Check rate limiting configuration

### Slow Performance
- Check database query performance
- Review connection pool settings
- Monitor system resources

## Further Reading

- [k6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [k6 Cloud (SaaS option)](https://k6.io/cloud/)
