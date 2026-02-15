const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Event = require('../../src/modules/events/event.model');
const Movie = require('../../src/modules/movies/movie.model');
const { hashPassword } = require('../../src/utils/passwordHasher');
const { generateTestToken, createTestUser } = require('../helpers');

describe('User Integration Tests - Complete Coverage', () => {
  let userToken;
  let userId;
  let testEvent;
  let testMovie;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await hashPassword('UserPass123!');
    const user = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'USER',
      favorites: [],
    });
    userId = user._id;
    userToken = generateTestToken({
      userId: user._id.toString(),
      role: 'USER',
    });

    // Create organizer for test content
    const organizer = await User.create({
      name: 'Organizer',
      email: 'org@test.com',
      password: hashedPassword,
      role: 'ORGANIZER',
    });

    // Create test event
    testEvent = await Event.create({
      title: 'Favorite Event',
      description: 'Test event',
      category: 'Music',
      location: 'Test Location',
      organizerId: organizer._id,
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      price: 50,
      isPublished: true,
    });

    // Create test movie
    testMovie = await Movie.create({
      title: 'Favorite Movie',
      description: 'Test movie',
      genre: 'Action',
      releaseDate: new Date(),
      runtime: 120,
      organizer: organizer._id,
      isPublished: true,
    });
  });

  /* ======================================================
     FAVORITES MANAGEMENT
     ====================================================== */

  describe('POST /api/v1/users/favorites', () => {
    it('should add event to favorites', async () => {
      const response = await request(app)
        .post('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .send({
          itemId: testEvent._id.toString(),
          itemType: 'Event',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.action).toBe('added');
      expect(response.body.data.favorites.length).toBe(1);
    });

    it('should add movie to favorites', async () => {
      const response = await request(app)
        .post('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .send({
          itemId: testMovie._id.toString(),
          itemType: 'Movie',
        })
        .expect(200);

      expect(response.body.data.action).toBe('added');
    });

    it('should remove event from favorites when already favorited', async () => {
      // First add to favorites
      await request(app)
        .post('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .send({
          itemId: testEvent._id.toString(),
          itemType: 'Event',
        });

      // Then remove
      const response = await request(app)
        .post('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .send({
          itemId: testEvent._id.toString(),
          itemType: 'Event',
        })
        .expect(200);

      expect(response.body.data.action).toBe('removed');
      expect(response.body.data.favorites.length).toBe(0);
    });

    it('should fail without itemId', async () => {
      const response = await request(app)
        .post('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .send({
          itemType: 'Event',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('itemId');
    });

    it('should fail without itemType', async () => {
      const response = await request(app)
        .post('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .send({
          itemId: testEvent._id.toString(),
        })
        .expect(400);

      expect(response.body.message).toContain('itemType');
    });

    it('should fail with invalid itemType', async () => {
      const response = await request(app)
        .post('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .send({
          itemId: testEvent._id.toString(),
          itemType: 'InvalidType',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid itemType');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/users/favorites')
        .send({
          itemId: testEvent._id.toString(),
          itemType: 'Event',
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/users/favorites', () => {
    beforeEach(async () => {
      // Add favorites
      await User.findByIdAndUpdate(userId, {
        favorites: [
          { itemId: testEvent._id, itemType: 'Event' },
          { itemId: testMovie._id, itemType: 'Movie' },
        ],
      });
    });

    it('should get all user favorites', async () => {
      const response = await request(app)
        .get('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(2);
      expect(response.body.data.favorites.length).toBe(2);
    });

    it('should return populated favorite items', async () => {
      const response = await request(app)
        .get('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .expect(200);

      const favorites = response.body.data.favorites;
      expect(favorites[0].itemId).toHaveProperty('title');
      expect(favorites[0]).toHaveProperty('itemType');
    });

    it('should return empty array when no favorites', async () => {
      // Create new user with no favorites
      const newUser = await User.create({
        name: 'New User',
        email: 'newuser@test.com',
        password: await hashPassword('password'),
        role: 'USER',
      });
      const newUserToken = generateTestToken({
        userId: newUser._id.toString(),
        role: 'USER',
      });

      const response = await request(app)
        .get('/api/v1/users/favorites')
        .set('Cookie', [`token=${newUserToken}`])
        .expect(200);

      expect(response.body.results).toBe(0);
      expect(response.body.data.favorites).toEqual([]);
    });

    it('should filter out deleted items from favorites', async () => {
      // Delete the event
      await Event.findByIdAndDelete(testEvent._id);

      const response = await request(app)
        .get('/api/v1/users/favorites')
        .set('Cookie', [`token=${userToken}`])
        .expect(200);

      // Should only have movie now
      expect(response.body.results).toBe(1);
      expect(response.body.data.favorites[0].itemType).toBe('Movie');
    });
  });

  /* ======================================================
     PROFILE MANAGEMENT
     ====================================================== */

  describe('GET /api/v1/users/profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Cookie', [`token=${userToken}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe('user@test.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/v1/users/profile', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .patch('/api/v1/users/profile')
        .set('Cookie', [`token=${userToken}`])
        .send({
          name: 'Updated Name',
          email: 'newemail@test.com',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.email).toBe('newemail@test.com');
    });

    it('should fail with duplicate email', async () => {
      await User.create({
        name: 'Other User',
        email: 'existing@test.com',
        password: await hashPassword('password'),
        role: 'USER',
      });

      const response = await request(app)
        .patch('/api/v1/users/profile')
        .set('Cookie', [`token=${userToken}`])
        .send({
          email: 'existing@test.com',
        })
        .expect(400);

      expect(response.body.message).toContain('Email already in use');
    });

    it('should allow updating name without email', async () => {
      const response = await request(app)
        .patch('/api/v1/users/profile')
        .set('Cookie', [`token=${userToken}`])
        .send({
          name: 'Only Name Changed',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Only Name Changed');
      expect(response.body.data.email).toBe('user@test.com');
    });
  });

  describe('PATCH /api/v1/users/password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .patch('/api/v1/users/password')
        .set('Cookie', [`token=${userToken}`])
        .send({
          currentPassword: 'UserPass123!',
          newPassword: 'NewSecurePass456!',
        })
        .expect(200);

      expect(response.body.message).toContain('Password changed');
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .patch('/api/v1/users/password')
        .set('Cookie', [`token=${userToken}`])
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewSecurePass456!',
        })
        .expect(401);

      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should fail without current password', async () => {
      const response = await request(app)
        .patch('/api/v1/users/password')
        .set('Cookie', [`token=${userToken}`])
        .send({
          newPassword: 'NewSecurePass456!',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should fail without new password', async () => {
      const response = await request(app)
        .patch('/api/v1/users/password')
        .set('Cookie', [`token=${userToken}`])
        .send({
          currentPassword: 'UserPass123!',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  /* ======================================================
     DELETE ACCOUNT
     ====================================================== */

  describe('DELETE /api/v1/users/account', () => {
    it('should delete user account', async () => {
      const response = await request(app)
        .delete('/api/v1/users/account')
        .set('Cookie', [`token=${userToken}`])
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify user is deleted
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/users/account')
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  /* ======================================================
     IMAGE UPLOAD
     ====================================================== */

  describe('POST /api/v1/users/upload', () => {
    it('should fail without file', async () => {
      const response = await request(app)
        .post('/api/v1/users/upload')
        .set('Cookie', [`token=${userToken}`])
        .expect(400);

      expect(response.body.message).toContain('No image');
    });
  });
});
