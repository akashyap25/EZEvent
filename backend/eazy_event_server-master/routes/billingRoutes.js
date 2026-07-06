const express = require('express');
const router = express.Router();
const { authenticateToken, requireAuth } = require('../middlewares/authMiddleware');
const { requireOrganization, requireOrgRole } = require('../middlewares/organizationMiddleware');

const PLANS = {
  free: { name: 'Free', price: 0, maxEvents: 10, maxMembers: 5, features: ['Basic event creation', '5 team members', 'Email support'] },
  starter: { name: 'Starter', priceMonthly: 29, priceYearly: 290, maxEvents: 50, maxMembers: 20, features: ['50 events/month', '20 team members', 'Analytics', 'Custom branding'] },
  pro: { name: 'Pro', priceMonthly: 79, priceYearly: 790, maxEvents: 200, maxMembers: 100, features: ['200 events/month', '100 team members', 'Advanced analytics', 'Priority support', 'API access'] },
  enterprise: { name: 'Enterprise', priceMonthly: 199, priceYearly: 1990, maxEvents: -1, maxMembers: -1, features: ['Unlimited events', 'Unlimited members', 'Custom integrations', 'Dedicated support', 'SLA', 'Custom domain'] }
};

// Get available plans (public)
router.get('/plans', (req, res) => {
  res.json({ success: true, data: PLANS });
});

// Create checkout session for plan upgrade
router.post('/organizations/:orgId/checkout', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { plan, interval = 'monthly' } = req.body;
    const Organization = require('../models/organization');

    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    if (org.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can manage billing' });
    }

    // If Stripe is configured, create real checkout session
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`];
      
      if (!priceId) {
        return res.status(400).json({ success: false, message: 'Stripe price not configured for this plan' });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { organizationId: org._id.toString(), plan },
        success_url: `${process.env.CLIENT_BASE_URL}/organizations?upgraded=true`,
        cancel_url: `${process.env.CLIENT_BASE_URL}/organizations`
      });

      return res.json({ success: true, data: { url: session.url } });
    }

    // Without Stripe: directly upgrade (for demo/development)
    org.plan = plan;
    org.subscription = {
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    await org.save();

    res.json({ success: true, message: `Upgraded to ${PLANS[plan].name} plan`, data: { plan: org.plan } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get billing portal URL (for managing existing subscription)
router.post('/organizations/:orgId/portal', authenticateToken, requireAuth, async (req, res) => {
  try {
    const Organization = require('../models/organization');
    const org = await Organization.findById(req.params.orgId);

    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    if (org.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can access billing' });
    }

    if (process.env.STRIPE_SECRET_KEY && org.subscription?.stripeCustomerId) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: org.subscription.stripeCustomerId,
        return_url: `${process.env.CLIENT_BASE_URL}/organizations`
      });
      return res.json({ success: true, data: { url: portalSession.url } });
    }

    res.json({ success: true, message: 'Billing portal not available (no active subscription)', data: { plan: org.plan } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current billing status
router.get('/organizations/:orgId/billing', authenticateToken, requireAuth, async (req, res) => {
  try {
    const Organization = require('../models/organization');
    const org = await Organization.findById(req.params.orgId).select('plan subscription usage settings.limits');

    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    res.json({
      success: true,
      data: {
        currentPlan: org.plan,
        planDetails: PLANS[org.plan],
        subscription: org.subscription,
        usage: org.usage,
        limits: org.settings?.limits
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stripe Billing webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_BILLING_WEBHOOK_SECRET) {
    return res.status(200).json({ received: true, message: 'Stripe not configured' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_BILLING_WEBHOOK_SECRET);

    const Organization = require('../models/organization');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orgId = session.metadata.organizationId;
        const plan = session.metadata.plan;
        await Organization.findByIdAndUpdate(orgId, {
          plan,
          'subscription.status': 'active',
          'subscription.stripeCustomerId': session.customer,
          'subscription.stripeSubscriptionId': session.subscription
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await Organization.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': subscription.id },
          { plan: 'free', 'subscription.status': 'cancelled' }
        );
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await Organization.findOneAndUpdate(
          { 'subscription.stripeCustomerId': invoice.customer },
          { 'subscription.status': 'past_due' }
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
