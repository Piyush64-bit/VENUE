# Changelog

All notable changes to VENUE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete testing infrastructure with Jest and Supertest
  - 22 comprehensive test files (11 unit, 11 integration)
  - Coverage thresholds: 75-80% across branches, functions, lines, statements
  - Test environment isolation with `.env.test`
- GitHub Actions CI/CD pipeline
  - Multi-node testing matrix (Node 18, 20)
  - MongoDB and Redis service containers
  - Code coverage reporting with Codecov
  - Docker build and Trivy security scanning
  - Dependency auditing for frontend and backend
  - Integration tests with Docker Compose
- K6 load testing suite with 9 performance test scripts
  - Booking concurrency validation
  - Rate limiter effectiveness tests
  - Load balancer testing suite (health, distribution, session, failover, stress, websocket)
  - Comprehensive documentation and quick reference guides
- Comprehensive documentation
  - TESTING.md (874 lines) - Complete testing guide
  - SETUP_GUIDE.md - Environment setup instructions
  - CONTRIBUTING.md - Contribution guidelines
  - CHANGELOG.md - Version history
  - Enhanced ARCHITECTURE.md with testing architecture section
  - Enhanced SECURITY.md with CI/CD security details
- Development tooling
  - .editorconfig for consistent code formatting
  - .nvmrc for Node.js version management (v20)
  - .huskyrc.json for git hooks configuration
  - Root-level .gitignore
- Docker load balancer configuration
  - docker-compose.loadbalancer.yml
  - nginx-lb.conf for load balancer configuration

### Changed
- Enhanced booking controller to support test environment
  - Conditional transaction handling (test vs production)
  - Authorization check fix: `req.user._id` vs `req.user.userId`
  - Allow multiple bookings per user (removed duplicate booking restriction)
- Updated rate limiter middleware
  - Skip rate limiting in test environment (`NODE_ENV=test`)
  - Skip rate limiting in load test mode (`DISABLE_RATE_LIMIT=true`)
- Enhanced ApiResponse class
  - Added `status` field for consistent response format ('success' or 'fail')
- Updated README.md
  - Added CI/CD badges (CI Pipeline, CD Pipeline, CodeQL, License, Node Version, PRs Welcome)
  - Added comprehensive testing section with commands
  - Added project structure diagram
  - Added API documentation section
  - Added deployment guide for various platforms
  - Added performance metrics section
  - Added roadmap section
  - Added contributing and acknowledgments sections
- Updated package.json
  - Added 15 npm scripts for testing and k6 load tests
  - Added testing dependencies: jest@30.2.0, supertest@7.2.2, cross-env@10.1.0
  - Fixed uuid version from ^13.0.0 to ^9.0.1

### Removed
- DOCKER_QUICK_REFERENCE.md (consolidated into other documentation)
- Duplicate booking prevention logic (intentionally removed to allow multiple bookings)

### Security
- Added comprehensive CI/CD security pipeline
  - Automated npm audit on every push
  - Trivy container scanning for vulnerabilities
  - SARIF report generation for GitHub Security
  - Test environment isolation with mandatory naming conventions
- Enhanced security documentation
  - CI/CD security automation details
  - Test environment security guarantees
  - Load testing security validation
  - Production deployment security checklist

## [1.0.0] - 2026-02-13

### Added
- Initial production hardening release
- Security enhancements
  - Multi-tier rate limiting (6-tier strategy)
  - Helmet.js security headers
  - NoSQL injection prevention
  - Input sanitization middleware
- Observability features
  - Request ID middleware for correlation tracking
  - Winston structured logging with daily rotation
  - Environment-specific log formatting
- Caching infrastructure
  - Redis-based caching middleware
  - Cache invalidation strategies
- Transaction-safe booking engine
  - MongoDB ACID transactions
  - Atomic seat decrement operations
  - Race condition prevention
- Organizer portal
  - Event creation and management
  - Image upload to Cloudinary
  - Dashboard with analytics
- Authentication & Authorization
  - JWT with HttpOnly cookies
  - Role-based access control (User, Organizer, Admin)
  - Argon2 password hashing
- API features
  - RESTful endpoints for events, movies, bookings, slots
  - Swagger/OpenAPI documentation
  - Pagination, filtering, sorting for list endpoints
- Real-time features
  - Socket.IO for live updates
  - Booking notifications
  - Seat availability updates
- Frontend
  - React 19 with Vite
  - TailwindCSS for styling
  - TanStack Query for server state management
  - React Router v7 for routing
  - Role-based UI rendering

### Changed
- Refactored backend into modular architecture
  - Separated concerns into modules (auth, events, bookings, movies, organizer, slots, users, waitlist)
  - Controller-Service-Model pattern
  - Middleware-based cross-cutting concerns
- Enhanced error handling
  - Global error handler middleware
  - Standardized error responses
  - AppError class for operational errors
- Improved CORS configuration
  - Dynamic origin whitelisting from environment variables
  - Proper credentials handling
- Updated database connection
  - Environment-based configuration
  - Retry logic and connection pooling
- Redesigned frontend UI/UX
  - EventDetails page redesign
  - Movie routing improvements
  - Favorites UI updates
  - Checkout flow enhancements

### Fixed
- Movie routing in frontend
- Booking flow bugs
  - Populate booking details correctly
  - Add mock payment IDs
  - Fix checkout UI (currency, dates, images)
- Auth verification in middleware
  - Verify user existence in database
  - Remove deprecated xss-clean package

## [0.1.0] - 2026-01-15

### Added
- Basic project structure
- Express.js backend setup
- React frontend setup
- MongoDB integration
- Redis integration
- Basic authentication (login, register)
- Event and movie models
- Booking system prototype

[Unreleased]: https://github.com/YOUR_USERNAME/VENUE/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR_USERNAME/VENUE/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/YOUR_USERNAME/VENUE/releases/tag/v0.1.0
