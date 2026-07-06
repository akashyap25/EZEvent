/**
 * Notifications API Tests
 */
const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';

const User = require('../models/user');
const Notification = require('../models/notification');

describe('Notifications API', () => {
  let app, authToken, userId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test');
    }
    app = require('../app');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});

    const reg = await request(app).post('/api/users/register').send({
      email: 'notif@test.com', password: 'SecurePass123!@#',
      username: 'notifuser', firstName: 'Notif', lastName: 'Tester'
    });
    authToken = reg.body.accessToken;
    userId = reg.body.user._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/notifications', () => {
    it('should return notifications for user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });
});
