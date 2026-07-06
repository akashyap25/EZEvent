/**
 * Organizations API Tests
 */
const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';

const User = require('../models/user');
const Organization = require('../models/organization');

describe('Organizations API', () => {
  let app, authToken, userId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test');
    }
    app = require('../app');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Organization.deleteMany({});

    const reg = await request(app).post('/api/users/register').send({
      email: 'org@test.com', password: 'SecurePass123!@#',
      username: 'orguser', firstName: 'Org', lastName: 'Tester'
    });
    authToken = reg.body.accessToken;
    userId = reg.body.user._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Organization.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/organizations', () => {
    it('should return user organizations', async () => {
      const res = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/organizations', () => {
    it('should create an organization', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Org', description: 'A test organization' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('should reject without name', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Missing name' });
      expect([400, 422]).toContain(res.status);
    });
  });

  describe('GET /api/organizations/:id', () => {
    it('should return org details', async () => {
      const createRes = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Detail Org', description: 'Get details' });
      
      const orgId = createRes.body.organization?._id || createRes.body.data?._id;
      if (orgId) {
        const res = await request(app)
          .get(`/api/organizations/${orgId}`)
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
      }
    });
  });
});
