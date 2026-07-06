/**
 * Categories API Tests
 */
const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';

const Category = require('../models/category');

describe('Categories API', () => {
  let app;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test');
    }
    app = require('../app');
  });

  beforeEach(async () => {
    await Category.deleteMany({});
    await Category.create([
      { name: 'Technology', description: 'Tech events' },
      { name: 'Music', description: 'Music events' },
      { name: 'Sports', description: 'Sports events' }
    ]);
  });

  afterAll(async () => {
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      const cats = res.body.categories || res.body.data || res.body;
      expect(Array.isArray(cats)).toBe(true);
      expect(cats.length).toBeGreaterThanOrEqual(3);
    });

    it('should be accessible without auth', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
    });
  });
});
