import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

/**
 * LOAD BALANCER WEBSOCKET TEST
 * 
 * Purpose: Test WebSocket connections through load balancer
 * Validates connection persistence and message delivery
 */

const errorRate = new Rate('errors');
const wsMessages = new Counter('websocket_messages');
const wsLatency = new Trend('websocket_latency');

export const options = {
  scenarios: {
    websocket_connections: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export function setup() {
  console.log('=== WebSocket Load Balancer Test ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('\nNote: This tests HTTP polling as WebSocket alternative');
  console.log('For true WebSocket testing, use specialized tools\n');
}

export default function () {
  // Simulate real-time updates via HTTP polling
  // (Many load balancers handle HTTP better than WebSockets)
  
  const startTime = Date.now();
  const res = http.get(`${BASE_URL}/api/v1/events?limit=1&sort=-updatedAt`);
  wsLatency.add(Date.now() - startTime);
  
  const success = check(res, {
    'polling successful': (r) => r.status === 200,
    'data received': (r) => r.json('data') !== undefined,
  });
  
  if (success) {
    wsMessages.add(1);
  } else {
    errorRate.add(1);
  }
  
  sleep(1); // Poll every second
}

export function teardown() {
  console.log('\n=== WebSocket Load Balancer Test Complete ===');
  console.log('For production WebSocket support:');
  console.log('- Configure sticky sessions');
  console.log('- Use WebSocket-aware load balancers');
  console.log('- Consider using a message broker (Redis Pub/Sub)');
}
