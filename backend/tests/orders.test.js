/**
 * Orders API Tests
 * Covers the payments hardening from Phase 2: the removed direct-create
 * endpoint, and the Stripe webhook's idempotency guarantee.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const Stripe = require('stripe');

process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-64-characters-long-key-here';
process.env.SESSION_SECRET = 'test-session-secret-32-characters';
process.env.CSRF_SECRET = 'test-csrf-secret-32-characters';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_jest_tests';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy_secret_for_jest_tests';

const User = require('../models/user');
const Event = require('../models/event');
const Category = require('../models/category');
const Order = require('../models/order');

const stripeTestClient = new Stripe(process.env.STRIPE_SECRET_KEY);

function sendSignedWebhook(app, payloadObject) {
  const payload = JSON.stringify(payloadObject);
  const signature = stripeTestClient.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET
  });
  return request(app)
    .post('/api/orders/webhook')
    .set('stripe-signature', signature)
    .type('application/json')
    .send(payload);
}

describe('Orders API', () => {
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
    await Order.deleteMany({});

    const reg = await request(app).post('/api/users/register').send({
      email: 'orders@test.com', password: 'SecurePass123!@#',
      username: 'ordersuser', firstName: 'Order', lastName: 'Tester'
    });
    authToken = reg.body.accessToken;
    userId = reg.body.user._id;

    const cat = await Category.create({ name: 'Tech' });
    const eventRes = await request(app)
      .post('/api/events/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Order Test Event', description: 'Testing orders',
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        endDateTime: new Date(Date.now() + 90000000).toISOString(),
        category: cat._id, isFree: false, price: '500', location: 'Test'
      });
    eventId = eventRes.body.eventId || eventRes.body.event?._id || eventRes.body.data?._id;
  });

  afterAll(async () => {
    await Order.deleteMany({});
    await User.deleteMany({});
    await Event.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/orders (direct create removed)', () => {
    it('no longer exposes a direct order-creation endpoint', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ event: eventId, buyer: userId, totalAmount: 0, status: 'completed' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/orders/webhook', () => {
    it('creates an order on checkout.session.completed', async () => {
      const sessionId = `cs_test_${Date.now()}`;
      const res = await sendSignedWebhook(app, {
        id: `evt_${Date.now()}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            amount_total: 50000,
            metadata: { eventId, buyerId: userId }
          }
        }
      });

      expect(res.status).toBe(200);
      const order = await Order.findOne({ stripeId: sessionId });
      expect(order).not.toBeNull();
      expect(order.totalAmount).toBe(500);
      expect(order.status).toBe('completed');
    });

    it('is idempotent for duplicate webhook deliveries of the same session', async () => {
      const sessionId = `cs_test_dup_${Date.now()}`;
      const payload = {
        id: `evt_${Date.now()}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            amount_total: 50000,
            metadata: { eventId, buyerId: userId }
          }
        }
      };

      const first = await sendSignedWebhook(app, payload);
      expect(first.status).toBe(200);

      const second = await sendSignedWebhook(app, payload);
      expect(second.status).toBe(200);

      const orders = await Order.find({ stripeId: sessionId });
      expect(orders.length).toBe(1);
    });

    it('rejects webhooks with an invalid signature', async () => {
      const payload = JSON.stringify({
        id: 'evt_bad',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_bad', amount_total: 100, metadata: { eventId, buyerId: userId } } }
      });
      const res = await request(app)
        .post('/api/orders/webhook')
        .set('stripe-signature', 't=1,v1=deadbeef')
        .type('application/json')
        .send(payload);
      expect(res.status).toBe(400);
    });
  });
});
