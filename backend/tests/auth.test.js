const request = require('supertest');
const mongoose = require('mongoose');

// Set up test environment
process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';

const User = require('../models/user');

// We need to test the registration and login endpoints
// Since app.js starts the server and connects to DB, we'll test the route logic
describe('Auth API', () => {
  let app;

  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    app = require('../app');
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/users/register', () => {
    const validUser = {
      email: 'newuser@example.com',
      password: 'SecurePass123!@#',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User'
    };

    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe(validUser.email);
    });

    it('should reject registration with existing email', async () => {
      // Create user first
      await User.create({
        ...validUser,
        authProvider: 'local'
      });

      const response = await request(app)
        .post('/api/users/register')
        .send(validUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({ ...validUser, password: '123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({ ...validUser, email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration without required fields', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({ email: 'test@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Create a user to login with
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!@#',
          username: 'loginuser',
          firstName: 'Login',
          lastName: 'User'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123!@#'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/me', () => {
    it('should return current user with valid token', async () => {
      // Register and get token
      const registerRes = await request(app)
        .post('/api/users/register')
        .send({
          email: 'me@example.com',
          password: 'SecurePass123!@#',
          username: 'meuser',
          firstName: 'Me',
          lastName: 'User'
        });

      const token = registerRes.body.accessToken;

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email || response.body.user?.email).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
