const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const { hashPassword } = require('../../src/utils/passwordHasher');
const { generateTestToken, extractCookies } = require('../helpers');

describe('Auth Integration Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          // missing name and password
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123', // too weak
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'Password123!',
      };

      // Create first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      const hashedPassword = await hashPassword('Password123!');
      await User.create({
        name: 'Test User',
        email: 'login@example.com',
        password: hashedPassword,
        role: 'USER',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');

      // Check for JWT cookie
      const cookies = extractCookies(response);
      expect(cookies).toHaveProperty('token');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          // missing password
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get current user with valid token', async () => {
      // Create a user
      const hashedPassword = await hashPassword('Password123!');
      const user = await User.create({
        name: 'Auth User',
        email: 'auth@example.com',
        password: hashedPassword,
        role: 'USER',
      });

      // Generate token
      const token = generateTestToken({
        userId: user._id.toString(),
        role: user.role,
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('auth@example.com');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', ['token=invalid-token'])
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .get('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.data).toBeDefined();

      // Check that cookie is cleared/set to 'none'
      const cookies = extractCookies(response);
      expect(cookies.token).toBeDefined();
    });
  });
});
