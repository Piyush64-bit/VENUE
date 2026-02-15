import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * LOAD BALANCER DISTRIBUTION TEST
 * 
 * Purpose: Verify that requests are evenly distributed across backend instances
 * 
 * This test:
 * - Sends requests to various endpoints
 * - Tracks which backend instance handles each request
 * - Calculates distribution metrics
 * - Verifies fair load distribution
 */

// Custom metrics
const errorRate = new Rate('errors');
const requestLatency = new Trend('request_latency');
const instanceCounter = {};

export const options = {
  scenarios: {
    // Mixed load scenario with multiple endpoint types
    mixed_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },  // Ramp up to 50 VUs
        { duration: '3m', target: 100 }, // Ramp up to 100 VUs
        { duration: '2m', target: 100 }, // Sustain 100 VUs
        { duration: '1m', target: 150 }, // Spike to 150 VUs
        { duration: '1m', target: 50 },  // Scale down
        { duration: '1m', target: 0 },   // Ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.1'],
    request_latency: ['avg<300', 'p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Test endpoints to hit
const endpoints = [
  { path: '/health', method: 'GET', weight: 10 },
  { path: '/api/v1/events', method: 'GET', weight: 30 },
  { path: '/api/v1/movies', method: 'GET', weight: 20 },
  { path: '/api/v1/slots', method: 'GET', weight: 15 },
];

// Test user data
const testUsers = [
  { email: 'loadbalancer1@test.com', password: 'LoadTest123!' },
  { email: 'loadbalancer2@test.com', password: 'LoadTest123!' },
  { email: 'loadbalancer3@test.com', password: 'LoadTest123!' },
  { email: 'loadbalancer4@test.com', password: 'LoadTest123!' },
  { email: 'loadbalancer5@test.com', password: 'LoadTest123!' },
];

export function setup() {
  console.log('=== Load Balancer Distribution Test Setup ===');
  console.log(`Base URL: ${BASE_URL}`);
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Register test users
  testUsers.forEach((user, index) => {
    const payload = JSON.stringify({
      name: `Load Balancer Test User ${index + 1}`,
      email: user.email,
      password: user.password,
    });
    
    const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, params);
    
    if (res.status === 201) {
      console.log(`✓ User ${user.email} registered`);
    } else if (res.status === 400) {
      console.log(`✓ User ${user.email} already exists`);
    } else {
      console.log(`✗ Failed to register ${user.email}: ${res.status}`);
    }
  });
  
  return { users: testUsers };
}

export default function (data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  
  // 1. Login to get session
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const startTime = Date.now();
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, loginParams);
  requestLatency.add(Date.now() - startTime);
  
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.cookies.token !== undefined,
  });
  
  errorRate.add(!loginSuccess);
  
  // Track instance that handled the request
  if (loginRes.headers['X-Instance-Id']) {
    const instanceId = loginRes.headers['X-Instance-Id'];
    if (!instanceCounter[instanceId]) {
      instanceCounter[instanceId] = 0;
    }
    instanceCounter[instanceId]++;
  }
  
  if (!loginSuccess) {
    sleep(1);
    return;
  }
  
  // Extract token
  let token = '';
  const cookies = loginRes.cookies;
  for (let name in cookies) {
    if (name === 'token') {
      token = cookies[name][0].value;
      break;
    }
  }
  
  // 2. Make requests to various endpoints
  const numRequests = Math.floor(Math.random() * 5) + 3; // 3-7 requests
  
  for (let i = 0; i < numRequests; i++) {
    // Select endpoint based on weight
    const endpoint = selectEndpoint();
    
    const reqParams = {
      headers: {
        'Cookie': `token=${token}`,
      },
    };
    
    const reqStartTime = Date.now();
    const res = http.get(`${BASE_URL}${endpoint.path}`, reqParams);
    requestLatency.add(Date.now() - reqStartTime);
    
    const success = check(res, {
      'request successful': (r) => r.status >= 200 && r.status < 300,
    });
    
    errorRate.add(!success);
    
    // Track instance distribution
    if (res.headers['X-Instance-Id']) {
      const instanceId = res.headers['X-Instance-Id'];
      if (!instanceCounter[instanceId]) {
        instanceCounter[instanceId] = 0;
      }
      instanceCounter[instanceId]++;
    }
    
    sleep(0.5);
  }
  
  sleep(1);
}

function selectEndpoint() {
  const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  
  return endpoints[0];
}

export function teardown(data) {
  console.log('\n=== Load Balancer Distribution Results ===');
  console.log('Instance Request Distribution:');
  
  const totalRequests = Object.values(instanceCounter).reduce((sum, count) => sum + count, 0);
  
  for (const [instanceId, count] of Object.entries(instanceCounter)) {
    const percentage = ((count / totalRequests) * 100).toFixed(2);
    console.log(`  Instance ${instanceId}: ${count} requests (${percentage}%)`);
  }
  
  // Calculate distribution variance
  const instances = Object.keys(instanceCounter);
  if (instances.length > 1) {
    const avgRequestsPerInstance = totalRequests / instances.length;
    const variance = Object.values(instanceCounter).reduce((sum, count) => {
      return sum + Math.pow(count - avgRequestsPerInstance, 2);
    }, 0) / instances.length;
    
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avgRequestsPerInstance) * 100;
    
    console.log(`\nDistribution Statistics:`);
    console.log(`  Average per instance: ${avgRequestsPerInstance.toFixed(2)}`);
    console.log(`  Standard deviation: ${stdDev.toFixed(2)}`);
    console.log(`  Coefficient of variation: ${coefficientOfVariation.toFixed(2)}%`);
    
    if (coefficientOfVariation < 10) {
      console.log('  ✓ Excellent load distribution');
    } else if (coefficientOfVariation < 20) {
      console.log('  ✓ Good load distribution');
    } else if (coefficientOfVariation < 30) {
      console.log('  ⚠ Fair load distribution');
    } else {
      console.log('  ✗ Poor load distribution - investigate load balancer config');
    }
  } else {
    console.log('\n⚠ Only one instance detected - load balancing test inconclusive');
  }
}

export function handleSummary(data) {
  return {
    'load-balancer-distribution-report.html': htmlReport(data),
  };
}
