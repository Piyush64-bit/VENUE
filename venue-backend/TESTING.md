# Testing Documentation - VENUE Backend

Comprehensive guide for Jest, Supertest, and k6 testing infrastructure.

---

## Table of Contents

1. [Part 1: Jest + Supertest Setup](#part-1-jest--supertest-setup)
2. [Part 2: Test Database Handling](#part-2-test-database-handling)
3. [Part 3: k6 Load Testing Setup](#part-3-k6-load-testing-setup)
4. [Part 4: Best Practices](#part-4-best-practices)

---

## Part 1: Jest + Supertest Setup

### Step 1: Install Dependencies

```bash
# Main testing dependencies (already installed)
npm install --save-dev jest supertest cross-env

# Optional but recommended
npm install --save-dev @types/jest @types/supertest
```

✅ **Note:** Jest and Supertest are already in your devDependencies. Just add `cross-env`:

```bash
npm install --save-dev cross-env
```

---

### Step 2: Configuration Files

#### jest.config.js

Located at: `venue-backend/jest.config.js`

Key configurations:
- **testEnvironment**: 'node' (for backend testing)
- **clearMocks**: true (auto-clear mocks between tests)
- **testTimeout**: 30000 (30 seconds for DB operations)
- **setupFilesAfterEnv**: Points to test setup file
- **collectCoverageFrom**: Excludes non-testable files
- **coverageThresholds**: Set to 70% (adjust as needed)

---

### Step 3: Test Setup File

Located at: `venue-backend/tests/setup.js`

Handles:
- Loading `.env.test` environment variables
- Connecting to test database before all tests
- Clearing database before each test
- Closing connections after all tests
- Safety check (ensures MONGO_URI contains 'test')

---

### Step 4: Test Environment Configuration

Located at: `venue-backend/.env.test`

**CRITICAL:** Always use a separate test database!

```env
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/venue-test
JWT_SECRET=test-jwt-secret-key
# ... other test-specific configs
```

⚠️ **Safety First:** The setup file validates that MONGO_URI contains 'test' to prevent accidental production DB usage.

---

### Step 5: Test Folder Structure

```
venue-backend/
├── tests/
│   ├── setup.js                    # Global test setup
│   ├── helpers.js                  # Test utilities
│   ├── integration/                # Integration tests
│   │   ├── auth.test.js            # Auth routes tests
│   │   └── booking.test.js         # Booking routes tests
│   └── unit/                       # Unit tests (create as needed)
│       ├── utils.test.js
│       └── services.test.js
├── jest.config.js
└── .env.test
```

---

### Step 6: Running Tests

```bash
# Run all tests
npm test

# Run with watch mode (auto-runs on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit

# Run with verbose output
npm run test:verbose
```

---

### Step 7: Example Tests

#### Auth Integration Test
Location: `tests/integration/auth.test.js`

Tests:
- ✅ User registration
- ✅ User login (correct/incorrect credentials)
- ✅ Get current user (with/without token)
- ✅ User logout
- ✅ Validation errors
- ✅ Duplicate email handling

#### Booking Integration Test
Location: `tests/integration/booking.test.js`

Tests:
- ✅ Create booking
- ✅ Get user bookings
- ✅ Get booking by ID
- ✅ Cancel booking
- ✅ Insufficient seats handling
- ✅ Concurrent booking race conditions
- ✅ Authorization checks

---

### Step 8: Key Testing Utilities

Located at: `tests/helpers.js`

Available functions:
- `generateTestToken(payload)` - Creates JWT for testing
- `createTestUser(userData)` - Creates test user
- `createTestOrganizer(userData)` - Creates test organizer
- `createTestAdmin(userData)` - Creates test admin
- `createTestEvent(organizerId, eventData)` - Creates test event
- `extractCookies(response)` - Parses cookies from response
- `wait(ms)` - Async delay helper

Example usage:
```javascript
const { createTestUser, generateTestToken } = require('../helpers');

// In your test
const user = await createTestUser({ email: 'test@example.com' });
const token = generateTestToken({ id: user._id, role: 'user' });

const response = await request(app)
  .get('/api/v1/protected-route')
  .set('Cookie', [`jwt=${token}`])
  .expect(200);
```

---

## Part 2: Test Database Handling

### Connection Management

The setup file (`tests/setup.js`) handles all database lifecycle:

#### beforeAll Hook
- Loads test environment variables
- Connects to MongoDB test database
- Validates MONGO_URI contains 'test' for safety

#### beforeEach Hook
- Clears all collections before each test
- Ensures test isolation
- Prevents test interference

#### afterAll Hook
- Closes MongoDB connection
- Closes Redis connection (if used)
- Allows graceful shutdown

---

### Database Safety

```javascript
// Safety check in setup.js
if (!process.env.MONGO_URI || !process.env.MONGO_URI.includes('test')) {
  throw new Error('MONGO_URI must contain "test" in the database name for safety');
}
```

This prevents accidentally running tests against production database.

---

### Manual Database Operations

When you need manual control:

```javascript
const mongoose = require('mongoose');

beforeAll(async () => {
  // Custom connection logic
});

beforeEach(async () => {
  // Clear specific collections
  await User.deleteMany({});
  await Event.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});
```

---

### Database Best Practices

1. **Always use separate test database**
2. **Clear data before each test** (not after) - helps debugging
3. **Use transactions when testing race conditions**
4. **Close connections to prevent memory leaks**
5. **Set testTimeout high enough for DB operations**

---

## Part 3: k6 Load Testing Setup

### Step 1: Install k6

#### Windows (Chocolatey)
```bash
choco install k6
```

#### Windows (Scoop)
```bash
scoop install k6
```

#### Windows (Manual)
1. Download from: https://dl.k6.io/msi/k6-latest-amd64.msi
2. Run installer
3. Verify: `k6 version`

#### macOS
```bash
brew install k6
```

#### Linux
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

### Step 2: k6 Test Scripts

Three load test scripts are available:

#### 1. General Load Test
Location: `k6/load-test.js`

Purpose: Test overall API performance under load

```bash
npm run k6:load
```

Stages:
- Ramp up to 20 users (30s)
- Ramp up to 50 users (1m)
- Sustain 50 users (2m)
- Spike to 100 users (30s)
- Sustain 100 users (1m)
- Ramp down to 0 (30s)

Thresholds:
- 95% of requests under 500ms
- 99% of requests under 1s
- Less than 5% failed requests

---

#### 2. Booking Concurrency Test
Location: `k6/booking-concurrency.js`

Purpose: Test race conditions in booking system

```bash
npm run k6:booking
```

Features:
- Creates event with limited seats (100)
- Simulates 50 concurrent users
- Tests seat availability under high concurrency
- Measures successful vs failed bookings
- Validates transaction integrity

Metrics:
- `successful_bookings` - Total bookings created
- `failed_bookings` - Bookings rejected (expected when full)
- `race_conditions_handled` - Concurrent requests handled correctly

---

#### 3. Rate Limiting Test
Location: `k6/rate-limit-test.js`

Purpose: Verify rate limiting is working correctly

```bash
npm run k6:rate-limit
```

Features:
- Rapid-fire requests to auth endpoints
- Tests rate limiter thresholds
- Measures 429 (Too Many Requests) responses

Metrics:
- `rate_limit_hits` - Number of rate-limited requests
- `successful_requests` - Requests that passed through

---

### Step 3: Running k6 Tests

```bash
# Basic run
k6 run k6/load-test.js

# With custom base URL
k6 run --env BASE_URL=http://localhost:5000 k6/load-test.js

# With more virtual users
k6 run --vus 100 --duration 30s k6/load-test.js

# Output to JSON for CI/CD
k6 run --out json=results.json k6/load-test.js

# Output to InfluxDB (if configured)
k6 run --out influxdb=http://localhost:8086/k6 k6/load-test.js
```

Using npm scripts:
```bash
npm run k6:load          # General load test
npm run k6:booking       # Booking concurrency test
npm run k6:rate-limit    # Rate limiting test
```

---

### Step 4: Interpreting k6 Results

After running a test, k6 provides detailed metrics:

```
scenarios: (100.00%) 1 scenario, 100 max VUs, 5m30s max duration
✓ login status is 200
✓ booking created

checks.........................: 95.23% ✓ 9523 ✗ 477
data_received..................: 15 MB  50 kB/s
data_sent......................: 8.5 MB 28 kB/s
http_req_blocked...............: avg=1.2ms   min=0s    med=0s     max=350ms p(95)=5ms   p(99)=15ms
http_req_connecting............: avg=500µs   min=0s    med=0s     max=100ms p(95)=2ms   p(99)=8ms
http_req_duration..............: avg=245ms   min=10ms  med=180ms  max=2s    p(95)=450ms p(99)=800ms ✓
http_req_failed................: 4.76%  ✓ 477  ✗ 9523
http_req_receiving.............: avg=150µs   min=0s    med=100µs  max=50ms  p(95)=500µs p(99)=2ms
http_req_sending...............: avg=80µs    min=0s    med=50µs   max=20ms  p(95)=200µs p(99)=800µs
http_req_tls_handshaking.......: avg=0s      min=0s    med=0s     max=0s    p(95)=0s    p(99)=0s
http_req_waiting...............: avg=244ms   min=10ms  med=179ms  max=2s    p(95)=449ms p(99)=799ms
http_reqs......................: 10000  33.33/s
iteration_duration.............: avg=2.5s    min=1.8s  med=2.3s   max=5s    p(95)=3.5s  p(99)=4.2s
iterations.....................: 2000   6.67/s
vus............................: 50     min=0   max=100
vus_max........................: 100    min=100 max=100
```

**Key Metrics to Watch:**
- ✅ `http_req_duration` p(95) - 95th percentile response time
- ✅ `http_req_failed` - Percentage of failed requests
- ✅ `checks` - Percentage of passed assertions
- ⚠️ `http_req_blocked` - Time spent in TCP connection
- ⚠️ `http_req_waiting` - Time to first byte (TTFB)

---

### Step 5: k6 Best Practices

1. **Start small, scale up** - Begin with low VUs, increase gradually
2. **Use realistic data** - Mimic production scenarios
3. **Set proper thresholds** - Define acceptable performance
4. **Test in stages** - Ramp up, sustain, ramp down
5. **Monitor system resources** - Watch CPU, memory, database
6. **Test different scenarios** - Normal load, spike, stress

---

## Part 4: Best Practices

### Unit vs Integration Tests

#### Unit Tests
- **Purpose:** Test individual functions/methods in isolation
- **Speed:** Fast (milliseconds)
- **Database:** Mocked or not used
- **Scope:** Single function/class
- **Example:** Test password hashing function

```javascript
// Unit test example
describe('hashPassword', () => {
  it('should hash password correctly', async () => {
    const password = 'MyPassword123!';
    const hashed = await hashPassword(password);
    
    expect(hashed).not.toBe(password);
    expect(hashed).toHaveLength(97); // argon2 hash length
  });
});
```

#### Integration Tests
- **Purpose:** Test complete workflows with real dependencies
- **Speed:** Slower (seconds)
- **Database:** Real test database
- **Scope:** Multiple components working together
- **Example:** Test complete user registration flow

```javascript
// Integration test example
describe('POST /api/v1/auth/register', () => {
  it('should register user and store in database', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'User', email: 'test@example.com', password: 'Pass123!' })
      .expect(201);
    
    // Verify in database
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeTruthy();
  });
});
```

**When to Use Which:**
- Unit tests for: Utils, helpers, pure functions, business logic
- Integration tests for: API endpoints, database operations, authentication flows

---

### Why Use Supertest?

Supertest is essential for API testing because it:

1. **Starts server programmatically** - No need to manually start server
2. **Handles HTTP assertions** - `.expect(200)`, `.expect('Content-Type', /json/)`
3. **Chains requests** - Easy to test sequential operations
4. **Extracts cookies automatically** - Test cookie-based auth
5. **Works with Express apps** - Direct integration

Example:
```javascript
const response = await request(app)
  .post('/api/v1/auth/login')
  .send({ email: 'user@example.com', password: 'Password123!' })
  .expect(200)
  .expect('Content-Type', /json/);

expect(response.body.status).toBe('success');
```

---

### Why Load Testing Matters

Load testing reveals issues that only appear under real-world conditions:

1. **Performance Bottlenecks**
   - Slow database queries
   - Inefficient algorithms
   - Memory leaks

2. **Race Conditions**
   - Concurrent booking conflicts
   - Inventory management issues
   - Data inconsistency

3. **Resource Limits**
   - Connection pool exhaustion
   - Memory limits
   - CPU saturation

4. **Rate Limiting Effectiveness**
   - Is it protecting your API?
   - Are thresholds appropriate?

5. **Real User Experience**
   - How does it feel under load?
   - What breaks first?

**Production Benefits:**
- Avoid downtime during traffic spikes
- Identify scaling needs before launch
- Validate caching strategies
- Ensure SLA compliance

---

### Testing Race Conditions in Booking System

Race conditions occur when multiple users try to book the last few seats simultaneously.

#### Problem Without Proper Handling:
```javascript
// ❌ BAD: Check-then-act pattern (race condition)
const event = await Event.findById(eventId);
if (event.availableSeats >= numberOfSeats) {
  // ⚠️ Another request could execute here
  event.availableSeats -= numberOfSeats;
  await event.save();
}
```

#### Solution 1: Atomic Updates
```javascript
// ✅ GOOD: Atomic operation
const event = await Event.findOneAndUpdate(
  {
    _id: eventId,
    availableSeats: { $gte: numberOfSeats } // Check inside update
  },
  {
    $inc: { availableSeats: -numberOfSeats }
  },
  { new: true }
);

if (!event) {
  throw new Error('Not enough seats available');
}
```

#### Solution 2: Transactions
```javascript
// ✅ BEST: MongoDB transaction
const session = await mongoose.startSession();
session.startTransaction();

try {
  const event = await Event.findById(eventId).session(session);
  
  if (event.availableSeats < numberOfSeats) {
    throw new Error('Not enough seats');
  }
  
  event.availableSeats -= numberOfSeats;
  await event.save({ session });
  
  const booking = await Booking.create([{
    user: userId,
    event: eventId,
    numberOfSeats,
    totalPrice: event.price * numberOfSeats
  }], { session });
  
  await session.commitTransaction();
  return booking;
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

#### Testing Race Conditions:
```javascript
// Test concurrent bookings
it('should handle concurrent booking requests correctly', async () => {
  // Create event with limited seats
  await Event.findByIdAndUpdate(eventId, { 
    totalSeats: 5, 
    availableSeats: 5 
  });

  // Create two users
  const user1 = await createTestUser({ email: 'user1@example.com' });
  const user2 = await createTestUser({ email: 'user2@example.com' });

  // Make concurrent requests for 3 seats each (total 6, but only 5 available)
  const [response1, response2] = await Promise.all([
    request(app)
      .post('/api/v1/bookings')
      .set('Cookie', [`jwt=${token1}`])
      .send({ event: eventId, numberOfSeats: 3 }),
    request(app)
      .post('/api/v1/bookings')
      .set('Cookie', [`jwt=${token2}`])
      .send({ event: eventId, numberOfSeats: 3 }),
  ]);

  // One should succeed, one should fail
  const success = [response1, response2].filter(r => r.status === 201);
  const failure = [response1, response2].filter(r => r.status === 400);

  expect(success).toHaveLength(1);
  expect(failure).toHaveLength(1);

  // Verify final state
  const event = await Event.findById(eventId);
  expect(event.availableSeats).toBe(2); // 5 - 3 = 2
});
```

---

### Common Mistakes to Avoid

#### 1. Not Using Separate Test Database
```javascript
// ❌ WRONG
MONGO_URI=mongodb://localhost:27017/venue-production

// ✅ CORRECT
MONGO_URI=mongodb://localhost:27017/venue-test
```

#### 2. Not Cleaning Up Between Tests
```javascript
// ❌ WRONG: Tests depend on order
it('creates user', async () => {
  await User.create({ email: 'test@example.com' });
});

it('finds user', async () => {
  const user = await User.findOne({ email: 'test@example.com' });
  expect(user).toBeTruthy(); // Depends on previous test!
});

// ✅ CORRECT: Each test is independent
beforeEach(async () => {
  await User.deleteMany({});
});

it('creates user', async () => {
  await User.create({ email: 'test@example.com' });
  const user = await User.findOne({ email: 'test@example.com' });
  expect(user).toBeTruthy();
});
```

#### 3. Not Handling Async Properly
```javascript
// ❌ WRONG: Missing await
it('should create user', async () => {
  User.create({ email: 'test@example.com' }); // ⚠️ Missing await
  const user = await User.findOne({ email: 'test@example.com' });
  expect(user).toBeTruthy(); // May fail!
});

// ✅ CORRECT
it('should create user', async () => {
  await User.create({ email: 'test@example.com' });
  const user = await User.findOne({ email: 'test@example.com' });
  expect(user).toBeTruthy();
});
```

#### 4. Testing Implementation, Not Behavior
```javascript
// ❌ WRONG: Tests internal implementation
it('should call hashPassword function', async () => {
  const spy = jest.spyOn(passwordHasher, 'hashPassword');
  await registerUser(userData);
  expect(spy).toHaveBeenCalled(); // Brittle test!
});

// ✅ CORRECT: Tests behavior/outcome
it('should store hashed password', async () => {
  await registerUser({ email: 'test@example.com', password: 'Plain123!' });
  const user = await User.findOne({ email: 'test@example.com' });
  expect(user.password).not.toBe('Plain123!'); // Verifies it's hashed
  expect(user.password).toHaveLength(97); // Verifies hash format
});
```

#### 5. Not Testing Error Cases
```javascript
// ❌ WRONG: Only test happy path
it('should create booking', async () => {
  const response = await request(app)
    .post('/api/v1/bookings')
    .send({ event: eventId, numberOfSeats: 2 })
    .expect(201);
});

// ✅ CORRECT: Test error cases too
it('should fail with insufficient seats', async () => {
  await request(app)
    .post('/api/v1/bookings')
    .send({ event: eventId, numberOfSeats: 9999 })
    .expect(400);
});

it('should fail without authentication', async () => {
  await request(app)
    .post('/api/v1/bookings')
    .send({ event: eventId, numberOfSeats: 2 })
    .expect(401);
});
```

#### 6. Hardcoding Values
```javascript
// ❌ WRONG: Hardcoded production values
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Real token!

// ✅ CORRECT: Generate test data
const token = generateTestToken({ id: user._id, role: 'user' });
```

#### 7. Not Checking Database State
```javascript
// ❌ WRONG: Only check HTTP response
it('should create booking', async () => {
  const response = await request(app)
    .post('/api/v1/bookings')
    .send({ event: eventId, numberOfSeats: 2 })
    .expect(201);
  
  expect(response.body.status).toBe('success'); // Only HTTP check
});

// ✅ CORRECT: Verify database state
it('should create booking', async () => {
  const response = await request(app)
    .post('/api/v1/bookings')
    .send({ event: eventId, numberOfSeats: 2 })
    .expect(201);
  
  // Verify HTTP response
  expect(response.body.status).toBe('success');
  
  // Verify database state
  const booking = await Booking.findById(response.body.data.booking._id);
  expect(booking).toBeTruthy();
  expect(booking.numberOfSeats).toBe(2);
  
  // Verify side effects
  const event = await Event.findById(eventId);
  expect(event.availableSeats).toBe(98);
});
```

---

## Quick Reference

### Jest Commands
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:integration    # Integration tests only
npm run test:unit           # Unit tests only
```

### k6 Commands
```bash
npm run k6:load             # General load test
npm run k6:booking          # Booking concurrency
npm run k6:rate-limit       # Rate limit test
k6 run --vus 50 script.js   # Custom virtual users
```

### Test Structure
```javascript
describe('Feature', () => {
  beforeAll(async () => {
    // Setup before all tests
  });

  beforeEach(async () => {
    // Setup before each test
  });

  it('should do something', async () => {
    // Test logic
    expect(result).toBe(expected);
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  afterAll(async () => {
    // Cleanup after all tests
  });
});
```

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [k6 Documentation](https://k6.io/docs/)
- [MongoDB Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Troubleshooting

### Tests Hanging
- Check for missing `await` statements
- Verify connections are closed in `afterAll`
- Increase `testTimeout` in jest.config.js

### Database Connection Errors
- Ensure MongoDB is running: `mongod`
- Verify MONGO_URI in .env.test
- Check network firewall settings

### k6 Not Found
- Install k6: `choco install k6` (Windows)
- Verify installation: `k6 version`
- Add to PATH if needed

### Rate Limit Tests Failing
- Adjust rate limit thresholds in .env.test
- Check Redis is running (if using Redis rate limiter)
- Verify rate limiter is not too restrictive

---

**Happy Testing! 🚀**

