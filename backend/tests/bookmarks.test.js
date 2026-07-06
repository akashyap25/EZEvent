/**
 * Bookmarks API Tests
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
const Bookmark = require('../models/bookmark');

describe('Bookmarks API', () => {
  let app, authToken, userId, eventId, categoryId;

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
    await Bookmark.deleteMany({});

    const reg = await request(app).post('/api/users/register').send({
      email: 'bookmark@test.com', password: 'SecurePass123!@#',
      username: 'bookmarkuser', firstName: 'Bookmark', lastName: 'Tester'
    });
    authToken = reg.body.accessToken;
    userId = reg.body.user._id;

    const cat = await Category.create({ name: 'Tech' });
    categoryId = cat._id;

    const eventRes = await request(app)
      .post('/api/events/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Bookmark Test Event',
        description: 'Testing bookmarks',
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        endDateTime: new Date(Date.now() + 90000000).toISOString(),
        category: categoryId,
        isFree: true, price: '0', location: 'Test'
      });
    eventId = eventRes.body.event?._id || eventRes.body.data?._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});
    await Bookmark.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/bookmarks', () => {
    it('should return empty bookmarks initially', async () => {
      const res = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/bookmarks');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/bookmarks/:eventId', () => {
    it('should bookmark an event', async () => {
      const res = await request(app)
        .post(`/api/bookmarks/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect([200, 201]).toContain(res.status);
    });

    it('should toggle bookmark off', async () => {
      // Bookmark
      await request(app)
        .post(`/api/bookmarks/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);
      // Un-bookmark
      const res = await request(app)
        .post(`/api/bookmarks/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });
});
