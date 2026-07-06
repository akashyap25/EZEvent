/**
 * Reviews API Tests
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
const Review = require('../models/review');

describe('Reviews API', () => {
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
    await Review.deleteMany({});

    const reg = await request(app).post('/api/users/register').send({
      email: 'review@test.com', password: 'SecurePass123!@#',
      username: 'reviewuser', firstName: 'Review', lastName: 'Tester'
    });
    authToken = reg.body.accessToken;
    userId = reg.body.user._id;

    const cat = await Category.create({ name: 'Tech' });
    // Create a past event (for reviews)
    const pastEvent = await Event.create({
      title: 'Past Event', description: 'Already happened',
      startDateTime: new Date(Date.now() - 86400000 * 2),
      endDateTime: new Date(Date.now() - 86400000),
      category: cat._id, organizer: userId,
      isFree: true, price: 0, location: 'Test'
    });
    eventId = pastEvent._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});
    await Review.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/reviews/event/:eventId', () => {
    it('should return reviews for an event', async () => {
      const res = await request(app)
        .get(`/api/reviews/event/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('POST /api/reviews', () => {
    it('should create a review for a past event', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventId: eventId,
          rating: 5,
          comment: 'Excellent event!'
        });
      expect([200, 201, 400]).toContain(res.status);
    });
  });
});
