# Contributing to VENUE

Thank you for your interest in contributing to VENUE! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project follows a simple code of conduct:
- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: v20)
- MongoDB 7+
- Redis 7+
- Git
- Docker (optional, for containerized development)

### Fork & Clone

1. Fork the repository on GitHub
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/VENUE.git
cd VENUE
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/VENUE.git
```

## Development Setup

### Backend Setup

```bash
cd venue-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your local configuration
# Start MongoDB and Redis locally or use Docker

# Run development server
npm run dev
```

### Frontend Setup

```bash
cd venue-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with backend URL
# Start development server
npm run dev
```

### Using Docker

```bash
# Start all services (MongoDB, Redis, Backend, Frontend)
docker-compose up --build

# Access services:
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
# API Docs: http://localhost:5000/docs
```

## Making Changes

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `test/*` - Test additions/improvements

### Creating a Feature Branch

```bash
# Update your local repository
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name
```

## Testing Requirements

**All pull requests must include tests!**

### Backend Testing

```bash
cd venue-backend

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Generate coverage report
npm run test:coverage

# Watch mode (for development)
npm run test:watch
```

**Required Coverage**:
- New features: 80%+ coverage
- Bug fixes: Add test that reproduces the bug

### Frontend Testing

```bash
cd venue-frontend

# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Load Testing (Optional)

```bash
cd venue-backend

# Test booking concurrency
npm run k6:booking

# Test API load
npm run k6:load

# Test rate limiting
npm run k6:rate-limit
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated (if applicable)
- [ ] No console.log statements (use logger instead)
- [ ] No commented-out code
- [ ] Commits follow commit message guidelines

### Submitting a PR

1. Push your changes to your fork:
```bash
git push origin feature/your-feature-name
```

2. Create a Pull Request on GitHub
3. Fill out the PR template completely
4. Link related issues (if any)
5. Wait for CI checks to pass
6. Respond to review feedback

### PR Title Format

```
type(scope): brief description

Examples:
feat(auth): add password reset functionality
fix(booking): resolve race condition in seat selection
docs(readme): update installation instructions
test(events): add integration tests for event creation
```

### Review Process

- All PRs require at least one approval
- CI pipeline must pass (tests, linting, build)
- Merge conflicts must be resolved
- Changes requested must be addressed

## Coding Standards

### Backend (JavaScript/Node.js)

```javascript
// Use ES6+ features
const { data } = await fetchData();

// Async/await over callbacks
async function bookSlot(slotId, userId) {
  const slot = await Slot.findById(slotId);
  // ...
}

// Error handling with catchAsync utility
const createEvent = catchAsync(async (req, res, next) => {
  // Implementation
});

// Use logger, not console
logger.info('Booking created', { bookingId, userId });
logger.error('Failed to process payment', { error: err.message });

// Descriptive variable names
const availableSeatsCount = slot.capacity - slot.bookedSeats;

// Comments for complex logic only
// Calculate next available slot using dynamic programming approach
```

### Frontend (React/JavaScript)

```javascript
// Functional components with hooks
const EventCard = ({ event, onBook }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Early returns for loading/error states
  if (!event) return null;
  
  return (
    <div className="event-card">
      {/* Component content */}
    </div>
  );
};

// Custom hooks for reusable logic
const useBooking = (eventId) => {
  const [booking, setBooking] = useState(null);
  // ...
  return { booking, createBooking, cancelBooking };
};

// PropTypes or TypeScript (TypeScript preferred for new files)
EventCard.propTypes = {
  event: PropTypes.object.isRequired,
  onBook: PropTypes.func.isRequired,
};
```

### General Guidelines

- Keep functions small and focused (single responsibility)
- Avoid deep nesting (max 3 levels)
- Use meaningful variable names (no `x`, `temp`, `data1`)
- Write self-documenting code
- Add JSDoc comments for public APIs
- Use constants for magic numbers
- Prefer composition over inheritance

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc)
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config)
- `ci`: CI/CD changes

### Examples

```bash
# Simple change
git commit -m "feat(auth): add email verification"

# With body
git commit -m "fix(booking): prevent race condition in concurrent bookings

- Add database-level transaction for slot booking
- Implement optimistic locking with version field
- Add retry logic for failed transactions

Closes #123"

# Breaking change
git commit -m "feat(api)!: change booking API response format

BREAKING CHANGE: Booking response now returns nested 'data' object
instead of flat structure. Update client code accordingly."
```

## Project-Specific Guidelines

### Backend Modules

When adding new modules:
```
src/modules/your-module/
├── your-module.model.js      # Mongoose schema
├── your-module.controller.js # Request handlers
├── your-module.service.js    # Business logic (optional)
├── your-module.routes.js     # Route definitions
└── your-module.validation.js # Zod schemas
```

### API Endpoints

- Use RESTful conventions
- Version APIs: `/api/v1/resource`
- Use plural nouns: `/api/v1/events` not `/api/v1/event`
- Nested resources: `/api/v1/events/:id/bookings`

### Error Handling

```javascript
// Use AppError for operational errors
throw new AppError('Slot not found', 404);

// Use catchAsync for async route handlers
const getEvent = catchAsync(async (req, res, next) => {
  // Implementation
});

// Let globalErrorHandler catch programming errors
```

### Database Queries

```javascript
// Use transactions for multi-step operations
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Slot.updateOne({...}, { session });
  await Booking.create([{...}], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}

// Use pagination for list endpoints
const features = new APIFeatures(Model.find(), req.query)
  .filter()
  .sort()
  .limitFields()
  .paginate();
```

## Documentation

### Update Documentation When:
- Adding new features
- Changing API endpoints
- Modifying environment variables
- Updating dependencies
- Changing deployment process

### Documentation Files to Update:
- `README.md` - High-level overview
- `ARCHITECTURE.md` - System design changes
- `SECURITY.md` - Security-related changes
- `venue-backend/README.md` - Backend-specific changes
- `venue-frontend/README.md` - Frontend-specific changes
- API documentation (Swagger/JSDoc)

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create an Issue with bug report template
- **Feature Requests**: Create an Issue with feature request template
- **Security**: See [SECURITY.md](SECURITY.md)

## Recognition

Contributors will be recognized in:
- GitHub Contributors list
- Release notes (for significant contributions)
- README acknowledgments section (optional)

## License

By contributing to VENUE, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to VENUE!** 🎉
