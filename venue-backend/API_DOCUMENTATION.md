# VENUE API Documentation

Base URL: `http://localhost:5000/api/v1`

## Authentication

### Register User
**POST** `/auth/register`

registers a new user or organizer.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "USER" // Optional. 'USER' or 'ORGANIZER'. Default is likely USER.
}
```

### Login
**POST** `/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Events

### Get All Events
**GET** `/events`

Returns a list of all events. Public access.

### Create Event
**POST** `/events`
**Auth Required**: YES (Role: ADMIN, ORGANIZER)

**Body:**
```json
{
  "title": "Summer Concert",
  "description": "A great summer concert.",
  "startDate": "2023-12-01T10:00:00Z",
  "endDate": "2023-12-01T22:00:00Z",
  "slotDuration": 60, // in minutes
  "capacityPerSlot": 100
}
```

## Movies

### Get All Movies
**GET** `/movies`

Returns a list of all movies. Public access.

### Create Movie
**POST** `/movies`
**Auth Required**: YES (Role: ADMIN, ORGANIZER)

**Body:**
```json
{
  "title": "Inception",
  "description": "A mind-bending thriller",
  "posterUrl": "http://...",
  "releaseDate": "2010-07-16",
  "duration": 148 // minutes
}
```

## Bookings

### Book a Ticket
**POST** `/bookings`
**Auth Required**: YES (Role: USER)

**Body:**
```json
{
  "slotId": "651a...", // ID of the specific slot
  "quantity": 2 // Optional, default 1
}
```

### Cancel Booking
**PATCH** `/bookings/{id}/cancel`
**Auth Required**: YES (Role: USER)

Cancels a booking and potentially promotes a user from the waitlist.
