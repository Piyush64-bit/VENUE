const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Event = require('../../src/modules/events/event.model');
const Movie = require('../../src/modules/movies/movie.model');
const Slot = require('../../src/modules/slots/slot.model');
const Booking = require('../../src/modules/bookings/booking.model');
const User = require('../../src/modules/users/user.model');
const { generateTestToken, createTestUser } = require('../helpers');

describe('Slot Integration Tests', () => {
  let userToken;
  let eventId;
  let movieId;
  let eventSlotId;
  let movieSlotId;

  beforeEach(async () => {
    // Create test user
    const user = await createTestUser();
    userToken = generateTestToken({
      userId: user._id.toString(),
      role: 'USER',
    });

    // Create test event
    const organizer = await createTestUser({
      role: 'ORGANIZER',
      email: 'organizer@test.com',
    });

    const event = await Event.create({
      title: 'Test Event',
      description: 'A test event',
      category: 'Conference',
      location: 'Test Venue, Test City',
      organizerId: organizer._id,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      price: 100,
      status: 'ACTIVE',
      isPublished: true,
    });
    eventId = event._id;

    // Create test movie
    const movie = await Movie.create({
      title: 'Test Movie',
      description: 'A test movie',
      releaseDate: new Date('2026-03-01'),
      runtime: '120',
      genre: 'Action',
      organizer: organizer._id,
      isPublished: true,
    });
    movieId = movie._id;

    // Create event slot
    const eventSlot = await Slot.create({
      parentType: 'Event',
      parentId: eventId,
      capacity: 50,
      availableSeats: 50,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '10:00',
      endTime: '12:00',
      status: 'AVAILABLE',
    });
    eventSlotId = eventSlot._id;

    // Create movie slot
    const movieSlot = await Slot.create({
      parentType: 'Movie',
      parentId: movieId,
      capacity: 100,
      availableSeats: 100,
      date: new Date('2026-03-01'),
      startTime: '19:00',
      endTime: '22:00',
      status: 'AVAILABLE',
    });
    movieSlotId = movieSlot._id;
  });

  describe('GET /api/v1/slots/:id/seats', () => {
    it('should return available seats for a slot', async () => {
      const response = await request(app)
        .get(`/api/v1/slots/${eventSlotId}/seats`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('label');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should mark booked seats correctly', async () => {
      // Create a booking
      await Booking.create({
        userId: (await createTestUser({ email: 'booker@test.com' }))._id,
        slotId: eventSlotId,
        quantity: 2,
        seats: ['A1', 'A2'],
        status: 'CONFIRMED',
      });

      const response = await request(app)
        .get(`/api/v1/slots/${eventSlotId}/seats`)
        .expect(200);

      const seats = response.body;
      const bookedSeats = seats.filter(s => s.status === 'booked');
      const availableSeats = seats.filter(s => s.status === 'available');

      expect(bookedSeats.length).toBe(2);
      expect(bookedSeats.some(s => s.label === 'A1')).toBe(true);
      expect(bookedSeats.some(s => s.label === 'A2')).toBe(true);
      expect(availableSeats.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent slot', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/slots/${fakeId}/seats`)
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid slot ID', async () => {
      const response = await request(app)
        .get('/api/v1/slots/invalid-id/seats')
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should handle slots with multiple bookings', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      // Create multiple bookings
      await Booking.create([
        {
          userId: user1._id,
          slotId: eventSlotId,
          quantity: 2,
          seats: ['A1', 'A2'],
          status: 'CONFIRMED',
        },
        {
          userId: user2._id,
          slotId: eventSlotId,
          quantity: 3,
          seats: ['B1', 'B2', 'B3'],
          status: 'CONFIRMED',
        },
      ]);

      const response = await request(app)
        .get(`/api/v1/slots/${eventSlotId}/seats`)
        .expect(200);

      const seats = response.body;
      const bookedSeats = seats.filter(s => s.status === 'booked');

      expect(bookedSeats.length).toBe(5);
      expect(bookedSeats.some(s => s.label === 'A1')).toBe(true);
      expect(bookedSeats.some(s => s.label === 'B3')).toBe(true);
    });

    it('should only count CONFIRMED bookings', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      // Create bookings with different statuses
      await Booking.create([
        {
          userId: user1._id,
          slotId: eventSlotId,
          quantity: 2,
          seats: ['A1', 'A2'],
          status: 'CONFIRMED',
        },
        {
          userId: user2._id,
          slotId: eventSlotId,
          quantity: 2,
          seats: ['B1', 'B2'],
          status: 'CANCELLED', // Should not appear as booked
        },
      ]);

      const response = await request(app)
        .get(`/api/v1/slots/${eventSlotId}/seats`)
        .expect(200);

      const seats = response.body;
      const bookedSeats = seats.filter(s => s.status === 'booked');

      expect(bookedSeats.length).toBe(2); // Only confirmed booking
      expect(bookedSeats.some(s => s.label === 'A1')).toBe(true);
      expect(bookedSeats.some(s => s.label === 'B1')).toBe(false); // Cancelled, should be available
    });

    it('should handle different seat label formats', async () => {
      // Create booking with string format seats
      await Booking.create({
        userId: (await createTestUser({ email: 'booker@test.com' }))._id,
        slotId: eventSlotId,
        quantity: 2,
        seats: ['C1', 'C2'],
        status: 'CONFIRMED',
      });

      const response = await request(app)
        .get(`/api/v1/slots/${eventSlotId}/seats`)
        .expect(200);

      const seats = response.body;
      const bookedSeats = seats.filter(s => s.status === 'booked');

      expect(bookedSeats.length).toBe(2);
      expect(bookedSeats.some(s => s.label === 'C1')).toBe(true);
      expect(bookedSeats.some(s => s.label === 'C2')).toBe(true);
    });

    it('should generate correct seat map (6 rows x 8 columns)', async () => {
      const response = await request(app)
        .get(`/api/v1/slots/${eventSlotId}/seats`)
        .expect(200);

      const seats = response.body;

      // Verify total seats (48 = 6 rows * 8 columns)
      expect(seats.length).toBe(48);

      // Verify row labels (A-F)
      const rowLabels = [...new Set(seats.map(s => s.row))];
      expect(rowLabels).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D', 'E', 'F']));

      // Verify column numbers (1-8)
      const colNumbers = [...new Set(seats.map(s => s.number))];
      expect(colNumbers).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6, 7, 8]));

      // Verify first and last seats
      expect(seats.some(s => s.label === 'A1')).toBe(true);
      expect(seats.some(s => s.label === 'F8')).toBe(true);
    });
  });

  describe('Slot filtering and queries', () => {
    beforeEach(async () => {
      // Create additional slots for filtering tests
      await Slot.create([
        {
          parentType: 'Event',
          parentId: eventId,
          capacity: 30,
          availableSeats: 0, // Sold out
          date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          startTime: '14:00',
          endTime: '16:00',
          status: 'AVAILABLE',
        },
        {
          parentType: 'Movie',
          parentId: movieId,
          capacity: 50,
          availableSeats: 25,
          date: new Date('2026-03-02'),
          startTime: '15:00',
          endTime: '18:00',
          status: 'AVAILABLE',
        },
      ]);
    });

    it('should find slots by parent type and ID', async () => {
      const eventSlots = await Slot.find({
        parentType: 'Event',
        parentId: eventId,
      });

      expect(eventSlots.length).toBe(2); // Original + new one
    });

    it('should filter slots by availability', async () => {
      const availableSlots = await Slot.find({
        parentId: eventId,
        parentType: 'Event',
        availableSeats: { $gt: 0 },
      });

      expect(availableSlots.length).toBe(1); // Only one with available seats
      expect(availableSlots[0].availableSeats).toBeGreaterThan(0);
    });

    it('should sort slots by date and time', async () => {
      const slots = await Slot.find({
        parentType: 'Event',
        parentId: eventId,
      }).sort({ date: 1, startTime: 1 });

      expect(slots.length).toBe(2);

      // Verify chronological order
      const firstDate = new Date(slots[0].date);
      const lastDate = new Date(slots[slots.length - 1].date);
      expect(firstDate.getTime()).toBeLessThanOrEqual(lastDate.getTime());
    });
  });

  describe('Slot capacity management', () => {
    it('should update available seats after booking', async () => {
      const initialSlot = await Slot.findById(eventSlotId);
      const initialAvailable = initialSlot.availableSeats;

      // Simulate booking (update seats)
      await Slot.findByIdAndUpdate(eventSlotId, {
        $inc: { availableSeats: -5 },
      });

      const updatedSlot = await Slot.findById(eventSlotId);
      expect(updatedSlot.availableSeats).toBe(initialAvailable - 5);
    });

    it('should restore available seats after cancellation', async () => {
      // Book some seats
      await Slot.findByIdAndUpdate(eventSlotId, {
        $inc: { availableSeats: -5 },
      });

      const afterBooking = await Slot.findById(eventSlotId);
      const bookedState = afterBooking.availableSeats;

      // Cancel booking (restore seats)
      await Slot.findByIdAndUpdate(eventSlotId, {
        $inc: { availableSeats: 5 },
      });

      const afterCancellation = await Slot.findById(eventSlotId);
      expect(afterCancellation.availableSeats).toBe(bookedState + 5);
    });

    it('should not allow negative available seats', async () => {
      const slot = await Slot.findById(eventSlotId);
      const initialAvailable = slot.availableSeats;

      // Try to book more than available
      await Slot.findByIdAndUpdate(eventSlotId, {
        availableSeats: Math.max(0, initialAvailable - 1000),
      });

      const updatedSlot = await Slot.findById(eventSlotId);
      expect(updatedSlot.availableSeats).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle slot with no bookings', async () => {
      const response = await request(app)
        .get(`/api/v1/slots/${movieSlotId}/seats`)
        .expect(200);

      const seats = response.body;
      const availableSeats = seats.filter(s => s.status === 'available');

      expect(availableSeats.length).toBe(48); // All 48 seats available
    });

    it('should handle fully booked slot', async () => {
      // Create bookings for all 48 seats
      const allSeats = [];
      for (let r = 0; r < 6; r++) {
        for (let c = 1; c <= 8; c++) {
          const rowLabel = String.fromCharCode(65 + r);
          allSeats.push(`${rowLabel}${c}`);
        }
      }

      await Booking.create({
        userId: (await createTestUser({ email: 'fullbooker@test.com' }))._id,
        slotId: eventSlotId,
        quantity: 48,
        seats: allSeats,
        status: 'CONFIRMED',
      });

      const response = await request(app)
        .get(`/api/v1/slots/${eventSlotId}/seats`)
        .expect(200);

      const seats = response.body;
      const bookedSeats = seats.filter(s => s.status === 'booked');
      const availableSeats = seats.filter(s => s.status === 'available');

      expect(bookedSeats.length).toBe(48);
      expect(availableSeats.length).toBe(0);
    });
  });
});
