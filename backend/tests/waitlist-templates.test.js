/**
 * Waitlist & Event Templates API Tests
 */
const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';

const User = require('../models/user');
const Event = require('../models/event');
const Category = require('../models/category');

describe('Waitlist & Templates API', () => {
  let app, authToken, userId, eventId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test');
    }
    app = require('../app');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});

    const reg = await request(app).post('/api/users/register').send({
      email: 'waitlist@test.com', password: 'SecurePass123!@#',
      username: 'waitlistuser', firstName: 'Wait', lastName: 'Lister'
    });
    authToken = reg.body.accessToken;
    userId = reg.body.user._id;

    const cat = await Category.create({ name: 'Tech' });
    const eventRes = await request(app)
      .post('/api/events/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Waitlist Event', description: 'Test waitlist',
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        endDateTime: new Date(Date.now() + 90000000).toISOString(),
        category: cat._id, isFree: true, price: '0', location: 'Test',
        capacity: 1
      });
    eventId = eventRes.body.event?._id || eventRes.body.data?._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/waitlist/:eventId', () => {
    it('should return waitlist for event', async () => {
      const res = await request(app)
        .get(`/api/waitlist/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/templates', () => {
    it('should return event templates', async () => {
      const res = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/billing/plans', () => {
    it('should return billing plans (public)', async () => {
      const res = await request(app).get('/api/billing/plans');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/calendar-export/:eventId', () => {
    it('should export calendar for event', async () => {
      const res = await request(app)
        .get(`/api/calendar-export/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });
});
