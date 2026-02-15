import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

/**
 * LOAD BALANCER SESSION PERSISTENCE TEST
 * 
 * Purpose: Verify that user sessions are maintained correctly across requests
 * when using a load balancer (tests sticky sessions if configured)
 * 
 * This test:
 * - Creates user sessions via login
 * - Makes multiple authenticated requests
 * - Verifies session consistency
 * - Tests cookie/token persistence
 * - Validates session-based operations
 */

// Custom metrics
const errorRate = new Rate('errors');
const sessionConsistency = new Rate('session_consistency');
const authFailures = new Counter('auth_failures');
const sessionLatency = new Trend('session_latency');

export const options = {
  scenarios: {
    // Scenario 1: Session creation and validation
    session_persistence: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },  // Gradual ramp
        { duration: '2m', target: 50 },   // Increased concurrent sessions
        { duration: '3m', target: 80 },   // High session load
        { duration: '2m', target: 80 },   // Sustain
        { duration: '30s', target: 0 },   // Ramp down
      ],
      gracefulRampDown: '20s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.1'],
    session_consistency: ['rate>0.95'], // 95%+ session consistency
    session_latency: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Generate unique test users for each VU
function generateUser(vuId) {
  return {
    email: `session-test-${vuId}-${Date.now()}@example.com`,
    password: 'SessionTest123!',
    name: `Session Test User ${vuId}`,
  };
}

export default function () {
  const vuId = __VU;
  const user = generateUser(vuId);
  
  group('Session Creation', function() {
    // 1. Register new user
    const registerPayload = JSON.stringify({
      name: user.name,
      email: user.email,
      password: user.password,
    });
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const registerRes = http.post(`${BASE_URL}/api/v1/auth/register`, registerPayload, params);
    
    const registerSuccess = check(registerRes, {
      'registration successful': (r) => r.status === 201,
      'user data returned': (r) => r.json('data.user') !== undefined,
    });
    
    if (!registerSuccess) {
      errorRate.add(1);
      return;
    }
    
    sleep(0.5);
    
    // 2. Login to create session
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });
    
    const startTime = Date.now();
    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, params);
    sessionLatency.add(Date.now() - startTime);
    
    const loginSuccess = check(loginRes, {
      'login successful': (r) => r.status === 200,
      'token cookie set': (r) => r.cookies.token !== undefined,
      'user data returned': (r) => r.json('data.user') !== undefined,
    });
    
    errorRate.add(!loginSuccess);
    
    if (!loginSuccess) {
      authFailures.add(1);
      return;
    }
    
    // Extract session token
    let token = '';
    const cookies = loginRes.cookies;
    for (let name in cookies) {
      if (name === 'token') {
        token = cookies[name][0].value;
        break;
      }
    }
    
    const userId = loginRes.json('data.user._id');
    
    sleep(0.5);
    
    group('Session Validation', function() {
      // 3. Test session with multiple authenticated requests
      const authParams = {
        headers: {
          'Cookie': `token=${token}`,
        },
      };
      
      // Request 1: Get user profile
      const profileRes = http.get(`${BASE_URL}/api/v1/users/me`, authParams);
      
      const profileCheck = check(profileRes, {
        'profile request successful': (r) => r.status === 200,
        'correct user returned': (r) => r.json('data.user._id') === userId,
      });
      
      sessionConsistency.add(profileCheck ? 1 : 0);
      errorRate.add(!profileCheck);
      
      sleep(0.3);
      
      // Request 2: Get user bookings
      const bookingsRes = http.get(`${BASE_URL}/api/v1/bookings/my-bookings`, authParams);
      
      const bookingsCheck = check(bookingsRes, {
        'bookings request successful': (r) => r.status === 200,
        'bookings data returned': (r) => r.json('data') !== undefined,
      });
      
      sessionConsistency.add(bookingsCheck ? 1 : 0);
      errorRate.add(!bookingsCheck);
      
      sleep(0.3);
      
      // Request 3: Browse events (authenticated)
      const eventsRes = http.get(`${BASE_URL}/api/v1/events?page=1&limit=10`, authParams);
      
      const eventsCheck = check(eventsRes, {
        'events request successful': (r) => r.status === 200,
        'events data returned': (r) => r.json('data.events') !== undefined,
      });
      
      sessionConsistency.add(eventsCheck ? 1 : 0);
      errorRate.add(!eventsCheck);
      
      sleep(0.3);
      
      // Request 4: Update profile
      const updatePayload = JSON.stringify({
        name: `${user.name} Updated`,
      });
      
      const updateParams = {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `token=${token}`,
        },
      };
      
      const updateRes = http.patch(`${BASE_URL}/api/v1/users/me`, updatePayload, updateParams);
      
      const updateCheck = check(updateRes, {
        'profile update successful': (r) => r.status === 200,
        'updated data returned': (r) => r.json('data.user') !== undefined,
      });
      
      sessionConsistency.add(updateCheck ? 1 : 0);
      errorRate.add(!updateCheck);
      
      sleep(0.5);
      
      // Request 5: Verify session still valid after multiple operations
      const finalProfileRes = http.get(`${BASE_URL}/api/v1/users/me`, authParams);
      
      const finalCheck = check(finalProfileRes, {
        'session still valid': (r) => r.status === 200,
        'user id consistent': (r) => r.json('data.user._id') === userId,
      });
      
      sessionConsistency.add(finalCheck ? 1 : 0);
      errorRate.add(!finalCheck);
      
      if (!finalCheck) {
        console.log(`❌ Session consistency failed for user ${user.email}`);
        authFailures.add(1);
      }
    });
    
    sleep(1);
    
    group('Session Cleanup', function() {
      // Logout to clean up the session
      const logoutParams = {
        headers: {
          'Cookie': `token=${token}`,
        },
      };
      
      const logoutRes = http.post(`${BASE_URL}/api/v1/auth/logout`, null, logoutParams);
      
      check(logoutRes, {
        'logout successful': (r) => r.status === 200,
      });
    });
  });
  
  sleep(2);
}

export function teardown(data) {
  console.log('\n=== Load Balancer Session Persistence Results ===');
  console.log('Session consistency should be >95% for proper load balancer configuration');
  console.log('If session consistency is low:');
  console.log('  - Check sticky session configuration');
  console.log('  - Verify cookie domain and path settings');
  console.log('  - Ensure load balancer preserves cookies');
  console.log('  - Consider using shared session store (Redis)');
}
