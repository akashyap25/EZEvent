/**
 * Check-In API Tests
 * Covers the QR check-in hardening from Phase 2: the broken ownership
 * check (was comparing against undefined and never matched a real order)
 * and the missing organizer-only authorization on scan/check-in actions.
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
const Order = require('../models/order');
const CheckIn = require('../models/checkIn');

describe('Check-In API', () => {
  let app;
  let organizerToken;
  let attendeeToken, attendeeId;
  let otherUserToken;
  let eventId, orderId;

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
    await Order.deleteMany({});
    await CheckIn.deleteMany({});

    const organizerReg = await request(app).post('/api/users/register').send({
      email: 'organizer@test.com', password: 'SecurePass123!@#',
      username: 'organizeruser', firstName: 'Org', lastName: 'Anizer'
    });
    organizerToken = organizerReg.body.accessToken;

    const attendeeReg = await request(app).post('/api/users/register').send({
      email: 'attendee@test.com', password: 'SecurePass123!@#',
      username: 'attendeeuser', firstName: 'Att', lastName: 'Endee'
    });
    attendeeToken = attendeeReg.body.accessToken;
    attendeeId = attendeeReg.body.user._id;

    const otherReg = await request(app).post('/api/users/register').send({
      email: 'other@test.com', password: 'SecurePass123!@#',
      username: 'otheruser', firstName: 'Other', lastName: 'Person'
    });
    otherUserToken = otherReg.body.accessToken;

    const cat = await Category.create({ name: 'Tech' });
    const eventRes = await request(app)
      .post('/api/events/create')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Check-In Test Event', description: 'Testing check-in',
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        endDateTime: new Date(Date.now() + 90000000).toISOString(),
        category: cat._id, isFree: true, price: '0', location: 'Test'
      });
    eventId = eventRes.body.eventId || eventRes.body.event?._id || eventRes.body.data?._id;

    const order = await Order.create({
      event: eventId,
      buyer: attendeeId,
      totalAmount: 0,
      status: 'completed',
      stripeId: `cs_test_checkin_${Date.now()}`
    });
    orderId = order._id.toString();
  });

  afterAll(async () => {
    await CheckIn.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/check-in/ticket/:orderId', () => {
    it('generates a QR ticket for the order\'s own buyer', async () => {
      const res = await request(app)
        .get(`/api/check-in/ticket/${orderId}`)
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.qrCode).toBeDefined();
      expect(res.body.data.ticketNumber).toBeDefined();
    });

    it('does not generate a ticket for a user who does not own the order', async () => {
      const res = await request(app)
        .get(`/api/check-in/ticket/${orderId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/check-in/scan', () => {
    async function getTicketToken() {
      await request(app)
        .get(`/api/check-in/ticket/${orderId}`)
        .set('Authorization', `Bearer ${attendeeToken}`);
      const checkIn = await CheckIn.findOne({ order: orderId });
      return checkIn.ticketToken;
    }

    it('allows the event organizer to scan and check in the attendee', async () => {
      const token = await getTicketToken();

      const res = await request(app)
        .post('/api/check-in/scan')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ token });

      expect(res.status).toBe(200);
      expect(res.body.data.checkIn.status).toBe('checked_in');
    });

    it('rejects scan attempts from a non-organizer', async () => {
      const token = await getTicketToken();

      const res = await request(app)
        .post('/api/check-in/scan')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ token });

      expect(res.status).toBe(403);

      const checkIn = await CheckIn.findOne({ ticketToken: token });
      expect(checkIn.status).toBe('pending');
    });

    it('rejects a second scan of an already checked-in ticket', async () => {
      const token = await getTicketToken();

      await request(app)
        .post('/api/check-in/scan')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ token });

      const res = await request(app)
        .post('/api/check-in/scan')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ token });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/check-in/event/:eventId (organizer-only)', () => {
    it('rejects a non-organizer from viewing check-in data', async () => {
      const res = await request(app)
        .get(`/api/check-in/event/${eventId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });

    it('allows the organizer to view check-in data', async () => {
      const res = await request(app)
        .get(`/api/check-in/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
    });
  });
});
