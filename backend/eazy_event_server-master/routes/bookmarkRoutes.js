const express = require('express');
const router = express.Router();
const Bookmark = require('../models/bookmark');
const Event = require('../models/event');
const { authenticateToken, requireAuth } = require('../middlewares/authMiddleware');
const { commonValidations, handleValidationErrors } = require('../utils/validationUtils');

// Toggle bookmark (add/remove)
router.post('/:eventId', authenticateToken, requireAuth, commonValidations.mongoId('eventId'), handleValidationErrors, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Check event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Toggle: if exists, remove; if not, add
    const existing = await Bookmark.findOne({ user: userId, event: eventId });
    
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ success: true, bookmarked: false, message: 'Bookmark removed' });
    }

    await Bookmark.create({ user: userId, event: eventId });
    return res.status(201).json({ success: true, bookmarked: true, message: 'Event bookmarked' });
  } catch (error) {
    console.error('Bookmark toggle error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark' });
  }
});

// Get user's bookmarks
router.get('/', authenticateToken, requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const bookmarks = await Bookmark.find({ user: userId })
      .populate({
        path: 'event',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'organizer', select: 'firstName lastName avatar' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Bookmark.countDocuments({ user: userId });

    res.json({
      success: true,
      data: bookmarks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks' });
  }
});

// Check if event is bookmarked
router.get('/check/:eventId', authenticateToken, requireAuth, commonValidations.mongoId('eventId'), handleValidationErrors, async (req, res) => {
  try {
    const exists = await Bookmark.findOne({ user: req.user._id, event: req.params.eventId });
    res.json({ success: true, bookmarked: !!exists });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check bookmark' });
  }
});

module.exports = router;
