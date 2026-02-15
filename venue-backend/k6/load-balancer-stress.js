import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * COMPREHENSIVE LOAD BALANCER STRESS TEST
 * 
 * Purpose: Full-scale stress test simulating realistic production load patterns
 * across a load-balanced environment
 * 
 * This test combines:
 * - User authentication flows
 * - Read-heavy operations (browsing)
 * - Write operations (bookings)
 * - Mixed workload scenarios
 * - Spike testing
 * - Soak testing
 * - Peak load simulation
 */

// Custom metrics
const errorRate = new Rate('errors');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');
const successfulBookings = new Counter('successful_bookings');
const failedBookings = new Counter('failed_bookings');
const apiLatency = new Trend('api_latency');
const concurrentUsers = new Gauge('concurrent_users');
const throughput = new Counter('total_requests');

export const options = {
  scenarios: {
    // Scenario 1: Normal traffic pattern (read-heavy)
    normal_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Morning ramp-up
        { duration: '5m', target: 100 },  // Business hours
        { duration: '3m', target: 150 },  // Peak hours
        { duration: '5m', target: 150 },  // Sustained peak
        { duration: '2m', target: 50 },   // Evening reduction
      ],
      gracefulRampDown: '30s',
      exec: 'normalTraffic',
    },
    
    // Scenario 2: Spike test (sudden traffic surges)
    spike_traffic: {
      executor: 'ramping-vus',
      startTime: '5m',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },  // Sudden spike
        { duration: '1m', target: 200 },   // Hold spike
        { duration: '30s', target: 50 },   // Return to normal
      ],
      gracefulRampDown: '20s',
      exec: 'spikeTraffic',
    },
    
    // Scenario 3: Booking rush (write-heavy)
    booking_rush: {
      executor: 'ramping-arrival-rate',
      startTime: '3m',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '2m', target: 50 },   // Gradual increase
        { duration: '3m', target: 100 },  // High booking rate
        { duration: '2m', target: 20 },   // Cool down
      ],
      preAllocatedVUs: 100,
      maxVUs: 200,
      exec: 'bookingRush',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<700', 'p(99)<1500', 'avg<400'],
    http_req_failed: ['rate<0.05'], // Less than 5% failures
    errors: ['rate<0.08'],
    api_latency: ['p(95)<600', 'p(99)<1200'],
    successful_logins: ['count>1000'],
    'http_reqs{scenario:normal_traffic}': ['rate>50'],
    'http_reqs{scenario:spike_traffic}': ['rate>100'],
  },
  
  // Global options
  noConnectionReuse: false,
  userAgent: 'K6-LoadBalancer-StressTest/1.0',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// User pool for realistic simulation
const USER_POOL_SIZE = 50;
const userPool = [];

for (let i = 1; i <= USER_POOL_SIZE; i++) {
  userPool.push({
    email: `stresstest${i}@example.com`,
    password: 'StressTest123!',
    name: `Stress Test User ${i}`,
  });
}

export function setup() {
  console.log('=== Load Balancer Comprehensive Stress Test ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Registering ${USER_POOL_SIZE} test users...`);
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  let registered = 0;
  
  // Register all test users
  userPool.forEach(user => {
    const payload = JSON.stringify({
      name: user.name,
      email: user.email,
      password: user.password,
    });
    
    const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, params);
    
    if (res.status === 201 || res.status === 400) {
      registered++;
    }
  });
  
  console.log(`✓ ${registered}/${USER_POOL_SIZE} users ready`);
  console.log('\nStarting stress test scenarios...\n');
  
  return { users: userPool };
}

/**
 * SCENARIO 1: Normal Traffic (Read-Heavy)
 * Simulates typical user behavior: browsing, searching, viewing details
 */
export function normalTraffic(data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  
  group('Normal User Session', function() {
    // Login
    const token = performLogin(user);
    
    if (!token) {
      sleep(2);
      return;
    }
    
    const authParams = {
      headers: {
        'Cookie': `token=${token}`,
      },
    };
    
    // Browse events
    group('Browse Events', function() {
      const startTime = Date.now();
      const eventsRes = http.get(`${BASE_URL}/api/v1/events?page=1&limit=10`, authParams);
      apiLatency.add(Date.now() - startTime);
      throughput.add(1);
      
      check(eventsRes, {
        'events loaded': (r) => r.status === 200,
      });
      
      sleep(0.5);
      
      // View event details
      if (eventsRes.status === 200 && eventsRes.json('data.events.length') > 0) {
        const eventId = eventsRes.json('data.events.0._id');
        const detailStart = Date.now();
        const detailRes = http.get(`${BASE_URL}/api/v1/events/${eventId}`, authParams);
        apiLatency.add(Date.now() - detailStart);
        throughput.add(1);
        
        check(detailRes, {
          'event details loaded': (r) => r.status === 200,
        });
      }
    });
    
    sleep(1);
    
    // Browse movies
    group('Browse Movies', function() {
      const startTime = Date.now();
      const moviesRes = http.get(`${BASE_URL}/api/v1/movies?page=1&limit=10`, authParams);
      apiLatency.add(Date.now() - startTime);
      throughput.add(1);
      
      check(moviesRes, {
        'movies loaded': (r) => r.status === 200,
      });
    });
    
    sleep(1);
    
    // Check profile and bookings
    group('User Account', function() {
      const profileStart = Date.now();
      const profileRes = http.get(`${BASE_URL}/api/v1/users/me`, authParams);
      apiLatency.add(Date.now() - profileStart);
      throughput.add(1);
      
      check(profileRes, {
        'profile loaded': (r) => r.status === 200,
      });
      
      sleep(0.5);
      
      const bookingsStart = Date.now();
      const bookingsRes = http.get(`${BASE_URL}/api/v1/bookings/my-bookings`, authParams);
      apiLatency.add(Date.now() - bookingsStart);
      throughput.add(1);
      
      check(bookingsRes, {
        'bookings loaded': (r) => r.status === 200,
      });
    });
  });
  
  sleep(2);
}

/**
 * SCENARIO 2: Spike Traffic
 * Simulates sudden traffic surges (e.g., ticket sale announcement)
 */
export function spikeTraffic(data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  
  group('Spike Traffic Session', function() {
    const token = performLogin(user);
    
    if (!token) {
      return;
    }
    
    const authParams = {
      headers: {
        'Cookie': `token=${token}`,
      },
    };
    
    // Rapid requests to popular endpoints
    const endpoints = [
      '/api/v1/events',
      '/api/v1/movies',
      '/api/v1/events?featured=true',
      '/api/v1/movies?nowShowing=true',
    ];
    
    endpoints.forEach(endpoint => {
      const startTime = Date.now();
      const res = http.get(`${BASE_URL}${endpoint}`, authParams);
      apiLatency.add(Date.now() - startTime);
      throughput.add(1);
      
      check(res, {
        'spike request successful': (r) => r.status === 200,
      });
      
      sleep(0.1); // Minimal sleep for spike simulation
    });
  });
  
  sleep(0.5);
}

/**
 * SCENARIO 3: Booking Rush (Write-Heavy)
 * Simulates high-concurrency booking operations
 */
export function bookingRush(data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  
  group('Booking Rush Session', function() {
    const token = performLogin(user);
    
    if (!token) {
      failedBookings.add(1);
      return;
    }
    
    const authParams = {
      headers: {
        'Cookie': `token=${token}`,
      },
    };
    
    // Get available events
    const eventsRes = http.get(`${BASE_URL}/api/v1/events?status=upcoming&limit=5`, authParams);
    throughput.add(1);
    
    if (eventsRes.status === 200 && eventsRes.json('data.events.length') > 0) {
      const events = eventsRes.json('data.events');
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const eventId = randomEvent._id;
      
      // Attempt booking
      const bookingPayload = JSON.stringify({
        eventId: eventId,
        numberOfSeats: Math.floor(Math.random() * 3) + 1, // 1-3 seats
      });
      
      const bookingParams = {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `token=${token}`,
        },
      };
      
      const bookingStart = Date.now();
      const bookingRes = http.post(`${BASE_URL}/api/v1/bookings`, bookingPayload, bookingParams);
      apiLatency.add(Date.now() - bookingStart);
      throughput.add(1);
      
      const bookingSuccess = check(bookingRes, {
        'booking processed': (r) => r.status === 201 || r.status === 400 || r.status === 409,
        'booking response valid': (r) => r.body.length > 0,
      });
      
      if (bookingRes.status === 201) {
        successfulBookings.add(1);
      } else if (bookingRes.status === 400 || bookingRes.status === 409) {
        // Expected responses for sold out or invalid bookings
        failedBookings.add(1);
      } else {
        failedBookings.add(1);
        errorRate.add(1);
      }
    }
  });
  
  sleep(0.3);
}

/**
 * Helper function to perform login
 */
function performLogin(user) {
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const startTime = Date.now();
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, params);
  apiLatency.add(Date.now() - startTime);
  throughput.add(1);
  
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.cookies.token !== undefined,
  });
  
  if (loginSuccess) {
    successfulLogins.add(1);
    
    // Extract token
    const cookies = loginRes.cookies;
    for (let name in cookies) {
      if (name === 'token') {
        return cookies[name][0].value;
      }
    }
  } else {
    failedLogins.add(1);
    errorRate.add(1);
  }
  
  return null;
}

export function teardown(data) {
  console.log('\n=================================================');
  console.log('  LOAD BALANCER COMPREHENSIVE STRESS TEST COMPLETE');
  console.log('=================================================\n');
}

export function handleSummary(data) {
  return {
    'load-balancer-stress-report.html': htmlReport(data),
    'load-balancer-stress-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
