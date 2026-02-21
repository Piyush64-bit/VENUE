const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const { generateTestToken, createTestUser } = require('../helpers');

describe('User Module', () => {
  let user;
  let userToken;

  beforeEach(async () => {
    user = await createTestUser({ email: 'user@test.com' });
    userToken = generateTestToken({ userId: user._id.toString(), role: 'USER' });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/users/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return user profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('user@test.com');
    });
  });

  describe('PATCH /api/v1/users/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user.name).toBe('Updated Name');
    });

    it('should reject duplicate email', async () => {
      await createTestUser({ email: 'other@test.com' });

      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'other@test.com' })
        .expect(400);

      expect(res.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/v1/users/password', () => {
    it('should reject if missing fields', async () => {
      const res = await request(app)
        .patch('/api/v1/users/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currentPassword: 'old' })
        .expect(400);

      expect(res.body.status).toBe('fail');
    });

    it('should reject mismatched passwords', async () => {
      const res = await request(app)
        .patch('/api/v1/users/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'hashedPassword123!',
          newPassword: 'newpass1',
          confirmPassword: 'newpass2',
        })
        .expect(400);

      expect(res.body.status).toBe('fail');
    });
  });

  describe('POST /api/v1/users/favorites', () => {
    it('should reject if missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/users/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/users/favorites', () => {
    it('should return user favorites', async () => {
      const res = await request(app)
        .get('/api/v1/users/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.favorites).toBeDefined();
    });
  });
});
