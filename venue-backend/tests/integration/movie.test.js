const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Movie = require('../../src/modules/movies/movie.model');
const Slot = require('../../src/modules/slots/slot.model');
const User = require('../../src/modules/users/user.model');
const { generateTestToken, createTestUser, createTestOrganizer } = require('../helpers');

describe('Movie Integration Tests', () => {
  let adminToken;
  let organizerToken;
  let userToken;
  let movieId;

  beforeEach(async () => {
    // Create admin user
    const admin = await createTestUser({
      role: 'ADMIN',
      email: 'admin@test.com',
    });
    adminToken = generateTestToken({
      userId: admin._id.toString(),
      role: 'ADMIN',
    });

    // Create organizer user
    const organizer = await createTestOrganizer({
      email: 'organizer@test.com',
    });
    organizerToken = generateTestToken({
      userId: organizer._id.toString(),
      role: 'ORGANIZER',
    });

    // Create regular user
    const user = await createTestUser({
      email: 'user@test.com',
    });
    userToken = generateTestToken({
      userId: user._id.toString(),
      role: 'USER',
    });

    // Create a test movie
    const movie = await Movie.create({
      title: 'Test Movie',
      description: 'A test movie',
      releaseDate: new Date('2026-03-01'),
      runtime: '2h 0m',
      genre: 'Action',
      poster: 'https://example.com/poster.jpg',
      organizer: organizerId,
      price: 250,
      isPublished: true,
    });
    movieId = movie._id;

    // Create slots for the movie
    await Slot.create([
      {
        parentType: 'Movie',
        parentId: movieId,
        capacity: 100,
        availableSeats: 100,
        date: new Date('2026-03-01'),
        startTime: '14:00',
        endTime: '17:00',
        status: 'AVAILABLE',
      },
      {
        parentType: 'Movie',
        parentId: movieId,
        capacity: 100,
        availableSeats: 0, // Sold out
        date: new Date('2026-03-01'),
        startTime: '19:00',
        endTime: '22:00',
        status: 'AVAILABLE',
      },
    ]);
  });

  describe('GET /api/v1/movies', () => {
    it('should return all published movies', async () => {
      const response = await request(app)
        .get('/api/v1/movies')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.movies).toHaveLength(1);
      expect(response.body.data.movies[0].title).toBe('Test Movie');
    });

    it('should not return unpublished movies', async () => {
      // Create unpublished movie
      await Movie.create({
        title: 'Unpublished Movie',
        description: 'Not visible',
        releaseDate: new Date('2026-04-01'),
        runtime: '1h 30m',
        genre: 'Drama',
        organizer: organizerId,
        price: 200,
        isPublished: false,
      });

      const response = await request(app)
        .get('/api/v1/movies')
        .expect(200);

      expect(response.body.data.movies).toHaveLength(1);
      expect(response.body.data.movies[0].title).toBe('Test Movie');
    });

    it('should work without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/movies')
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  describe('GET /api/v1/movies/:id', () => {
    it('should return movie by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/movies/${movieId}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.movie.title).toBe('Test Movie');
      expect(response.body.data.movie.runtime).toBe('2h 0m');
    });

    it('should return 404 for non-existent movie', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/movies/${fakeId}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for unpublished movie', async () => {
      const unpublishedMovie = await Movie.create({
        title: 'Unpublished Movie',
        description: 'Not visible',
        releaseDate: new Date('2026-04-01'),
        runtime: '1h 30m',
        genre: 'Drama',
        organizer: organizerId,
        price: 200,
        isPublished: false,
      });

      const response = await request(app)
        .get(`/api/v1/movies/${unpublishedMovie._id}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
    });

    it('should return 400 for invalid movie ID format', async () => {
      const response = await request(app)
        .get('/api/v1/movies/invalid-id')
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/movies/:id/slots', () => {
    it('should return available slots for a movie', async () => {
      const response = await request(app)
        .get(`/api/v1/movies/${movieId}/slots`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.slots).toHaveLength(1); // Only 1 with available seats
      expect(response.body.data.slots[0].availableSeats).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent movie', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/movies/${fakeId}/slots`)
        .expect(404);

      expect(response.body.status).toBe('fail');
    });

    it('should return empty array when no available slots', async () => {
      // Update all slots to have 0 available seats
      await Slot.updateMany(
        { parentId: movieId },
        { $set: { availableSeats: 0 } }
      );

      const response = await request(app)
        .get(`/api/v1/movies/${movieId}/slots`)
        .expect(200);

      expect(response.body.data.slots).toHaveLength(0);
    });

    it('should sort slots by date and time', async () => {
      // Create additional slots
      await Slot.create([
        {
          parentType: 'Movie',
          parentId: movieId,
          capacity: 50,
          availableSeats: 50,
          date: new Date('2026-03-02'),
          startTime: '10:00',
          endTime: '13:00',
          status: 'AVAILABLE',
        },
        {
          parentType: 'Movie',
          parentId: movieId,
          capacity: 50,
          availableSeats: 50,
          date: new Date('2026-03-01'),
          startTime: '10:00',
          endTime: '13:00',
          status: 'AVAILABLE',
        },
      ]);

      const response = await request(app)
        .get(`/api/v1/movies/${movieId}/slots`)
        .expect(200);

      const slots = response.body.data.slots;
      expect(slots.length).toBeGreaterThanOrEqual(2);

      // Verify sorting (earliest date/time first)
      const firstSlot = new Date(slots[0].date);
      const secondSlot = new Date(slots[1].date);
      expect(firstSlot.getTime()).toBeLessThanOrEqual(secondSlot.getTime());
    });
  });

  describe('POST /api/v1/movies', () => {
    const validMovieData = {
      title: 'New Movie',
      description: 'A new movie description',
      releaseDate: '2026-06-01',
      runtime: '2h 30m',
      genre: 'Sci-Fi',
      poster: 'https://example.com/new-poster.jpg',
      price: 300,
      startDate: '2026-06-01',
      endDate: '2026-06-15',
      slotDuration: 180,
      capacityPerSlot: 100,
    };

    it('should create movie with slots as ADMIN', async () => {
      const response = await request(app)
        .post('/api/v1/movies')
        .set('Cookie', [`token=${adminToken}`])
        .send(validMovieData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.movie.title).toBe('New Movie');
      expect(response.body.data.slots.length).toBeGreaterThan(0);
    });

    it('should create movie as ORGANIZER', async () => {
      const response = await request(app)
        .post('/api/v1/movies')
        .set('Cookie', [`token=${organizerToken}`])
        .send(validMovieData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.movie.title).toBe('New Movie');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/movies')
        .send(validMovieData)
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    it('should fail as regular USER', async () => {
      const response = await request(app)
        .post('/api/v1/movies')
        .set('Cookie', [`token=${userToken}`])
        .send(validMovieData)
        .expect(403);

      expect(response.body.status).toBe('fail');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/movies')
        .set('Cookie', [`token=${adminToken}`])
        .send({
          title: 'Incomplete Movie',
          // Missing description, releaseDate, runtime, genre
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should create movie with default slot duration', async () => {
      const movieData = { ...validMovieData };
      delete movieData.slotDuration; // Should default to 180

      const response = await request(app)
        .post('/api/v1/movies')
        .set('Cookie', [`token=${adminToken}`])
        .send(movieData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.slots.length).toBeGreaterThan(0);
    });
  });

  describe('Movie filtering and edge cases', () => {
    beforeEach(async () => {
      // Create additional movies for filtering
      await Movie.create([
        {
          title: 'Action Movie',
          description: 'Explosive action',
          releaseDate: new Date('2026-04-01'),
          runtime: '1h 50m',
          genre: 'Action',
          organizer: organizerId,
          price: 250,
          isPublished: true,
        },
        {
          title: 'Drama Movie',
          description: 'Emotional drama',
          releaseDate: new Date('2026-05-01'),
          runtime: '2h 10m',
          genre: 'Drama',
          organizer: organizerId,
          price: 250,
          isPublished: true,
        },
      ]);
    });

    it('should return movies sorted by release date (newest first)', async () => {
      const response = await request(app)
        .get('/api/v1/movies')
        .expect(200);

      const movies = response.body.data.movies;
      expect(movies.length).toBe(3);

      // Verify descending order
      const firstDate = new Date(movies[0].releaseDate);
      const lastDate = new Date(movies[movies.length - 1].releaseDate);
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(lastDate.getTime());
    });

    it('should handle empty movie database', async () => {
      // Clear all movies
      await Movie.deleteMany({});

      const response = await request(app)
        .get('/api/v1/movies')
        .expect(200);

      expect(response.body.data.movies).toHaveLength(0);
      expect(response.body.data.results).toBe(0);
    });
  });
});
