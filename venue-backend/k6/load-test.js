import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users over 30s
    { duration: '1m', target: 50 },   // Ramp up to 50 users over 1m
    { duration: '2m', target: 50 },   // Stay at 50 users for 2m
    { duration: '30s', target: 100 }, // Spike to 100 users over 30s
    { duration: '1m', target: 100 },  // Stay at 100 users for 1m
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.05'], // Less than 5% failed requests
    errors: ['rate<0.1'], // Less than 10% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Test data
const users = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  { email: 'loadtest2@example.com', password: 'LoadTest123!' },
  { email: 'loadtest3@example.com', password: 'LoadTest123!' },
];

export function setup() {
  console.log('Setting up load test...');
  console.log(`Testing against: ${BASE_URL}`);

  // Register test users
  users.forEach(user => {
    const payload = JSON.stringify({
      name: `Load Test User ${user.email}`,
      email: user.email,
      password: user.password,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, params);
    
    if (res.status === 201 || res.status === 400) {
      console.log(`User ${user.email} ready (status: ${res.status})`);
    } else {
      console.log(`Failed to setup user ${user.email}: ${res.status}`);
    }
  });

  return { users };
}

export default function (data) {
  // Select random user
  const user = data.users[Math.floor(Math.random() * data.users.length)];

  // 1. Login
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, loginParams);

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('data.user') !== undefined,
  });

  errorRate.add(!loginSuccess);

  if (!loginSuccess) {
    console.log(`Login failed for ${user.email}: ${loginRes.status}`);
    sleep(1);
    return;
  }

  // Extract JWT from cookie
  const cookies = loginRes.cookies;
  let jwt = '';
  
  for (let name in cookies) {
    if (name === 'token') {
      jwt = cookies[name][0].value;
      break;
    }
  }

  if (!jwt) {
    console.log('No JWT token received');
    errorRate.add(1);
    sleep(1);
    return;
  }

  sleep(1);

  // 2. Get current user
  const meParams = {
    headers: {
      'Cookie': `token=${jwt}`,
    },
  };

  const meRes = http.get(`${BASE_URL}/api/v1/auth/me`, meParams);

  const meSuccess = check(meRes, {
    'me status is 200': (r) => r.status === 200,
    'me returns user data': (r) => r.json('data.user') !== undefined,
  });

  errorRate.add(!meSuccess);

  sleep(1);

  // 3. Get events
  const eventsRes = http.get(`${BASE_URL}/api/v1/events`, meParams);

  const eventsSuccess = check(eventsRes, {
    'events status is 200': (r) => r.status === 200,
    'events returns data': (r) => r.json('data') !== undefined,
  });

  errorRate.add(!eventsSuccess);

  sleep(1);

  // 4. Get bookings
  const bookingsRes = http.get(`${BASE_URL}/api/v1/bookings/my-bookings`, meParams);

  const bookingsSuccess = check(bookingsRes, {
    'bookings status is 200': (r) => r.status === 200,
    'bookings returns data': (r) => r.json('data') !== undefined,
  });

  errorRate.add(!bookingsSuccess);

  sleep(2);
}

export function teardown(data) {
  console.log('Load test completed!');
}
