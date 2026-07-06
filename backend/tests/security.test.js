/**
 * Security & Rate Limiting Tests
 */
const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';

const User = require('../models/user');

describe('Security', () => {
  let app;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test');
    }
    app = require('../app');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Authentication Guards', () => {
    it('should reject requests without token', async () => {
      const endpoints = [
        { method: 'get', path: '/api/users/me' },
        { method: 'get', path: '/api/bookmarks' },
        { method: 'get', path: '/api/notifications' },
        { method: 'get', path: '/api/support/tickets' },
        { method: 'get', path: '/api/organizations' },
      ];

      for (const ep of endpoints) {
        const res = await request(app)[ep.method](ep.path);
        expect(res.status).toBe(401);
      }
    });

    it('should reject malformed tokens', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer not.a.valid.jwt.token');
      expect(res.status).toBe(401);
    });

    it('should reject expired-like tokens', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjF9.invalid');
      expect(res.status).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'weak@test.com',
          password: '123', // too weak
          username: 'weakuser',
          firstName: 'Weak',
          lastName: 'Pass'
        });
      expect(res.status).toBe(400);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'not-an-email',
          password: 'SecurePass123!@#',
          username: 'bademail',
          firstName: 'Bad',
          lastName: 'Email'
        });
      expect(res.status).toBe(400);
    });

    it('should reject XSS in event title', async () => {
      await User.deleteMany({});
      const reg = await request(app).post('/api/users/register').send({
        email: 'xss@test.com', password: 'SecurePass123!@#',
        username: 'xssuser', firstName: 'XSS', lastName: 'Test'
      });
      const token = reg.body.accessToken;

      const res = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '<script>alert("xss")</script>',
          description: 'XSS test',
          startDateTime: new Date(Date.now() + 86400000).toISOString(),
          endDateTime: new Date(Date.now() + 90000000).toISOString(),
          isFree: true, price: '0', location: 'Test'
        });
      // Should either sanitize or reject
      if (res.status === 201 || res.status === 200) {
        const title = res.body.event?.title || res.body.data?.title || '';
        expect(title).not.toContain('<script>');
      }
    });
  });

  describe('Public Endpoints', () => {
    it('should allow /health without auth', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('should allow /api/events without auth', async () => {
      const res = await request(app).get('/api/events');
      expect(res.status).toBe(200);
    });

    it('should allow /api/categories without auth', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
    });

    it('should allow /api/stats without auth', async () => {
      const res = await request(app).get('/api/stats');
      expect(res.status).toBe(200);
    });

    it('should allow /api/support/faqs without auth', async () => {
      const res = await request(app).get('/api/support/faqs');
      expect(res.status).toBe(200);
    });
  });

  describe('Error Responses', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent/route');
      expect(res.status).toBe(404);
    });

    it('should return JSON error format', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
    });
  });
});
