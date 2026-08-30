const express = require('express');
const {
  checkoutOrder,
  getOrdersByEvent,
  getOrdersByUser,
  handleStripeWebhook,
  getRegisteredUsers
} = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Protected routes - require authentication
router.post('/checkout', authenticateToken, checkoutOrder);
router.get('/event/:id', authenticateToken, getOrdersByEvent);
router.get('/user/:id', authenticateToken, getOrdersByUser);
router.get('/rgstduser/:id', authenticateToken, getRegisteredUsers);

// Webhook route - no auth (Stripe sends these directly).
// Raw-body parsing for this route is already handled in app.js (must run
// before the global JSON body-parser); a second express.raw() here would
// re-read the already-consumed request stream and corrupt req.body.
router.post('/webhook', handleStripeWebhook);

module.exports = router;
