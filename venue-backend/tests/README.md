# Backend Testing

Comprehensive testing infrastructure for VENUE backend API using Jest, Supertest, and K6.

## Test Structure

```
tests/
├── setup.js              # Global test configuration
├── helpers.js            # Test utilities & helpers
├── unit/                 # Unit tests (isolated logic)
│   ├── APIFeatures.test.js
│   ├── apiUtils.test.js
│   ├── autoSlotGenerator.test.js
│   ├── catchAsync.test.js
│   ├── generateSlots.test.js
│   └── passwordHasher.test.js
└── integration/          # Integration tests (API endpoints)
    ├── auth.test.js
    ├── booking.test.js
    ├── event.test.js
    ├── movie.test.js
    ├── organizer.test.js
    ├── slot.test.js
    └── user.test.js
```

## Testing Framework

### Jest
- Test runner and assertion library
- Mocking and spying capabilities
- Code coverage reporting
- Parallel test execution

### Supertest
- HTTP assertion library
- Tests Express routes without server
- Chainable API for requests
- Built-in assertions

### K6
- Load testing tool
- Concurrency testing
- Performance benchmarking
- Located in `/k6` directory

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode (Auto-rerun)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

Coverage report generated at `coverage/lcov-report/index.html`

### Specific Test File
```bash
npm test -- tests/integration/auth.test.js
```

### Tests Matching Pattern
```bash
npm test -- --testNamePattern="should register"
```

## Test Configuration

### jest.config.js
```javascript
{
  testEnvironment: 'node',
  clearMocks: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['./tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

### .env.test
Test-specific environment variables:
```env
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/venue-test
JWT_SECRET=test-jwt-secret
JWT_EXPIRE=7d
DISABLE_RATE_LIMIT=true
```

**CRITICAL:** Always use separate test database.

## Test Setup (setup.js)

Global configuration applied to all tests:

```javascript
// Connect to test database before all tests
beforeAll(async () => {
  await connectDB();
});

// Clear database before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});
```

### Safety Checks
- Validates MONGO_URI contains 'test'
- Prevents accidental production database usage
- Fails early if configuration incorrect

## Test Helpers (helpers.js)

Utility functions for test setup:

### User Creation
```javascript
const { createUser, loginUser, createAuthToken } = require('./helpers');

// Create test user
const user = await createUser({
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'user'
});

// Get auth token
const token = await loginUser('test@example.com', 'password123');
```

### Test Data Factories
```javascript
const { createEvent, createSlot, createBooking } = require('./helpers');

// Create test event
const event = await createEvent({ title: 'Test Event' });

// Create test slot
const slot = await createSlot({ eventId: event._id });

// Create test booking
const booking = await createBooking({ userId: user._id });
```

## Unit Tests

Test isolated functions without external dependencies.

### Example: Password Hasher Test
```javascript
describe('Password Hasher', () => {
  test('should hash password', async () => {
    const hashed = await hashPassword('password123');
    expect(hashed).not.toBe('password123');
    expect(hashed.length).toBeGreaterThan(50);
  });
  
  test('should verify correct password', async () => {
    const hashed = await hashPassword('password123');
    const isValid = await verifyPassword('password123', hashed);
    expect(isValid).toBe(true);
  });
  
  test('should reject incorrect password', async () => {
    const hashed = await hashPassword('password123');
    const isValid = await verifyPassword('wrong', hashed);
    expect(isValid).toBe(false);
  });
});
```

### Example: API Features Test
```javascript
describe('APIFeatures', () => {
  test('should filter results', () => {
    const query = Event.find();
    const requestQuery = { category: 'concert' };
    
    const features = new APIFeatures(query, requestQuery).filter();
    expect(features.query.getFilter()).toEqual({ category: 'concert' });
  });
  
  test('should paginate results', async () => {
    const features = new APIFeatures(Event.find(), { page: 2, limit: 10 })
      .paginate();
    
    expect(features.query.options.skip).toBe(10);
    expect(features.query.options.limit).toBe(10);
  });
});
```

## Integration Tests

Test API endpoints with database and middleware.

### Example: Auth Integration Test
```javascript
describe('Auth Routes', () => {
  test('POST /api/auth/register - should register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      })
      .expect(201);
    
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });
  
  test('POST /api/auth/login - should login with correct credentials', async () => {
    await createUser({ email: 'john@example.com', password: 'password123' });
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'password123' })
      .expect(200);
    
    expect(res.body.data.user.email).toBe('john@example.com');
  });
  
  test('POST /api/auth/login - should reject incorrect password', async () => {
    await createUser({ email: 'john@example.com', password: 'password123' });
    
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'wrong' })
      .expect(401);
  });
});
```

### Example: Booking Integration Test
```javascript
describe('Booking Routes', () => {
  let user, token, event, slot;
  
  beforeEach(async () => {
    user = await createUser();
    token = createAuthToken(user._id);
    event = await createEvent();
    slot = await createSlot({ eventId: event._id, availableSeats: 10 });
  });
  
  test('POST /api/bookings - should create booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', `token=${token}`)
      .send({
        slotId: slot._id,
        numberOfSeats: 2,
      })
      .expect(201);
    
    expect(res.body.data.booking.numberOfSeats).toBe(2);
    
    // Verify slot capacity decreased
    const updatedSlot = await Slot.findById(slot._id);
    expect(updatedSlot.availableSeats).toBe(8);
  });
  
  test('POST /api/bookings - should reject insufficient seats', async () => {
    await request(app)
      .post('/api/bookings')
      .set('Cookie', `token=${token}`)
      .send({
        slotId: slot._id,
        numberOfSeats: 20, // More than available
      })
      .expect(400);
  });
});
```

## Coverage Targets

### Minimum Thresholds
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Current Coverage
Run `npm run test:coverage` to see current stats.

### Viewing Coverage Report
```bash
npm run test:coverage

# Open HTML report
# Windows
start coverage/lcov-report/index.html

# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html
```

## Testing Best Practices

### 1. Test Isolation
Each test should be independent:
```javascript
beforeEach(async () => {
  // Clear database
  // Create fresh test data
});

afterEach(async () => {
  // Cleanup resources
});
```

### 2. Descriptive Test Names
```javascript
// Good
test('should reject booking when insufficient seats', async () => {});

// Bad
test('booking test', async () => {});
```

### 3. Arrange-Act-Assert Pattern
```javascript
test('should update user profile', async () => {
  // Arrange
  const user = await createUser();
  const token = createAuthToken(user._id);
  
  // Act
  const res = await request(app)
    .patch(`/api/users/${user._id}`)
    .set('Cookie', `token=${token}`)
    .send({ name: 'New Name' });
  
  // Assert
  expect(res.body.data.user.name).toBe('New Name');
});
```

### 4. Test Edge Cases
```javascript
describe('Booking validation', () => {
  test('should accept minimum valid seats (1)', async () => {});
  test('should accept maximum valid seats (capacity)', async () => {});
  test('should reject zero seats', async () => {});
  test('should reject negative seats', async () => {});
  test('should reject more than capacity', async () => {});
});
```

### 5. Mock External Services
```javascript
jest.mock('../services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

test('should not fail if email service down', async () => {
  // Test continues even if email fails
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Scheduled daily runs

### CI Configuration (.github/workflows/ci.yml)
```yaml
- name: Run tests
  run: |
    cd venue-backend
    npm test -- --coverage --maxWorkers=2
    
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./venue-backend/coverage/lcov.info
```

## Debugging Tests

### Run with Verbose Output
```bash
npm test -- --verbose
```

### Run Single Test File
```bash
npm test -- tests/integration/auth.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="register"
```

### Use Node Debugger
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

## Common Issues

### Tests Timeout
Increase timeout in specific test:
```javascript
test('slow operation', async () => {
  // test code
}, 60000); // 60 second timeout
```

Or globally in jest.config.js:
```javascript
testTimeout: 60000
```

### Database Connection Errors
Verify MongoDB is running:
```bash
mongosh --eval "db.version()"
```

Check .env.test has correct MONGO_URI:
```env
MONGO_URI=mongodb://localhost:27017/venue-test
```

### Port Already in Use
Tests run on ephemeral ports automatically.
If issues persist, check for hanging processes:
```bash
# Windows
netstat -ano | findstr :5000

# macOS/Linux
lsof -i :5000
```

### Module Not Found
Clear Jest cache:
```bash
npm test -- --clearCache
```

Reinstall dependencies:
```bash
npm install
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [K6 Load Testing](../k6/README.md)
- [Testing Guide](../TESTING.md)
- [Setup Guide](../SETUP_GUIDE.md)

## Next Steps

1. Add E2E tests (Playwright)
2. Increase coverage to 85%+
3. Add mutation testing
4. Performance benchmarking
5. Visual regression testing

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Maintain coverage thresholds
3. Follow naming conventions
4. Test edge cases
5. Update documentation

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
