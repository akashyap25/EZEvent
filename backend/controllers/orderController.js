const Stripe = require('stripe');
const Order = require('../models/order');
const Event = require('../models/event');
const User = require('../models/user');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const checkoutOrder = async (req, res) => {
  const { isFree, price, eventTitle, eventId, buyerId } = req.body;
  const amount = isFree ? 0 : Number(price) * 100;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            unit_amount: amount,
            product_data: {
              name: eventTitle,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { eventId, buyerId },
      mode: 'payment',
      success_url: `${process.env.CLIENT_BASE_URL}/`,
      cancel_url: `${process.env.CLIENT_BASE_URL}/`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const communicationConfig = require('../config/communicationConfig');
const transporter = communicationConfig.getEmailTransporter();

// Handle Stripe webhook events
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { metadata } = session;
      

      const eventData = await Event.findById(metadata.eventId);

      // Atomic idempotent upsert keyed by stripeId: if this webhook is delivered
      // more than once (Stripe's documented at-least-once delivery), the unique
      // index on stripeId means only the first delivery creates a document --
      // concurrent/duplicate deliveries hit a duplicate-key error, caught below,
      // and are treated as already-processed rather than creating a second order.
      let isNewOrder = true;
      try {
        await Order.create({
          event: metadata.eventId,
          buyer: metadata.buyerId,
          totalAmount: session.amount_total / 100,
          stripeId: session.id,
          // checkout.session.completed means payment succeeded -- without this,
          // the order was stuck at the schema's default 'pending' status forever,
          // which meant ticket QR generation (requires status: 'completed') could
          // never find a real paid order.
          status: 'completed',
        });
      } catch (createError) {
        if (createError.code === 11000) {
          // Duplicate webhook delivery for the same Stripe session -- already processed.
          isNewOrder = false;
        } else {
          throw createError;
        }
      }

      if (isNewOrder) {
        // Get buyer details
        const buyer = await User.findById(metadata.buyerId);

        // Send email notification. This is best-effort: a transient SMTP
        // failure must not turn an otherwise-successful payment into a
        // non-200 response, which would make Stripe retry a webhook whose
        // order was already recorded (see idempotent upsert above).
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: buyer.email,
            subject: 'Order Confirmation',
            text: `Thank you for your purchase!\n\nEvent: ${eventData.title}\nAmount: ${session.amount_total / 100} INR\n\nYour order has been placed successfully.`,
          });
        } catch (emailError) {
          console.error('Order confirmation email failed to send:', emailError);
        }
      }

      res.json({ received: true });
    } else {
      res.status(400).end(); // Unexpected event type
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};


const getOrdersByEvent = async (req, res) => {
  try {
    

    const eventId = req.params.eventId;

    const orders = await Order.find({ event: eventId })
      .sort({ createdAt: 'desc' })
      .populate('buyer');

    res.status(200).json({
      data: orders
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRegisteredUsers = async (req, res) => {
  try {
    

    const eventId = req.params.id;

    const orders = await Order.find({ event: eventId })
      .sort({ createdAt: 'desc' })
      .populate('buyer');

    const users = orders.map((order) => order.buyer);

    res.status(200).json({
      data: users
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: error.message });
  }
}


const getOrdersByUser = async (req, res) => {
  try {
    

    const userId = req.params.id;

    const orders = await Order.find({ buyer: userId })
      .sort({ createdAt: 'desc' })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: '_id firstName lastName' },
      });



    res.status(200).json({
      data: orders
    });
  } catch (error) {
   
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkoutOrder,
  getOrdersByEvent,
  getOrdersByUser,
  handleStripeWebhook,
  getRegisteredUsers
};
