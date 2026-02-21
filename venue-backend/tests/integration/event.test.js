const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Event = require('../../src/modules/events/event.model');
const Slot = require('../../src/modules/slots/slot.model');
const User = require('../../src/modules/users/user.model');
const { generateTestToken, createTestUser, createTestOrganizer, createTestEvent } = require('../helpers');

describe('Event Module (Public)', () => {
  let organizer;
  let testEvent;

  beforeEach(async () => {
    organizer = await createTestOrganizer({ email: 'organizer@test.com' });

    testEvent = await Event.create({
      title: 'Published Concert',
      description: 'A great event',
      category: 'Music',
      location: 'Test Venue, Test City',
      organizerId: organizer._id,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      price: 100,
      isPublished: true,
    });
  });

  describe('GET /api/v1/events', () => {
    it('should return all published events', async () => {
      const res = await request(app).get('/api/v1/events').expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.events.length).toBeGreaterThanOrEqual(1);
    });

    it('should not return unpublished events', async () => {
      await Event.create({
        title: 'Unpublished Event',
        description: 'Draft',
        category: 'Music',
        location: 'Test',
        organizerId: organizer._id,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        price: 50,
        isPublished: false,
      });

      const res = await request(app).get('/api/v1/events').expect(200);

      const unpublished = res.body.data.events.find(e => e.title === 'Unpublished Event');
      expect(unpublished).toBeUndefined();
    });
  });

  describe('GET /api/v1/events/:id', () => {
    it('should return event details', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${testEvent._id}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.event._id).toBe(testEvent._id.toString());
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/events/${fakeId}`)
        .expect(404);

      expect(res.body.status).toBe('fail');
    });

    it('should return 400 for invalid event ID', async () => {
      const res = await request(app)
        .get('/api/v1/events/invalid-id')
        .expect(400);

      expect(res.body.status).toBe('fail');
    });
  });
});
