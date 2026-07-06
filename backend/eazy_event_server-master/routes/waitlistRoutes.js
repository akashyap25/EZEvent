const express = require('express');
const router = express.Router();
const Waitlist = require('../models/waitlist');
const Event = require('../models/event');
const { authenticateToken, requireAuth } = require('../middlewares/authMiddleware');
const { commonValidations, handleValidationErrors } = require('../utils/validationUtils');

// Join waitlist for an event
router.post('/:eventId', authenticateToken, requireAuth, commonValidations.mongoId('eventId'), handleValidationErrors, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if event actually has capacity limit
    if (!event.capacity || event.capacity === 0) {
      return res.status(400).json({ success: false, message: 'This event has no capacity limit' });
    }

    // Check if event is full
    const attendeeCount = event.attendees ? event.attendees.length : 0;
    if (attendeeCount < event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is not full yet. You can register directly.' });
    }

    // Check if already on waitlist
    const existing = await Waitlist.findOne({ user: userId, event: eventId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already on waitlist', position: existing.position });
    }

    // Get next position
    const lastEntry = await Waitlist.findOne({ event: eventId }).sort({ position: -1 });
    const position = lastEntry ? lastEntry.position + 1 : 1;

    const entry = await Waitlist.create({ user: userId, event: eventId, position });

    res.status(201).json({
      success: true,
      message: 'Added to waitlist',
      data: { position: entry.position, waitlistId: entry._id }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already on waitlist' });
    }
    console.error('Join waitlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to join waitlist' });
  }
});

// Leave waitlist
router.delete('/:eventId', authenticateToken, requireAuth, commonValidations.mongoId('eventId'), handleValidationErrors, async (req, res) => {
  try {
    const result = await Waitlist.findOneAndDelete({ user: req.user._id, event: req.params.eventId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Not on waitlist' });
    }
    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (error) {
    console.error('Leave waitlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to leave waitlist' });
  }
});

// Get waitlist position
router.get('/:eventId/position', authenticateToken, requireAuth, commonValidations.mongoId('eventId'), handleValidationErrors, async (req, res) => {
  try {
    const entry = await Waitlist.findOne({ user: req.user._id, event: req.params.eventId });
    if (!entry) {
      return res.json({ success: true, onWaitlist: false });
    }
    
    const totalWaiting = await Waitlist.countDocuments({ event: req.params.eventId, status: 'waiting' });
    
    res.json({
      success: true,
      onWaitlist: true,
      data: { position: entry.position, status: entry.status, totalWaiting }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get position' });
  }
});

// Get event waitlist (organizer only)
router.get('/:eventId', authenticateToken, requireAuth, commonValidations.mongoId('eventId'), handleValidationErrors, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only organizer can see full waitlist
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the event organizer can view the waitlist' });
    }

    const waitlist = await Waitlist.find({ event: req.params.eventId })
      .populate('user', 'firstName lastName email avatar')
      .sort({ position: 1 });

    res.json({ success: true, data: waitlist, total: waitlist.length });
  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch waitlist' });
  }
});

module.exports = router;
