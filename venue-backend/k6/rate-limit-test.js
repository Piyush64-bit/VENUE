import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

// Custom metrics
const rateLimitHits = new Counter('rate_limit_hits');
const successfulRequests = new Counter('successful_requests');

// Test configuration - intentionally hit rate limits
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Start slow
    { duration: '20s', target: 50 },  // Ramp up quickly
    { duration: '30s', target: 100 }, // Spike to test rate limits
    { duration: '20s', target: 50 },  // Back down
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    rate_limit_hits: ['count>0'], // We expect to hit rate limits
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export function setup() {
  console.log('Setting up rate limit test...');
  console.log(`Testing against: ${BASE_URL}`);

  // Create a test user
  const payload = JSON.stringify({
    name: 'Rate Limit Test User',
    email: 'ratelimit@example.com',
    password: 'RateLimit123!',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  http.post(`${BASE_URL}/api/v1/auth/register`, payload, params);

  return { 
    email: 'ratelimit@example.com',
    password: 'RateLimit123!',
  };
}

export default function (data) {
  // Rapid-fire requests to test rate limiting

  // 1. Health check (should not be rate limited)
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check successful': (r) => r.status === 200,
  });

  // 2. Multiple login attempts (rate limited endpoint)
  for (let i = 0; i < 5; i++) {
    const loginPayload = JSON.stringify({
      email: data.email,
      password: data.password,
    });

    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, loginParams);

    const checks = check(loginRes, {
      'request processed': (r) => r.status === 200 || r.status === 429,
      'rate limited': (r) => r.status === 429,
      'successful request': (r) => r.status === 200,
    });

    if (loginRes.status === 429) {
      rateLimitHits.add(1);
      console.log(`Rate limit hit on attempt ${i + 1}`);
    } else if (loginRes.status === 200) {
      successfulRequests.add(1);
    }

    sleep(0.1); // Small delay between requests
  }

  sleep(1);

  // 3. Rapid event listing requests
  for (let i = 0; i < 10; i++) {
    const eventsRes = http.get(`${BASE_URL}/api/v1/events`);

    check(eventsRes, {
      'events request processed': (r) => r.status === 200 || r.status === 429,
    });

    if (eventsRes.status === 429) {
      rateLimitHits.add(1);
    } else if (eventsRes.status === 200) {
      successfulRequests.add(1);
    }

    sleep(0.05); // Very small delay to stress test
  }

  sleep(2);
}

export function teardown(data) {
  console.log('Rate limit test completed!');
  console.log('Check rate_limit_hits vs successful_requests metrics');
}
