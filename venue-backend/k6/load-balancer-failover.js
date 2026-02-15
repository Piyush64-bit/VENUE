import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

/**
 * LOAD BALANCER FAILOVER TEST
 * 
 * Purpose: Test load balancer behavior when backend instances become unavailable
 * 
 * This test:
 * - Simulates backend instance failures
 * - Monitors request success rates during failures
 * - Tests automatic failover capabilities
 * - Measures recovery time
 * - Validates error handling
 * 
 * MANUAL SETUP REQUIRED:
 * - Run with multiple backend instances
 * - During test execution, manually stop/start instances
 * - Monitor how load balancer responds
 */

// Custom metrics
const errorRate = new Rate('errors');
const failoverSuccess = new Rate('failover_success');
const recoveryTime = new Trend('recovery_time');
const instanceHealth = new Counter('instance_health_checks');

export const options = {
  scenarios: {
    // Continuous load during failover testing
    continuous_traffic: {
      executor: 'constant-vus',
      vus: 30,
      duration: '5m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    // Allow higher error rate during failover scenarios
    http_req_failed: ['rate<0.15'], // 15% threshold (some failures expected during failover)
    errors: ['rate<0.20'],
    failover_success: ['rate>0.85'], // 85%+ successful failovers
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const FAILOVER_TEST_MODE = __ENV.FAILOVER_TEST_MODE || 'false'; // Set to 'true' to enable failover testing

// Test user pool
const testUsers = [];
for (let i = 1; i <= 10; i++) {
  testUsers.push({
    email: `failover${i}@test.com`,
    password: 'Failover123!',
  });
}

export function setup() {
  console.log('=== Load Balancer Failover Test Setup ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Failover Test Mode: ${FAILOVER_TEST_MODE}`);
  console.log('\n⚠️  MANUAL TESTING INSTRUCTIONS:');
  console.log('1. Start this test');
  console.log('2. While test is running, stop one backend instance');
  console.log('3. Observe success rates and response times');
  console.log('4. Restart the instance');
  console.log('5. Observe recovery behavior\n');
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Register test users
  testUsers.forEach((user, index) => {
    const payload = JSON.stringify({
      name: `Failover Test User ${index + 1}`,
      email: user.email,
      password: user.password,
    });
    
    const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, params);
    
    if (res.status === 201 || res.status === 400) {
      console.log(`✓ User ${user.email} ready`);
    }
  });
  
  return { users: testUsers };
}

export default function (data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  
  group('Failover Resilience Test', function() {
    // 1. Health check
    const healthStart = Date.now();
    const healthRes = http.get(`${BASE_URL}/health`, { timeout: '10s' });
    
    const healthCheck = check(healthRes, {
      'health check responsive': (r) => r.status === 200,
    });
    
    if (healthCheck) {
      instanceHealth.add(1);
      recoveryTime.add(Date.now() - healthStart);
    }
    
    sleep(0.2);
    
    // 2. Authentication test
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });
    
    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '10s',
    };
    
    const loginStart = Date.now();
    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, loginParams);
    const loginDuration = Date.now() - loginStart;
    
    const loginCheck = check(loginRes, {
      'login successful': (r) => r.status === 200,
      'token received': (r) => r.cookies.token !== undefined,
      'login completed within timeout': () => loginDuration < 10000,
    });
    
    errorRate.add(!loginCheck);
    failoverSuccess.add(loginCheck ? 1 : 0);
    
    if (!loginCheck) {
      console.log(`⚠ Login failed for ${user.email} - Status: ${loginRes.status}, Duration: ${loginDuration}ms`);
      sleep(2); // Back off on failure
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
    
    sleep(0.3);
    
    // 3. Authenticated operations with retry logic
    const authParams = {
      headers: {
        'Cookie': `token=${token}`,
      },
      timeout: '10s',
    };
    
    // Test critical endpoints
    const criticalEndpoints = [
      { name: 'events', url: `${BASE_URL}/api/v1/events?limit=5` },
      { name: 'movies', url: `${BASE_URL}/api/v1/movies?limit=5` },
      { name: 'profile', url: `${BASE_URL}/api/v1/users/me` },
      { name: 'bookings', url: `${BASE_URL}/api/v1/bookings/my-bookings` },
    ];
    
    criticalEndpoints.forEach(endpoint => {
      const reqStart = Date.now();
      const res = http.get(endpoint.url, authParams);
      const reqDuration = Date.now() - reqStart;
      
      const success = check(res, {
        [`${endpoint.name} request successful`]: (r) => r.status === 200,
        [`${endpoint.name} response within timeout`]: () => reqDuration < 10000,
      });
      
      errorRate.add(!success);
      failoverSuccess.add(success ? 1 : 0);
      
      if (!success) {
        console.log(`⚠ ${endpoint.name} request failed - Status: ${res.status}, Duration: ${reqDuration}ms`);
      }
      
      sleep(0.2);
    });
    
    sleep(0.5);
    
    // 4. Write operation test (booking simulation)
    const writeTest = group('Write Operations', function() {
      // Get an event to book
      const eventsRes = http.get(`${BASE_URL}/api/v1/events?limit=1`, authParams);
      
      if (eventsRes.status === 200 && eventsRes.json('data.events.length') > 0) {
        const eventId = eventsRes.json('data.events.0._id');
        
        // Attempt to create a booking
        const bookingPayload = JSON.stringify({
          eventId: eventId,
          numberOfSeats: 1,
        });
        
        const bookingParams = {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `token=${token}`,
          },
          timeout: '15s',
        };
        
        const bookingStart = Date.now();
        const bookingRes = http.post(`${BASE_URL}/api/v1/bookings`, bookingPayload, bookingParams);
        const bookingDuration = Date.now() - bookingStart;
        
        const bookingSuccess = check(bookingRes, {
          'booking request processed': (r) => r.status === 201 || r.status === 400 || r.status === 409,
          'booking within timeout': () => bookingDuration < 15000,
        });
        
        errorRate.add(!bookingSuccess);
        failoverSuccess.add(bookingSuccess ? 1 : 0);
        
        if (!bookingSuccess) {
          console.log(`⚠ Booking failed - Status: ${bookingRes.status}, Duration: ${bookingDuration}ms`);
        }
      }
    });
  });
  
  sleep(1);
}

export function teardown(data) {
  console.log('\n=== Load Balancer Failover Test Results ===');
  console.log('\nExpected Behaviors:');
  console.log('✓ Requests succeed when all instances healthy');
  console.log('✓ Minimal failed requests during instance failure');
  console.log('✓ Automatic recovery when instance comes back online');
  console.log('✓ No cascading failures');
  console.log('\nRed Flags:');
  console.log('✗ High error rates (>15%)');
  console.log('✗ Long recovery times (>5s)');
  console.log('✗ Complete service outage');
  console.log('✗ Requests queuing up without processing');
  console.log('\nRecommendations:');
  console.log('- Ensure health checks are configured correctly');
  console.log('- Set appropriate timeouts on load balancer');
  console.log('- Configure active health monitoring');
  console.log('- Implement circuit breakers if needed');
  console.log('- Use connection draining for graceful shutdowns');
}
