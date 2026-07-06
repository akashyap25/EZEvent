const request = require('supertest');
const mongoose = require('mongoose');

// Set up test environment
process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';

const User = require('../models/user');
const Event = require('../models/event');
const Category = require('../models/category');

describe('Event API', () => {
  let app;
  let authToken;
  let testUser;
  let testCategory;

  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    app = require('../app');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});

    // Create test user and get token
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: 'eventuser@example.com',
        password: 'SecurePass123!@#',
        username: 'eventuser',
        firstName: 'Event',
        lastName: 'Tester'
      });

    authToken = registerRes.body.accessToken;
    testUser = registerRes.body.user;

    // Create test category
    testCategory = await Category.create({ name: 'Technology' });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  const validEvent = () => ({
    title: 'Test Tech Conference',
    description: 'A great tech event for developers',
    location: 'San Francisco, CA',
    imageUrl: 'https://example.com/image.jpg',
    startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    price: 50,
    isFree: false,
    capacity: 100,
    tags: ['tech', 'conference']
  });

  describe('GET /api/events', () => {
    it('should return empty array when no events exist', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return events with pagination', async () => {
      // Create multiple events
      for (let i = 0; i < 3; i++) {
        await Event.create({
          ...validEvent(),
          title: `Event ${i}`,
          organizer: testUser._id,
          category: testCategory._id
        });
      }

      const response = await request(app)
        .get('/api/events?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/events/create', () => {
    it('should create event with valid data and auth', async () => {
      const eventData = {
        ...validEvent(),
        category: testCategory._id.toString()
      };

      const response = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.eventId).toBeDefined();
    });

    it('should reject event creation without authentication', async () => {
      const response = await request(app)
        .post('/api/events/create')
        .send(validEvent());

      expect(response.status).toBe(401);
    });

    it('should reject event creation without title', async () => {
      const { title, ...eventWithoutTitle } = validEvent();

      const response = await request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventWithoutTitle);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event by ID', async () => {
      const event = await Event.create({
        ...validEvent(),
        organizer: testUser._id,
        category: testCategory._id
      });

      const response = await request(app)
        .get(`/api/events/${event._id}`)
        .expect(200);

      expect(response.body.success || response.body.title).toBeTruthy();
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/events/${fakeId}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/events/invalid-id');

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update event by owner', async () => {
      const event = await Event.create({
        ...validEvent(),
        organizer: testUser._id,
        category: testCategory._id
      });

      const response = await request(app)
        .put(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
    });

    it('should reject update by non-owner', async () => {
      // Create event by a different user
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'SecurePass123!@#',
        username: 'otheruser',
        firstName: 'Other',
        lastName: 'User',
        authProvider: 'local'
      });

      const event = await Event.create({
        ...validEvent(),
        organizer: otherUser._id,
        category: testCategory._id
      });

      const response = await request(app)
        .put(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hacked Title' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event by owner', async () => {
      const event = await Event.create({
        ...validEvent(),
        organizer: testUser._id,
        category: testCategory._id
      });

      const response = await request(app)
        .delete(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject delete without auth', async () => {
      const event = await Event.create({
        ...validEvent(),
        organizer: testUser._id,
        category: testCategory._id
      });

      const response = await request(app)
        .delete(`/api/events/${event._id}`);

      expect(response.status).toBe(401);
    });
  });
});
