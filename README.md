# VENUE 

A production-grade event and movie booking platform demonstrating full-stack system design, robust backend engineering, and modern frontend architecture.

VENUE is built to handle real-world challenges: concurrent bookings, capacity management, role-based access control, and seamless user experiences at scale. Inspired by modern event platforms, it combines backend reliability with frontend polish.



---

## Key Features

### Backend Engineering
- **JWT-based Authentication** – Secure, stateless authentication with token-based access
- **Role-Based Access Control** – Multi-tier permissions (Admin, Organizer, User) with fine-grained authorization checks
- **Organizer Portal** – Dedicated dashboard for event creation, image uploads, and management
- **Automatic Slot Generation** – Intelligent slot scheduling algorithm for event time windows
- **Concurrency-Safe Booking System** – Race condition handling, atomic operations, and capacity constraints
- **Waitlist Management** – Graceful handling of full slots with automatic promotion logic
- **Modular Clean Architecture** – Separation of concerns with controllers, models, routes, and utilities

### Frontend Experience
- **React-Based UI** – Component-driven, scalable frontend architecture
- **Organizer Dashboard** – Comprehensive interface for managing events and bookings
- **Responsive & Intuitive Design** – Mobile-first approach with smooth, predictable interactions
- **Performance-Focused** – Optimized asset loading, efficient state management, and smooth animations

---

## Architecture

For a deep dive into the system architecture, tech stack, and design decisions, please read [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## What This Project Demonstrates

**For Backend**: Production-grade API design with attention to security (JWT, role-based middleware), data consistency (concurrent operations, transactions), and system scalability (modular architecture, clean separation of concerns).

**For Frontend**: Modern React patterns with a focus on UX polish, responsive design, and performance optimization.

**Overall**: A complete, deployable system that bridges the gap between engineering rigor and user experience.

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Architecture**: Modular, controller-based structure

### Frontend
- **Framework**: React
- **Styling**: TailwindCSS / Responsive Design
- **State Management**: React Query / Context API

---

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md#4-directory-structure) for the detailed directory structure.

---

## Current Status

✅ **Backend**: Core API complete, including Auth, RBAC, Bookings, and modular Organizer features  
🚀 **Frontend**: Main user flows and Organizer Portal fully implemented  
📋 **Next Phase**: Enhanced UX with animations and performance optimization

---

## Getting Started

### Backend Setup
```bash
cd venue-backend
npm install
npm start
```

### Frontend Setup
```bash
cd venue-frontend
npm install
npm start
```

---

## Deployment Checklist

### Environment Variables
Ensure the following variables are set in your production environment (e.g., Render, Vercel):

- `NODE_ENV`: `production`
- `BASE_URL`: Your backend URL (e.g., `https://venue-z8ti.onrender.com`)
- `FRONTEND_URL`: Your frontend URL (e.g., `https://venueapp.vercel.app`)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins (e.g., `https://venueapp.vercel.app`)



## License

See [LICENSE](LICENSE) for details.
