import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successfulBookings = new Counter('successful_bookings');
const failedBookings = new Counter('failed_bookings');
const racConditions = new Counter('race_conditions_handled');

// Test configuration - simulate high concurrency
export const options = {
  scenarios: {
    // Scenario 1: Gradual ramp up
    booking_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },  // Ramp up
        { duration: '1m', target: 50 },   // Increased load
        { duration: '2m', target: 50 },   // Sustained load
        { duration: '30s', target: 0 },   // Ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'], // Allow more time for booking transactions
    http_req_failed: ['rate<0.1'], // Less than 10% failed requests
    errors: ['rate<0.15'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export function setup() {
  console.log('Setting up booking concurrency test...');
  console.log(`Testing against: ${BASE_URL}`);

  // Create test organizer
  const organizerPayload = JSON.stringify({
    name: 'Test Organizer',
    email: 'organizer-k6@example.com',
    password: 'Organizer123!',
    role: 'organizer',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  http.post(`${BASE_URL}/api/v1/auth/register`, organizerPayload, params);

  // Login as organizer
  const loginPayload = JSON.stringify({
    email: 'organizer-k6@example.com',
    password: 'Organizer123!',
  });

  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, params);
  
  if (loginRes.status !== 200) {
    console.log('Failed to login as organizer');
    return { eventId: null, users: [] };
  }

  // Extract organizer JWT
  let organizerJwt = '';
  const cookies = loginRes.cookies;
  for (let name in cookies) {
    if (name === 'token') {
      organizerJwt = cookies[name][0].value;
      break;
    }
  }

  // Create test event with limited seats
  const eventPayload = JSON.stringify({
    title: 'K6 Load Test Concert',
    description: 'High-demand concert for testing concurrency',
    category: 'concert',
    venue: 'Test Arena',
    location: {
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
    },
    eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    startTime: '20:00',
    endTime: '23:00',
    totalSeats: 100, // Limited seats to test race conditions
    price: 75,
    status: 'upcoming',
  });

  const eventParams = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${organizerJwt}`,
    },
  };

  const eventRes = http.post(`${BASE_URL}/api/v1/events`, eventPayload, eventParams);
  
  let eventId = null;
  if (eventRes.status === 201) {
    const eventData = eventRes.json();
    eventId = eventData.data.event._id;
    console.log(`Created test event with ID: ${eventId}`);
  } else {
    console.log(`Failed to create event: ${eventRes.status}`);
  }

  // Create multiple test users
  const users = [];
  for (let i = 1; i <= 50; i++) {
    const userPayload = JSON.stringify({
      name: `K6 Test User ${i}`,
      email: `k6user${i}@example.com`,
      password: 'TestUser123!',
    });

    const userRes = http.post(`${BASE_URL}/api/v1/auth/register`, userPayload, params);
    
    if (userRes.status === 201 || userRes.status === 400) {
      users.push({
        email: `k6user${i}@example.com`,
        password: 'TestUser123!',
      });
    }
  }

  console.log(`Setup complete. Created ${users.length} test users and 1 event`);

  return { eventId, users };
}

export default function (data) {
  if (!data.eventId || data.users.length === 0) {
    console.log('Setup failed, skipping test iteration');
    return;
  }

  // Select random user
  const user = data.users[Math.floor(Math.random() * data.users.length)];

  // Login
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
    'login successful': (r) => r.status === 200,
  });

  errorRate.add(!loginSuccess);

  if (!loginSuccess) {
    sleep(1);
    return;
  }

  // Extract JWT
  let jwt = '';
  const cookies = loginRes.cookies;
  for (let name in cookies) {
    if (name === 'token') {
      jwt = cookies[name][0].value;
      break;
    }
  }

  if (!jwt) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  sleep(Math.random() * 2); // Random delay to create race conditions

  // Attempt to book seats
  const numberOfSeats = Math.floor(Math.random() * 3) + 1; // 1-3 seats
  const bookingPayload = JSON.stringify({
    event: data.eventId,
    numberOfSeats: numberOfSeats,
  });

  const bookingParams = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${jwt}`,
    },
  };

  const bookingRes = http.post(`${BASE_URL}/api/v1/bookings`, bookingPayload, bookingParams);

  const bookingChecks = check(bookingRes, {
    'booking request processed': (r) => r.status === 201 || r.status === 400,
    'booking created': (r) => r.status === 201,
    'booking failed (no seats)': (r) => r.status === 400 && r.json('message') && r.json('message').includes('seat'),
  });

  if (bookingRes.status === 201) {
    successfulBookings.add(1);
  } else if (bookingRes.status === 400) {
    // This is expected when seats run out
    failedBookings.add(1);
    racConditions.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(1);

  // Get user's bookings
  const myBookingsRes = http.get(`${BASE_URL}/api/v1/bookings/my-bookings`, {
    headers: {
      'Cookie': `token=${jwt}`,
    },
  });

  check(myBookingsRes, {
    'get bookings successful': (r) => r.status === 200,
  });

  sleep(2);
}

export function teardown(data) {
  console.log('Booking concurrency test completed!');
  console.log('Check metrics for successful vs failed bookings');
}
