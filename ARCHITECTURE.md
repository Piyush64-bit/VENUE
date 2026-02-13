# VENUE: System Architecture

## Core Design Patterns

VENUE follows a **Modular Monolith** pattern with **Domain-Driven Design (DDD)** influences, optimized for high-concurrency booking operations and real-time state synchronization. The architecture enforces clear separation of concerns while maintaining the operational simplicity of a unified codebase.

## 1. User Booking Workflow

The booking process is the core user journey, involving complex state management and concurrency checks.

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client (FE)
    participant A as API (Backend)
    participant DB as MongoDB
    participant R as Redis
    participant S as Socket.IO

    U->>C: Select Seats/Slot
    C->>A: POST /bookings/hold-seats
    A->>R: SETEX hold_key (5m)
    R-->>A: OK / Exists (Error)
    A-->>C: 200 OK (Seats Held)

    U->>C: Confirm Payment & Book
    C->>A: POST /bookings/confirm
    A->>DB: Start Transaction
    A->>DB: Check Availability & Deduct Capacity
    A->>DB: Create Booking Record
    A->>DB: Commit Transaction
    DB-->>A: Success
    A->>R: DEL hold_key
    A->>S: Broadcast avoid(capacity_update)
    A-->>C: 201 Created (Booking Confirmed)
    S-->>U: Update Seat Map (Real-time)
```

## 2. Organizer Event Creation Workflow

Organizers follow a structured flow to create events and generate time slots automatically.

```mermaid
flowchart TD
    start[Start: Organizer Dashboard] --> check{Event Type?}
    check -->|Movie| select_movie[Select Movie from Tech Specs]
    check -->|Concert/Play| create_details[Enter Event Details]

    select_movie --> set_schedule[Set Schedule & Venue]
    create_details --> set_schedule

    set_schedule --> upload_assets[Upload Banner/Images]
    upload_assets --> validate[Validate Inputs]

    validate -->|Invalid| error[Show Error] --> set_schedule
    validate -->|Valid| submit[Submit to API]

    submit --> db_save[Save Event to MongoDB]
    db_save --> generate_slots[Auto-Generate Time Slots]
    generate_slots --> success[Emulate Success & Redirect]
```

## 3. System Architecture Diagram

```mermaid
graph TD
    Client[Client (React SPA)]
    LB[Load Balancer / Nginx]
    API[API Server (Express)]
    Socket[Socket.IO Server]
    DB[(MongoDB Primary)]
    Redis[(Redis Cache)]

    Client -->|HTTP/REST| LB
    Client -->|WebSocket| Socket
    LB --> API
    API -->|Read/Write| DB
    API -->|Cache/Rate Limit| Redis
    Socket -->|Pub/Sub| Redis
```

## 4. Module Organization

### Backend Module Architecture

The backend follows a **Controller-Service-Model (CSM)** pattern with middleware-based cross-cutting concerns:

```
src/
├── modules/                    # Domain-driven feature modules
│   ├── auth/                  # Authentication & credential management
│   │   ├── auth.controller.js # Request handlers
│   │   ├── auth.service.js    # Business logic
│   │   ├── auth.routes.js     # Route definitions
│   │   └── auth.validation.js # Input schemas (Zod)
│   ├── bookings/              # Booking transactions & concurrency
│   │   ├── booking.controller.js
│   │   ├── booking.model.js   # MongoDB schema
│   │   └── booking.routes.js
│   ├── events/                # Event lifecycle management
│   │   ├── event.controller.js
│   │   ├── event.model.js
│   │   ├── event.service.js
│   │   └── event.routes.js
│   ├── organizer/             # Organizer-specific operations
│   ├── slots/                 # Time slot generation
│   ├── users/                 # User profile management
│   └── waitlist/              # Queue management
│
├── middlewares/               # Cross-cutting middleware
│   ├── verifyToken.js        # JWT authentication
│   ├── checkRole.js          # Role-based authorization
│   ├── rateLimiter.js        # Redis-backed rate limiting
│   ├── validateRequest.js    # Zod schema validation
│   ├── globalErrorHandler.js # Centralized error handling
│   ├── requestId.middleware.js # Request correlation tracking
│   └── cache.middleware.js   # Response caching
│
├── config/                    # External service initialization
│   ├── db.js                 # MongoDB connection
│   ├── cloudinary.js         # Media storage service
│   ├── logger.js             # Structured logging
│   └── swagger.js            # OpenAPI documentation
│
├── services/                  # Shared business logic
│   ├── email.service.js      # Email delivery abstraction
│   └── redis.service.js      # Cache & pub/sub client
│
└── utils/                     # Helper utilities
    ├── APIFeatures.js        # Query pagination/filtering
    ├── AppError.js           # Standardized error class
    └── generateSlots.js      # Algorithmic slot generation
```

### Frontend Component Architecture

```
src/
├── pages/                     # Route-level page components
│   └── organizer/            # Organizer portal pages
│
├── components/               # Reusable UI components
│   ├── layout/              # Layout abstractions (Navbar, etc.)
│   ├── organizer/           # Organizer-specific components
│   └── ui/                  # Generic component library
│
├── api/                     # API service layer (Axios)
│   ├── axios.js            # Interceptor & base config
│   ├── user.js             # User endpoints
│   ├── movies.js           # Movie endpoints
│   └── organizer.js        # Organizer endpoints
│
├── context/                # Application state machine
│   └── AuthContext.jsx     # Authentication state provider
│
├── routes/                 # Routing configuration
│   └── AppRoutes.jsx       # Route definitions
│
├── socket/                 # Real-time communication
│   └── socket.js          # Socket.IO client initialization
│
└── lib/                   # Shared utilities
    ├── utils.js           # Helper functions
    └── validation.js      # Zod validation schemas
```

## 5. Security Architecture & Traffic Management

### Distributed Rate Limiting (6-Tier Strategy)

The system employs a multi-layered defense strategy implemented via Redis-backed middleware:

1.  **Global API Shield**: High-level protection against massive DDoS attempts.
2.  **Auth Brute-Force Protection**: 15-minute lockout strategy for failed login attempts.
3.  **Scraping Prevention**: Dynamic throttling for public READ operations.
4.  **Authenticated User Limits**: Tiered quotas for active user sessions.
5.  **Write Operation Throttle**: Mutation-specific limits to prevent state exhaustion.
6.  **Booking Burst Guard**: Specific 60-second window limits for the critical booking path.

### Identity & Access Management

- **Persistence**: Stateless JWTs stored in secure, `HttpOnly` and `SameSite: Strict` cookies.
- **Verification**: Middleware-based verification that refreshes user state from the primary DB to ensure immediate revocation of access upon account changes.
- **RBAC**: Recursive role checking for complex organizer/admin permissions.

## 6. Concurrency & Data Integrity

### Atomic Booking Engine

To prevent overbooking and "lost updates" in high-demand scenarios:

1.  **Transactional Integrity**: Uses MongoDB's `session.withTransaction` for ACID compliance during seat/slot deduction.
2.  **Pessimistic Validation**: Every booking attempt re-validates the _current_ state of truth in the database within the lock of a transaction before committing the reservation.
3.  **Eventual Consistency (State Sync)**: Successful transactions trigger asynchronous broadcasts via Socket.IO to update all connected clients, minimizing stale-state conflicts.

## 7. Request Flow & Observability

### Structured Request Correlation

All operations are tracked end-to-end using unique request IDs:

- A `requestId` is generated/extracted from headers at the entry point
- This ID is injected into every database query, cache operation, and log entry
- Enables full-stack distributed tracing across async operations

### Logging Architecture

The system uses Winston for structured JSON logging with environment-aware output:

- **Local Development**: Color-coded pretty-print for rapid debugging
- **Production**: Newline-delimited JSON format for ingestion into log aggregation systems (ELK, CloudWatch)
- All logs include: timestamp, request ID, service layer, operation type, and context data
