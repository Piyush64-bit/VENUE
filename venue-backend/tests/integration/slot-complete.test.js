const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Slot = require('../../src/modules/slots/slot.model');
const Event = require('../../src/modules/events/event.model');
const Movie = require('../../src/modules/movies/movie.model');
const User = require('../../src/modules/users/user.model');
const { hashPassword } = require('../../src/utils/passwordHasher');
const { generateTestToken } = require('../helpers');

describe('Slot Integration Tests - Complete Coverage', () => {
  let userToken;
  let testEvent;
  let testMovie;
  let eventSlot;
  let movieSlot;
  let organizerId;

  beforeEach(async () => {
    // Create organizer
    const hashedPassword = await hashPassword('Password123!');
    const organizer = await User.create({
      name: 'Organizer',
      email: 'org@test.com',
      password: hashedPassword,
      role: 'ORGANIZER',
    });
    organizerId = organizer._id;

    // Create user
    const user = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'USER',
    });
    userToken = generateTestToken({
      userId: user._id.toString(),
      role: 'USER',
    });

    // Create test event
    testEvent = await Event.create({
      title: 'Test Event',
      description: 'Test',
      category: 'Music',
      location: 'Test Venue',
      organizerId: organizerId,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      price: 50,
      isPublished: true,
    });

    // Create test movie
    testMovie = await Movie.create({
      title: 'Test Movie',
      description: 'Test',
      genre: 'Action',
      releaseDate: new Date(),
      runtime: 120,
      organizer: organizerId,
      isPublished: true,
    });

    // Create event slot
    eventSlot = await Slot.create({
      parentType: 'Event',
      parentId: testEvent._id,
      capacity: 100,
      availableSeats: 100,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '18:00',
      endTime: '21:00',
      status: 'AVAILABLE',
    });

    // Create movie slot
    movieSlot = await Slot.create({
      parentType: 'Movie',
      parentId: testMovie._id,
      capacity: 50,
      availableSeats: 50,
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      startTime: '14:00',
      endTime: '17:00',
      status: 'AVAILABLE',
    });
  });

  /* ======================================================
     GET EVENT SLOTS
     ====================================================== */

  describe('GET /api/v1/events/:id/slots', () => {
    it('should get all slots for an event', async () => {
      const response = await request(app)
        .get(`/api/v1/events/${testEvent._id}/slots`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.slots)).toBe(true);
      expect(response.body.data.slots.length).toBeGreaterThanOrEqual(1);
    });

    it('should only return available event slots', async () => {
      // Create a sold out slot
      await Slot.create({
        parentType: 'Event',
        parentId: testEvent._id,
        capacity: 50,
        availableSeats: 0, // Sold out
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        startTime: '20:00',
        endTime: '23:00',
        status: 'FULL',
      });

      const response = await request(app)
        .get(`/api/v1/events/${testEvent._id}/slots`)
        .expect(200);

      const slots = response.body.data.slots;
      // Should only return available slots (availableSeats > 0)
      slots.forEach(slot => {
        expect(slot.availableSeats).toBeGreaterThan(0);
      });
    });

    it('should sort slots by date and time', async () => {
      // Create additional slots
      await Slot.create({
        parentType: 'Event',
        parentId: testEvent._id,
        capacity: 80,
        availableSeats: 80,
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        startTime: '15:00',
        endTime: '18:00',
        status: 'AVAILABLE',
      });

      await Slot.create({
        parentType: 'Event',
        parentId: testEvent._id,
        capacity: 80,
        availableSeats: 80,
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '13:00',
        status: 'AVAILABLE',
      });

      const response = await request(app)
        .get(`/api/v1/events/${testEvent._id}/slots`)
        .expect(200);

      const slots = response.body.data.slots;
      
      // Verify chronological order
      for (let i = 0; i < slots.length - 1; i++) {
        const currentDate = new Date(slots[i].date).getTime();
        const nextDate = new Date(slots[i + 1].date).getTime();
        expect(currentDate).toBeLessThanOrEqual(nextDate);
      }
    });

    it('should fail with non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/events/${fakeId}/slots`)
        .expect(404);

      expect(response.body.status).toBe('fail');
    });

    it('should fail when event is not published', async () => {
      const unpublishedEvent = await Event.create({
        title: 'Unpublished Event',
        description: 'Test',
        category: 'Sports',
        location: 'Test',
        organizerId: organizerId,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        price: 40,
        isPublished: false,
      });

      const response = await request(app)
        .get(`/api/v1/events/${unpublishedEvent._id}/slots`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  /* ======================================================
     GET MOVIE SLOTS
     ====================================================== */

  describe('GET /api/v1/movies/:id/slots', () => {
    it('should get all slots for a movie', async () => {
      const response = await request(app)
        .get(`/api/v1/movies/${testMovie._id}/slots`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.slots.length).toBeGreaterThanOrEqual(1);
    });

    it('should only return available movie slots', async () => {
      // Create full slot
      await Slot.create({
        parentType: 'Movie',
        parentId: testMovie._id,
        capacity: 40,
        availableSeats: 0,
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        startTime: '18:00',
        endTime: '21:00',
        status: 'FULL',
      });

      const response = await request(app)
        .get(`/api/v1/movies/${testMovie._id}/slots`)
        .expect(200);

      const slots = response.body.data.slots;
      slots.forEach(slot => {
        expect(slot.availableSeats).toBeGreaterThan(0);
      });
    });
  });

  /* ======================================================
     EDGE CASES
     ====================================================== */

  describe('Slot Edge Cases', () => {
    it('should handle slots with matching dates and times', async () => {
      const slotDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      
      await Slot.create({
        parentType: 'Event',
        parentId: testEvent._id,
        capacity: 100,
        availableSeats: 100,
        date: slotDate,
        startTime: '18:00',
        endTime: '21:00',
        status: 'AVAILABLE',
      });

      await Slot.create({
        parentType: 'Event',
        parentId: testEvent._id,
        capacity: 100,
        availableSeats: 100,
        date: slotDate,
        startTime: '18:00',
        endTime: '21:00',
        status: 'AVAILABLE',
      });

      const response = await request(app)
        .get(`/api/v1/events/${testEvent._id}/slots`)
        .expect(200);

      const matchingSlots = response.body.data.slots.filter(
        s => s.startTime === '18:00'
      );
      expect(matchingSlots.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle slots with minimum capacity', async () => {
      const minCapSlot = await Slot.create({
        parentType: 'Event',
        parentId: testEvent._id,
        capacity: 1,
        availableSeats: 0,
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '12:00',
        status: 'FULL',
      });

      const dbSlot = await Slot.findById(minCapSlot._id);
      expect(dbSlot.capacity).toBe(1);
      expect(dbSlot.availableSeats).toBe(0);
    });
  });
});
