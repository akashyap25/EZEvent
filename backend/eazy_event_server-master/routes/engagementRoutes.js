const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const { authenticateToken, requireAuth } = require('../middlewares/authMiddleware');
const { commonValidations, handleValidationErrors } = require('../utils/validationUtils');

// ==================== POLLS & Q&A ====================

// Create poll for an event
router.post('/:eventId/polls', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { question, options, allowMultiple = false } = req.body;
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Question and at least 2 options required' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only organizer can create polls' });
    }

    event.polls.push({
      question,
      options: options.map(text => ({ text, votes: 0 })),
      allowMultiple,
      isActive: true
    });
    await event.save();

    res.status(201).json({ success: true, data: event.polls[event.polls.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Vote on a poll
router.post('/:eventId/polls/:pollId/vote', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const poll = event.polls.id(req.params.pollId);
    if (!poll || !poll.isActive) return res.status(404).json({ success: false, message: 'Poll not found or inactive' });
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ success: false, message: 'Invalid option' });
    }

    poll.options[optionIndex].votes += 1;
    await event.save();

    res.json({ success: true, data: poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get polls for event
router.get('/:eventId/polls', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).select('polls');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event.polls.filter(p => p.isActive) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== EVENT FEED / TIMELINE ====================

// Add post to event feed
router.post('/:eventId/feed', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { content, type = 'update' } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content required' });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Only organizer or co-organizers can post
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isCoOrg = event.coOrganizers?.some(co => co.user?.toString() === req.user._id.toString());
    if (!isOrganizer && !isCoOrg) {
      return res.status(403).json({ success: false, message: 'Only organizers can post to the feed' });
    }

    event.feed.push({ author: req.user._id, content, type });
    await event.save();

    res.status(201).json({ success: true, data: event.feed[event.feed.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get event feed
router.get('/:eventId/feed', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .select('feed')
      .populate('feed.author', 'firstName lastName avatar');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    
    const sortedFeed = event.feed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: sortedFeed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== POST-EVENT SURVEY ====================

// Submit survey response
router.post('/:eventId/survey', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers array required' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.survey?.enabled) return res.status(400).json({ success: false, message: 'Survey not enabled' });

    // Check duplicate
    const alreadySubmitted = event.survey.responses.some(r => r.user?.toString() === req.user._id.toString());
    if (alreadySubmitted) return res.status(400).json({ success: false, message: 'Already submitted' });

    event.survey.responses.push({ user: req.user._id, answers });
    await event.save();

    res.json({ success: true, message: 'Survey submitted, thank you!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get survey results (organizer only)
router.get('/:eventId/survey/results', authenticateToken, requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).select('survey organizer');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Organizer only' });
    }

    res.json({ success: true, data: event.survey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== MICROSITE ====================

// Get event by microsite slug (public)
router.get('/microsite/:slug', async (req, res) => {
  try {
    const event = await Event.findOne({ 'microsite.slug': req.params.slug, 'microsite.enabled': true, isDeleted: { $ne: true } })
      .populate('category', 'name')
      .populate('organizer', 'firstName lastName avatar');
    
    if (!event) return res.status(404).json({ success: false, message: 'Event page not found' });
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== NETWORKING ====================

// Get networking matches for attendee
router.get('/:eventId/networking/matches', authenticateToken, requireAuth, async (req, res) => {
  try {
    const User = require('../models/user');
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.networking?.enabled) return res.status(400).json({ success: false, message: 'Networking not enabled' });

    // Simple matching: other attendees excluding self
    const otherAttendees = event.attendees.filter(id => id.toString() !== req.user._id.toString());
    const matches = await User.find({ _id: { $in: otherAttendees.slice(0, 10) } })
      .select('firstName lastName avatar email');

    res.json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ENGAGEMENT TRACKING ====================

// Track page view
router.post('/:eventId/view', async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.eventId, {
      $inc: { 'engagement.totalViews': 1 }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(200).json({ success: true }); // Don't fail on tracking
  }
});

module.exports = router;
