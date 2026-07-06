/**
 * Tasks API Tests
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
const Task = require('../models/task');

describe('Tasks API', () => {
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
    await Task.deleteMany({});

    const reg = await request(app).post('/api/users/register').send({
      email: 'tasks@test.com', password: 'SecurePass123!@#',
      username: 'taskuser', firstName: 'Task', lastName: 'Tester'
    });
    authToken = reg.body.accessToken;
    userId = reg.body.user._id;

    const cat = await Category.create({ name: 'Tech' });
    const eventRes = await request(app)
      .post('/api/events/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Task Test Event', description: 'Testing tasks',
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        endDateTime: new Date(Date.now() + 90000000).toISOString(),
        category: cat._id, isFree: true, price: '0', location: 'Test'
      });
    eventId = eventRes.body.event?._id || eventRes.body.data?._id;
  });

  afterAll(async () => {
    await Task.deleteMany({});
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/tasks/event/:eventId', () => {
    it('should return tasks for an event', async () => {
      const res = await request(app)
        .get(`/api/tasks/event/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/tasks/user/:userId', () => {
    it('should return tasks for a user', async () => {
      const res = await request(app)
        .get(`/api/tasks/user/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Setup AV Equipment',
          description: 'Set up audio and video for the event',
          eventId: eventId,
          assignedTo: userId,
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          priority: 'high'
        });
      expect([200, 201]).toContain(res.status);
    });
  });
});
