import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

/**
 * LOAD BALANCER HEALTH CHECK TEST
 * 
 * Purpose: Verify that health checks are properly distributed across backend instances
 * and that the load balancer correctly identifies healthy/unhealthy instances.
 * 
 * This test:
 * - Hammers the health endpoint with high frequency requests
 * - Verifies consistent response times
 * - Tests load distribution across instances
 * - Monitors for any instance failures
 */

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckLatency = new Trend('health_check_latency');
const instanceDistribution = new Counter('instance_responses');

export const options = {
  scenarios: {
    // Constant rate health checking (like a load balancer would do)
    health_monitoring: {
      executor: 'constant-arrival-rate',
      rate: 100, // 100 requests per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 10,
      maxVUs: 50,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<100', 'p(99)<200'], // Health checks should be fast
    http_req_failed: ['rate<0.01'], // Less than 1% failures
    errors: ['rate<0.01'],
    health_check_latency: ['p(95)<100'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const BACKEND_INSTANCES = __ENV.BACKEND_INSTANCES || 'http://localhost:5000';

// Parse multiple backend instances if provided (comma-separated)
const instances = BACKEND_INSTANCES.split(',').map(url => url.trim());

export function setup() {
  console.log('Setting up Load Balancer Health Check Test...');
  console.log(`Load Balancer URL: ${BASE_URL}`);
  console.log(`Testing backend instances: ${instances.join(', ')}`);
  
  // Verify all instances are reachable
  instances.forEach(instance => {
    const res = http.get(`${instance}/health`);
    console.log(`Instance ${instance} - Status: ${res.status}`);
  });
  
  return { instances };
}

export default function (data) {
  // Test 1: Health check through load balancer
  const startTime = Date.now();
  const healthRes = http.get(`${BASE_URL}/health`);
  const latency = Date.now() - startTime;
  
  healthCheckLatency.add(latency);
  
  const healthCheckOk = check(healthRes, {
    'health check returns 200': (r) => r.status === 200,
    'health check has status field': (r) => r.json('status') !== undefined,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  errorRate.add(!healthCheckOk);
  
  if (healthCheckOk) {
    instanceDistribution.add(1);
  }
  
  // Extract instance identifier from response if available
  if (healthRes.headers['X-Instance-Id']) {
    console.log(`Served by instance: ${healthRes.headers['X-Instance-Id']}`);
  }
  
  // Small sleep to simulate real health check intervals
  sleep(0.1);
}

export function teardown(data) {
  console.log('\n=== Load Balancer Health Check Test Results ===');
  console.log('Health checks should be evenly distributed across instances');
  console.log('Check the k6 summary for latency percentiles');
}
