const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Event = require('../../src/modules/events/event.model');
const Movie = require('../../src/modules/movies/movie.model');
const User = require('../../src/modules/users/user.model');
const Slot = require('../../src/modules/slots/slot.model');
const { generateTestToken, createTestOrganizer, createTestUser, createTestEvent } = require('../helpers');

describe('Organizer Module', () => {
  let organizer;
  let organizerToken;
  let userToken;

  beforeEach(async () => {
    organizer = await createTestOrganizer({ email: 'organizer@test.com' });
    organizerToken = generateTestToken({ userId: organizer._id.toString(), role: 'ORGANIZER' });

    const regularUser = await createTestUser({ email: 'user@test.com' });
    userToken = generateTestToken({ userId: regularUser._id.toString(), role: 'USER' });
  });

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/organizer/events');
      expect(res.status).toBe(401);
    });

    it('should reject non-organizer role', async () => {
      const res = await request(app)
        .get('/api/v1/organizer/events')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/organizer/events', () => {
    it('should return organizer events', async () => {
      await createTestEvent(organizer._id);

      const res = await request(app)
        .get('/api/v1/organizer/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/organizer/events', () => {
    it('should create an event', async () => {
      const eventData = {
        title: 'New Concert',
        description: 'A great concert',
        category: 'Music',
        location: 'Big Arena, Test City',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        price: 100,
      };

      const res = await request(app)
        .post('/api/v1/organizer/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.title).toBe('New Concert');
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/organizer/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ title: 'Incomplete' })
        .expect(400);

      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/organizer/events/:id', () => {
    it('should return a single event', async () => {
      const event = await createTestEvent(organizer._id);

      const res = await request(app)
        .get(`/api/v1/organizer/events/${event._id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data._id).toBe(event._id.toString());
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/organizer/events/${fakeId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(res.body.status).toBe('fail');
    });
  });

  describe('DELETE /api/v1/organizer/events/:id', () => {
    it('should delete event and its slots', async () => {
      const event = await createTestEvent(organizer._id);
      await Slot.create({
        parentType: 'Event',
        parentId: event._id,
        capacity: 100,
        availableSeats: 100,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startTime: '19:00',
        endTime: '22:00',
      });

      const res = await request(app)
        .delete(`/api/v1/organizer/events/${event._id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');

      const deletedEvent = await Event.findById(event._id);
      expect(deletedEvent).toBeNull();
    });
  });

  describe('GET /api/v1/organizer/movies', () => {
    it('should return organizer movies', async () => {
      await Movie.create({
        title: 'Test Movie',
        description: 'A movie',
        genre: 'Action',
        runtime: '120',
        releaseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        organizer: organizer._id,
      });

      const res = await request(app)
        .get('/api/v1/organizer/movies')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/organizer/movies', () => {
    it('should create a movie with slots', async () => {
      const movieData = {
        title: 'New Movie',
        description: 'A new movie description',
        genre: 'Action',
        runtime: '2h 0m',
        releaseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        slots: [
          {
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            startTime: '14:00',
            endTime: '16:00',
            remainingCapacity: 50,
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/organizer/movies')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(movieData)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.title).toBe('New Movie');
    });
  });

  describe('GET /api/v1/organizer/stats', () => {
    it('should return organizer stats', async () => {
      const res = await request(app)
        .get('/api/v1/organizer/stats')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
    });
  });
});
