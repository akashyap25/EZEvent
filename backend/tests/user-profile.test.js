/**
 * User Profile & Settings API Tests
 */
const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';

const User = require('../models/user');

describe('User Profile API', () => {
  let app, authToken, userId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test');
    }
    app = require('../app');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: 'profile@test.com',
        password: 'SecurePass123!@#',
        username: 'profileuser',
        firstName: 'Profile',
        lastName: 'Tester'
      });
    authToken = res.body.accessToken;
    userId = res.body.user._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user || res.body).toHaveProperty('email', 'profile@test.com');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update own profile', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Updated', lastName: 'Name' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not update another user profile', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Hacker' });
      expect(res.status).toBe(403);
    });

    it('should reject duplicate email', async () => {
      // Create another user
      await request(app).post('/api/users/register').send({
        email: 'other@test.com', password: 'SecurePass123!@#',
        username: 'otheruser', firstName: 'Other', lastName: 'User'
      });
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'other@test.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/preferences', () => {
    it('should return user preferences', async () => {
      const res = await request(app)
        .get('/api/users/preferences')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/users/:id/password', () => {
    it('should change password with correct current password', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'SecurePass123!@#',
          newPassword: 'NewSecurePass456!@#'
        });
      expect([200, 204]).toContain(res.status);
    });

    it('should reject wrong current password', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewSecurePass456!@#'
        });
      expect([400, 401, 403]).toContain(res.status);
    });
  });
});
