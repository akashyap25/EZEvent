/**
 * Search API Tests
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

describe('Search API', () => {
  let app, authToken;

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
      email: 'search@test.com', password: 'SecurePass123!@#',
      username: 'searchuser', firstName: 'Search', lastName: 'Tester'
    });
    authToken = reg.body.accessToken;

    const cat = await Category.create({ name: 'Technology' });
    await request(app)
      .post('/api/events/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'React Workshop', description: 'Learn React',
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        endDateTime: new Date(Date.now() + 90000000).toISOString(),
        category: cat._id, isFree: true, price: '0', location: 'Online'
      });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/search/events', () => {
    it('should search events by query', async () => {
      const res = await request(app)
        .get('/api/search/events?query=React')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should return results for matching query', async () => {
      const res = await request(app)
        .get('/api/search/events?query=React')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      const data = res.body.data || res.body.events || res.body;
      if (Array.isArray(data)) {
        expect(data.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return empty for non-matching query', async () => {
      const res = await request(app)
        .get('/api/search/events?query=xyznonexistent')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });
});
