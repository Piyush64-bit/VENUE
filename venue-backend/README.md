# VENUE Backend

Node.js/Express REST API with MongoDB for event and movie booking system.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache/State:** Redis
- **Real-time:** Socket.IO
- **Authentication:** JWT (HttpOnly cookies)
- **Password:** Argon2 hashing
- **Validation:** Zod schemas
- **Testing:** Jest, Supertest, K6
- **API Docs:** Swagger/OpenAPI

## Key Features

### Transaction-Safe Booking
- MongoDB ACID transactions prevent overbooking
- Atomic operations for seat decrements
- Race condition handling with database-level locks

### Multi-Tier Rate Limiting
- Global: 1000 req/hour per IP
- Auth endpoints: 5 attempts/15min
- Authenticated users: 100 req/15min
- Booking endpoints: 10 req/min

### Security Implementation
- JWT with HttpOnly cookie storage
- Role-Based Access Control (RBAC)
- Helmet.js security headers
- NoSQL injection prevention
- Input sanitization (express-mongo-sanitize, sanitize-html)
- CORS with origin whitelisting

### Request Observability
- Request ID correlation
- Structured logging (Winston)
- Log rotation and archival
- Environment-specific formatting

## Project Structure

```
src/
├── modules/                # Feature modules
│   ├── auth/              # Authentication & JWT
│   ├── bookings/          # Booking transactions
│   ├── events/            # Event management
│   ├── movies/            # Movie schema & routes
│   ├── organizer/         # Organizer features
│   ├── slots/             # Time slot generation
│   ├── users/             # User CRUD
│   └── waitlist/          # Waitlist management
├── middlewares/           # Cross-cutting concerns
│   ├── verifyToken.js    # JWT verification
│   ├── checkRole.js      # RBAC authorization
│   ├── rateLimiter.js    # Redis-based rate limiting
│   ├── validateRequest.js # Zod schema validation
│   ├── validateId.js     # MongoDB ObjectId validation
│   ├── cache.middleware.js # Redis caching
│   ├── upload.middleware.js # File upload (Cloudinary)
│   └── globalErrorHandler.js # Centralized errors
├── config/               # External service configs
│   ├── db.js            # MongoDB connection
│   ├── logger.js        # Winston config
│   ├── swagger.js       # API documentation
│   └── cloudinary.js    # Image upload
├── services/            # Business logic services
│   ├── email.service.js # Email notifications
│   └── redis.service.js # Redis utilities
├── utils/               # Helper functions
│   ├── catchAsync.js   # Async error wrapper
│   ├── AppError.js     # Custom error class
│   ├── APIFeatures.js  # Query helper (filter, sort, paginate)
│   └── generateSlots.js # Slot generation algorithm
└── app.js              # Express app setup

tests/
├── setup.js            # Global test configuration
├── helpers.js          # Test utilities
├── unit/               # Unit tests
│   ├── APIFeatures.test.js
│   ├── autoSlotGenerator.test.js
│   └── passwordHasher.test.js
└── integration/        # API integration tests
    ├── auth.test.js
    ├── booking.test.js
    ├── event.test.js
    ├── movie.test.js
    ├── organizer.test.js
    ├── slot.test.js
    └── user.test.js

k6/                     # Load testing
├── load-test.js        # General API load
├── booking-concurrency.js # Concurrency validation
└── rate-limit-test.js  # Rate limiter testing
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/venue
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

REDIS_HOST=localhost
REDIS_PORT=6379

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

CORS_ORIGIN=http://localhost:3000
```

### 3. Start MongoDB & Redis
```bash
# MongoDB
net start MongoDB

# Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Run Development Server
```bash
npm run dev
```

Server starts at `http://localhost:5000`

API Documentation: `http://localhost:5000/docs`

## Available Scripts

```bash
npm run dev          # Development with nodemon
npm start            # Production server
npm test             # Run all tests
npm run test:unit    # Unit tests only
npm run test:integration # Integration tests
npm run test:coverage    # Generate coverage report
npm run test:watch   # Watch mode
npm run k6:load      # Load testing
npm run k6:booking   # Concurrency testing
npm run k6:rate-limit # Rate limit testing
```

## API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login
GET    /api/auth/me          # Get current user
POST   /api/auth/logout      # Logout
```

### Users
```
GET    /api/users            # Get all users (Admin)
GET    /api/users/:id        # Get user by ID
PATCH  /api/users/:id        # Update user
DELETE /api/users/:id        # Delete user (Admin)
```

### Events
```
GET    /api/events           # Get all events
GET    /api/events/:id       # Get event by ID
POST   /api/events           # Create event (Organizer)
PATCH  /api/events/:id       # Update event (Organizer)
DELETE /api/events/:id       # Delete event (Organizer)
```

### Movies
```
GET    /api/movies           # Get all movies
GET    /api/movies/:id       # Get movie by ID
POST   /api/movies           # Add movie (Admin)
PATCH  /api/movies/:id       # Update movie (Admin)
DELETE /api/movies/:id       # Delete movie (Admin)
```

### Slots
```
GET    /api/slots            # Get slots (filter by event/movie)
GET    /api/slots/:id        # Get slot by ID
POST   /api/slots            # Create slot (Organizer)
PATCH  /api/slots/:id        # Update slot (Organizer)
DELETE /api/slots/:id        # Delete slot (Organizer)
```

### Bookings
```
GET    /api/bookings         # Get user's bookings
GET    /api/bookings/:id     # Get booking by ID
POST   /api/bookings         # Create booking
DELETE /api/bookings/:id     # Cancel booking
```

### Waitlist
```
POST   /api/waitlist         # Join waitlist
GET    /api/waitlist/:slotId # Get waitlist for slot
DELETE /api/waitlist/:id     # Leave waitlist
```

## Testing

### Unit Tests
Test isolated functions and utilities:
```bash
npm run test:unit
```

### Integration Tests
Test API endpoints with database:
```bash
npm run test:integration
```

### Coverage Report
```bash
npm run test:coverage
# Report: coverage/lcov-report/index.html
```

### Load Testing
Test performance under load:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run k6:load
```

Performance targets:
- p95 response time < 500ms
- p99 response time < 1000ms
- Error rate < 1%

## Module Architecture

### Controller-Service-Model Pattern

**Controllers** (modules/*/controller.js)
- Handle HTTP requests/responses
- Validate input with Zod schemas
- Delegate to services
- Format responses

**Services** (modules/*/service.js)
- Contain business logic
- Orchestrate database operations
- Handle transactions
- Implement domain rules

**Models** (modules/*/model.js)
- Define Mongoose schemas
- Database validation
- Virtual properties
- Instance methods

**Middleware** (middlewares/)
- Authentication (verifyToken)
- Authorization (checkRole)
- Rate limiting (Redis-based)
- Request validation (Zod)
- Error handling

## Database Design

### Collections
- **users** - User accounts (email, password, role)
- **events** - Events (concerts, plays, sports)
- **movies** - Movie catalog (title, genre, duration)
- **slots** - Time slots (date, time, capacity)
- **bookings** - User reservations (user, slot, seats)
- **waitlist** - Waiting list entries

### Indexes
- users.email (unique)
- bookings.userId
- bookings.slotId
- slots.eventId
- slots.date

## Error Handling

### Custom Error Class
```javascript
throw new AppError('Resource not found', 404);
```

### Async Error Wrapper
```javascript
exports.handler = catchAsync(async (req, res, next) => {
  // Automatic error catching
});
```

### Global Error Middleware
- Development: Full stack trace
- Production: Sanitized messages
- Operational vs programming errors
- Database error handling

## Logging

### Winston Configuration
- **Development:** Colorized console output
- **Production:** JSON formatted logs
- **Files:** Combined logs + error logs
- **Rotation:** Daily rotation with compression

### Log Levels
- error: Application errors
- warn: Warning conditions
- info: General information
- debug: Debugging information

## Deployment

### Docker
```bash
docker build -t venue-backend .
docker run -p 5000:5000 --env-file .env venue-backend
```

### Environment Variables
See `.env.example` for required configuration.

### Production Checklist
- Set NODE_ENV=production
- Use strong JWT_SECRET
- Configure MongoDB Atlas
- Set up Redis Cloud
- Enable rate limiting
- Configure CORS origins
- Set up log aggregation
- Enable monitoring

## Performance Optimization

### Implemented
- Redis caching for frequent queries
- Database indexing on query fields
- Connection pooling (MongoDB)
- Response compression
- Query optimization (projection, lean)

### Monitoring
- Request duration logging
- Database query performance
- Error rate tracking
- Resource utilization

## Security Features

### Authentication
- JWT with HttpOnly cookies
- Secure cookie flags (production)
- Token expiration
- Password hashing (Argon2)

### Authorization
- Role-based access (User, Organizer, Admin)
- Resource ownership validation
- Route protection middleware

### Input Protection
- Zod schema validation
- MongoDB ObjectId validation
- NoSQL injection prevention
- HTML sanitization
- File upload restrictions

### Headers & CORS
- Helmet.js security headers
- Content Security Policy
- CORS origin whitelisting
- XSS protection

## Resources

- [API Documentation](http://localhost:5000/docs)
- [Testing Guide](./TESTING.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [K6 Load Tests](./k6/README.md)
- [Main README](../README.md)
- [Architecture](../ARCHITECTURE.md)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](../LICENSE)
