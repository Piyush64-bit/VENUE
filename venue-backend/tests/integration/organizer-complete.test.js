const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Event = require('../../src/modules/events/event.model');
const Movie = require('../../src/modules/movies/movie.model');
const Slot = require('../../src/modules/slots/slot.model');
const Booking = require('../../src/modules/bookings/booking.model');
const { hashPassword } = require('../../src/utils/passwordHasher');
const { generateTestToken, createTestUser } = require('../helpers');

describe('Organizer Integration Tests - Complete Coverage', () => {
  let organizerToken;
  let organizerId;
  let testEvent;
  let testMovie;
  let testSlot;

  beforeEach(async () => {
    // Create organizer user
    const hashedPassword = await hashPassword('OrganizerPass123!');
    const organizer = await User.create({
      name: 'Event Organizer',
      email: 'organizer@test.com',
      password: hashedPassword,
      role: 'ORGANIZER',
    });
    organizerId = organizer._id;
    organizerToken = generateTestToken({
      userId: organizer._id.toString(),
      role: 'ORGANIZER',
    });

    // Create test event
    testEvent = await Event.create({
      title: 'Test Concert',
      description: 'A test concert',
      category: 'Music',
      location: 'Test Arena',
      organizerId: organizerId,
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      price: 100,
      status: 'ACTIVE',
      isPublished: true,
    });

    // Create test slot
    testSlot = await Slot.create({
      parentType: 'Event',
      parentId: testEvent._id,
      capacity: 100,
      availableSeats: 100,
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      startTime: '20:00',
      endTime: '23:00',
      status: 'AVAILABLE',
    });
  });

  /* ======================================================
     PROFILE & SETTINGS
     ====================================================== */

  describe('GET /api/v1/organizer/profile', () => {
    it('should get organizer profile', async () => {
      const response = await request(app)
        .get('/api/v1/organizer/profile')
        .set('Cookie', [`token=${organizerToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe('organizer@test.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/organizer/profile')
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    it('should fail with non-organizer role', async () => {
      const userToken = generateTestToken({
        userId: organizerId.toString(),
        role: 'USER',
      });

      const response = await request(app)
        .get('/api/v1/organizer/profile')
        .set('Cookie', [`token=${userToken}`])
        .expect(403);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/v1/organizer/profile', () => {
    it('should update organizer profile', async () => {
      const response = await request(app)
        .patch('/api/v1/organizer/profile')
        .set('Cookie', [`token=${organizerToken}`])
        .send({
          name: 'Updated Organizer Name',
          email: 'newemail@test.com',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe('Updated Organizer Name');
      expect(response.body.data.email).toBe('newemail@test.com');
    });

    it('should fail with duplicate email', async () => {
      // Create another user with email
      await User.create({
        name: 'Other User',
        email: 'existing@test.com',
        password: await hashPassword('password'),
        role: 'USER',
      });

      const response = await request(app)
        .patch('/api/v1/organizer/profile')
        .set('Cookie', [`token=${organizerToken}`])
        .send({
          email: 'existing@test.com',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Email already in use');
    });

    it('should allow updating name without changing email', async () => {
      const response = await request(app)
        .patch('/api/v1/organizer/profile')
        .set('Cookie', [`token=${organizerToken}`])
        .send({
          name: 'Just Name Update',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Just Name Update');
      expect(response.body.data.email).toBe('organizer@test.com');
    });
  });

  describe('PATCH /api/v1/organizer/password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .patch('/api/v1/organizer/password')
        .set('Cookie', [`token=${organizerToken}`])
        .send({
          currentPassword: 'OrganizerPass123!',
          newPassword: 'NewSecurePass456!',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Password changed');
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .patch('/api/v1/organizer/password')
        .set('Cookie', [`token=${organizerToken}`])
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewSecurePass456!',
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Current password is incorrect');
    });
  });

  /* ======================================================
     DASHBOARD STATS
     ====================================================== */

  describe('GET /api/v1/organizer/stats', () => {
    it('should get organizer statistics', async () => {
      // Create a booking for stats
      const user = await createTestUser();
      await Booking.create({
        userId: user._id,
        slotId: testSlot._id,
        quantity: 5,
        seats: ['A1', 'A2', 'A3', 'A4', 'A5'],
        status: 'CONFIRMED',
        parentType: 'Event',
        parentId: testEvent._id,
      });

      const response = await request(app)
        .get('/api/v1/organizer/stats')
        .set('Cookie', [`token=${organizerToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('totalEvents');
      expect(response.body.data).toHaveProperty('totalMovies');
      expect(response.body.data).toHaveProperty('totalTicketsSold');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data.totalEvents).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalTicketsSold).toBe(5);
    });

    it('should return zero stats for new organizer with no content', async () => {
      // Create new organizer with no events/movies
      const newOrg = await User.create({
        name: 'New Organizer',
        email: 'neworg@test.com',
        password: await hashPassword('password'),
        role: 'ORGANIZER',
      });
      const newOrgToken = generateTestToken({
        userId: newOrg._id.toString(),
        role: 'ORGANIZER',
      });

      const response = await request(app)
        .get('/api/v1/organizer/stats')
        .set('Cookie', [`token=${newOrgToken}`])
        .expect(200);

      expect(response.body.data.totalEvents).toBe(0);
      expect(response.body.data.totalMovies).toBe(0);
      expect(response.body.data.totalTicketsSold).toBe(0);
      expect(response.body.data.totalRevenue).toBe(0);
    });
  });

  /* ======================================================
     EVENT MANAGEMENT
     ====================================================== */

  describe('POST /api/v1/organizer/events', () => {
    it('should create a new event', async () => {
      const eventData = {
        title: 'New Music Festival',
        description: 'Amazing festival',
        category: 'Music',
        location: 'Central Park',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        price: 150,
        capacity: 500,
      };

      const response = await request(app)
        .post('/api/v1/organizer/events')
        .set('Cookie', [`token=${organizerToken}`])
        .send(eventData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('New Music Festival');
      expect(response.body.data.isPublished).toBe(false); // Default to draft
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/organizer/events')
        .set('Cookie', [`token=${organizerToken}`])
        .send({
          title: 'Incomplete Event',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/organizer/events', () => {
    it('should get all organizer events', async () => {
      const response = await request(app)
        .get('/api/v1/organizer/events')
        .set('Cookie', [`token=${organizerToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for organizer with no events', async () => {
      const newOrg = await User.create({
        name: 'New Organizer',
        email: 'neworg2@test.com',
        password: await hashPassword('password'),
        role: 'ORGANIZER',
      });
      const newOrgToken = generateTestToken({
        userId: newOrg._id.toString(),
        role: 'ORGANIZER',
      });

      const response = await request(app)
        .get('/api/v1/organizer/events')
        .set('Cookie', [`token=${newOrgToken}`])
        .expect(200);

      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/v1/organizer/events/:id', () => {
    it('should get event by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/organizer/events/${testEvent._id}`)
        .set('Cookie', [`token=${organizerToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data._id).toBe(testEvent._id.toString());
    });

    it('should fail with invalid event ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/organizer/events/${fakeId}`)
        .set('Cookie', [`token=${organizerToken}`])
        .expect(404);

      expect(response.body.status).toBe('fail');
    });

    it('should fail when accessing another organizer event', async () => {
      const otherOrg = await User.create({
        name: 'Other Organizer',
        email: 'other@test.com',
        password: await hashPassword('password'),
        role: 'ORGANIZER',
      });
      const otherOrgToken = generateTestToken({
        userId: otherOrg._id.toString(),
        role: 'ORGANIZER',
      });

      const response = await request(app)
        .get(`/api/v1/organizer/events/${testEvent._id}`)
        .set('Cookie', [`token=${otherOrgToken}`])
        .expect(404);

      expect(response.body.message).toContain('access denied');
    });
  });

  describe('PATCH /api/v1/organizer/events/:id', () => {
    it('should update event', async () => {
      const response = await request(app)
        .patch(`/api/v1/organizer/events/${testEvent._id}`)
        .set('Cookie', [`token=${organizerToken}`])
        .send({
          title: 'Updated Concert Title',
          price: 120,
        })
        .expect(200);

      expect(response.body.data.title).toBe('Updated Concert Title');
      expect(response.body.data.price).toBe(120);
    });

    it('should not allow updating organizerId', async () => {
      const newOrgId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/v1/organizer/events/${testEvent._id}`)
        .set('Cookie', [`token=${organizerToken}`])
        .send({
          organizerId: newOrgId,
          title: 'Updated Title',
        })
        .expect(200);

      // organizerId should remain unchanged
      expect(response.body.data.organizerId).toBe(organizerId.toString());
    });
  });

  describe('DELETE /api/v1/organizer/events/:id', () => {
    it('should delete event without bookings', async () => {
      const newEvent = await Event.create({
        title: 'Deletable Event',
        description: 'Test',
        category: 'Music',
        location: 'Test',
        organizerId: organizerId,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        price: 50,
      });

      const response = await request(app)
        .delete(`/api/v1/organizer/events/${newEvent._id}`)
        .set('Cookie', [`token=${organizerToken}`])
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify deletion
      const deletedEvent = await Event.findById(newEvent._id);
      expect(deletedEvent).toBeNull();
    });

    it('should fail to delete event with active bookings', async () => {
      // Create booking for test event
      const user = await createTestUser();
      await Booking.create({
        userId: user._id,
        slotId: testSlot._id,
        quantity: 2,
        seats: ['B1', 'B2'],
        status: 'CONFIRMED',
        parentType: 'Event',
        parentId: testEvent._id,
      });

      const response = await request(app)
        .delete(`/api/v1/organizer/events/${testEvent._id}`)
        .set('Cookie', [`token=${organizerToken}`])
        .expect(409);

      expect(response.body.message).toContain('active bookings');
    });
  });

  describe('PATCH /api/v1/organizer/events/:id/publish', () => {
    it('should publish an event', async () => {
      const draftEvent = await Event.create({
        title: 'Draft Event',
        description: 'Test',
        category: 'Music',
        location: 'Test',
        organizerId: organizerId,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        price: 50,
        isPublished: false,
      });

      const response = await request(app)
        .patch(`/api/v1/organizer/events/${draftEvent._id}/publish`)
        .set('Cookie', [`token=${organizerToken}`])
        .send({ publish: true })
        .expect(200);

      expect(response.body.data.isPublished).toBe(true);
      expect(response.body.message).toContain('published');
    });

    it('should unpublish an event', async () => {
      const response = await request(app)
        .patch(`/api/v1/organizer/events/${testEvent._id}/publish`)
        .set('Cookie', [`token=${organizerToken}`])
        .send({ publish: false })
        .expect(200);

      expect(response.body.data.isPublished).toBe(false);
      expect(response.body.message).toContain('unpublished');
    });
  });

  /* ======================================================
     MOVIE MANAGEMENT
     ====================================================== */

  describe('POST /api/v1/organizer/movies', () => {
    it('should create a new movie', async () => {
      const movieData = {
        title: 'Test Movie',
        description: 'Great movie',
        genre: 'Action',
        releaseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        runtime: 120,
        price: 15,
      };

      const response = await request(app)
        .post('/api/v1/organizer/movies')
        .set('Cookie', [`token=${organizerToken}`])
        .send(movieData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('Test Movie');
    });
  });

  describe('GET /api/v1/organizer/movies', () => {
    beforeEach(async () => {
      testMovie = await Movie.create({
        title: 'Test Movie',
        description: 'Test',
        genre: 'Action',
        releaseDate: new Date(),
        runtime: 120,
        organizer: organizerId,
        isPublished: true,
      });
    });

    it('should get all organizer movies', async () => {
      const response = await request(app)
        .get('/api/v1/organizer/movies')
        .set('Cookie', [`token=${organizerToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/organizer/movies/:id', () => {
    beforeEach(async () => {
      testMovie = await Movie.create({
        title: 'Single Test Movie',
        description: 'Test',
        genre: 'Drama',
        releaseDate: new Date(),
        runtime: 90,
        organizer: organizerId,
        isPublished: true,
      });
    });

    it('should get movie by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/organizer/movies/${testMovie._id}`)
        .set('Cookie', [`token=${organizerToken}`])
        .expect(200);

      expect(response.body.data._id).toBe(testMovie._id.toString());
    });

    it('should fail with invalid movie ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/organizer/movies/${fakeId}`)
        .set('Cookie', [`token=${organizerToken}`])
        .expect(404);

      expect(response.body.status).toBe('fail');
    });
  });

  /* ======================================================
     BOOKINGS MANAGEMENT
     ====================================================== */

  describe('GET /api/v1/organizer/bookings', () => {
    it('should get all bookings for organizer events', async () => {
      const user = await createTestUser();
      await Booking.create({
        userId: user._id,
        slotId: testSlot._id,
        quantity: 3,
        seats: ['C1', 'C2', 'C3'],
        status: 'CONFIRMED',
        parentType: 'Event',
        parentId: testEvent._id,
      });

      const response = await request(app)
        .get('/api/v1/organizer/bookings')
        .set('Cookie', [`token=${organizerToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.results).toBeGreaterThanOrEqual(1);
    });

    it('should return empty for organizer with no bookings', async () => {
      const newOrg = await User.create({
        name: 'New Org',
        email: 'neworg3@test.com',
        password: await hashPassword('password'),
        role: 'ORGANIZER',
      });
      const newOrgToken = generateTestToken({
        userId: newOrg._id.toString(),
        role: 'ORGANIZER',
      });

      const response = await request(app)
        .get('/api/v1/organizer/bookings')
        .set('Cookie', [`token=${newOrgToken}`])
        .expect(200);

      expect(response.body.data.results).toBe(0);
    });
  });
});
