# VENUE: Event & Movie Booking Platform

A full-stack booking platform built to handle concurrent reservations, real-time inventory updates, and multi-tenant event management. This project tackles the classic distributed systems problem: preventing double-bookings when multiple users attempt to reserve the same resource simultaneously.

## The Problem

Building a booking system that doesn't oversell is harder than it looks. When 100 users try to book the last 10 seats at once, naive implementations either:
- Allow overbooking (bad user experience)
- Lock the entire system (terrible performance)
- Rely on optimistic updates that fail frequently (frustrating UX)

VENUE solves this using database-level transactions combined with atomic decrements, ensuring inventory accuracy without sacrificing responsiveness.

## What I Built

### 1. Transaction-Safe Booking Engine

The core booking flow uses MongoDB's ACID transactions to guarantee consistency:

```javascript
// Atomic capacity check + decrement in a single operation
const slot = await Slot.findOneAndUpdate(
  { _id: slotId, availableSeats: { $gte: quantity } },
  { $inc: { availableSeats: -quantity } },
  { new: true, session }
);
```

If the slot doesn't have enough capacity, the update fails and the transaction rolls back. No race conditions, no overbooking. The transaction wraps the entire operation—from validation to booking record creation—so either everything succeeds or nothing changes.

### 2. Multi-Tier Rate Limiting

Instead of a single global rate limit, I implemented a layered defense strategy using Redis:

- **Global API Shield**: 1000 requests/hour per IP to prevent DDoS
- **Auth Endpoint Protection**: 5 attempts/15min to prevent brute-force
- **Authenticated User Quotas**: 100 requests/15min per user ID
- **Booking-Specific Limits**: 10 attempts/minute for the critical booking path

Each tier uses Redis for distributed state, so rate limits work correctly even with multiple server instances. The middleware uses custom key generation—falling back from user ID to IP address depending on authentication state.

### 3. Algorithmic Slot Generation

Organizers configure events with date ranges, time windows, and capacity. The system generates individual bookable slots automatically:

```javascript
// Generates slots day-by-day, hour-by-hour based on duration
for (let currentDate = start; currentDate <= end; currentDate++) {
  for (let hours = 0; hours < 24; hours += slotDuration) {
    if (slotStart >= start && slotEnd <= end) {
      slots.push({ date, startTime, endTime, capacity });
    }
  }
}
```

This converts high-level event specs into thousands of individually manageable time slots, each with its own capacity tracking and booking state.

### 4. Request Correlation & Observability

Every incoming request gets a unique ID that flows through the entire execution path—from initial HTTP request, through database queries, to external service calls. When debugging production issues, I can trace a single user's booking attempt through every layer of the system.

Winston logs are structured as JSON in production, making them machine-parseable for log aggregators, but switch to color-coded pretty-print locally for rapid debugging.

### 5. Real-Time State Synchronization

When a booking succeeds, Socket.IO broadcasts updates to all connected clients viewing that event. Users see capacity changes in real-time without polling or page refreshes. The socket server uses room-based targeting so updates only go to relevant users, not the entire connected population.

### 6. Modular Backend Architecture

The backend follows a Controller-Service-Model pattern with middleware-based cross-cutting concerns:

- **Controllers**: Handle HTTP requests, validation, and response formatting
- **Services**: Contain business logic and orchestrate between models
- **Models**: Define data schemas and database interactions
- **Middleware**: JWT auth, RBAC, rate limiting, request validation (Zod schemas)

This separation means I can test business logic without spinning up Express, and swap out auth strategies without touching booking code.

### 7. Server State Management on Frontend

Instead of Redux or Zustand, I used TanStack Query for server state. It handles:
- Automatic background refetching
- Cache invalidation after mutations
- Optimistic updates with automatic rollback on failure
- Request deduplication when multiple components need the same data

React Context holds only authentication state—everything else comes from the server through React Query's caching layer.

## Technical Stack

**Backend**: Node.js, Express, MongoDB (Mongoose), Redis, Socket.IO  
**Frontend**: React 19, Vite, TailwindCSS, TanStack Query, React Router v7  
**DevOps**: Docker Compose for local development environment parity  
**Security**: JWT (HttpOnly cookies), Helmet, CORS, Zod validation, express-mongo-sanitize

## Running Locally

### Quick Start (Docker)

```bash
# Clone and start all services
docker compose up --build
```

The backend runs on `localhost:5000`, frontend on `localhost:3000`. Swagger API docs available at `/docs`.

### Manual Setup

Requires Node.js (LTS) and either Docker for MongoDB/Redis, or local instances.

1. Configure environment variables:
```bash
cd venue-backend
cp .env.example .env
# Edit .env with your MongoDB and Redis connection strings
```

2. Start backend:
```bash
cd venue-backend
npm install
npm run dev
```

3. Start frontend:
```bash
cd venue-frontend
npm install
npm run dev
```

## Architecture

For system design details, sequence diagrams, and data flow documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## What I Learned

Building this taught me that distributed systems problems show up earlier than you'd expect. Even a single-server application needs to think about concurrency when multiple requests hit the same resource. Database transactions aren't just for banks—they're essential for any system where consistency matters more than absolute peak throughput.

Rate limiting is also more nuanced than "N requests per minute." Different endpoints have different risk profiles, and a sophisticated system needs layered protection with context-aware limits.

## License

MIT License - see [LICENSE](LICENSE) for details.
