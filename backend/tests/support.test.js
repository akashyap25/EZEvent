/**
 * Support & Tickets API Tests
 */
const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';

const User = require('../models/user');
const SupportTicket = require('../models/supportTicket');
const FAQ = require('../models/faq');

describe('Support API', () => {
  let app, authToken, userId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test');
    }
    app = require('../app');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await SupportTicket.deleteMany({});

    const reg = await request(app).post('/api/users/register').send({
      email: 'support@test.com', password: 'SecurePass123!@#',
      username: 'supportuser', firstName: 'Support', lastName: 'Tester'
    });
    authToken = reg.body.accessToken;
    userId = reg.body.user._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await SupportTicket.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/support/faqs', () => {
    it('should return FAQs without auth', async () => {
      const res = await request(app).get('/api/support/faqs');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/support/tickets', () => {
    it('should return user tickets', async () => {
      const res = await request(app)
        .get('/api/support/tickets')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/support/tickets');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/support/tickets', () => {
    it('should create a ticket', async () => {
      const res = await request(app)
        .post('/api/support/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subject: 'Test Ticket',
          description: 'This is a test support ticket',
          category: 'general',
          priority: 'medium'
        });
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('should reject without subject', async () => {
      const res = await request(app)
        .post('/api/support/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Missing subject' });
      expect([400, 500]).toContain(res.status);
    });
  });
});
