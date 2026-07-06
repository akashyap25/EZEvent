const Event = require('../models/event');
const Order = require('../models/order');
const { queryOptimizer } = require('../utils/queryOptimizer');
const { createCacheMiddleware, cacheKeyGenerators } = require('../middlewares/cacheMiddleware');
const { tryCatch, errorResponses } = require('../utils/errorUtils');

const createEvent = tryCatch(async (req, res) => {
  const {
    title, description, location, imageUrl, startDateTime, endDateTime,
    price, isFree, url, category, capacity, tags, notes, visibility, organizationId
  } = req.body;

  // Get user ID from authentication
  const organizer = req.auth.userId;

  // Business rule: Event start date must be in the future
  if (startDateTime && new Date(startDateTime) < new Date()) {
    return res.status(400).json({ success: false, message: 'Event start date must be in the future' });
  }

  // Business rule: End date must be after start date
  if (startDateTime && endDateTime && new Date(endDateTime) <= new Date(startDateTime)) {
    return res.status(400).json({ success: false, message: 'End date must be after start date' });
  }

  if (isFree) req.body.price = '0';

  const eventData = {
    title,
    description,
    location,
    imageUrl,
    startDateTime,
    endDateTime,
    price: isFree ? 0 : price,
    isFree,
    url,
    category,
    organizer,
    capacity,
    tags,
    notes,
    visibility: visibility || 'public',
    organizationId
  };

  const newEvent = await Event.create(eventData);

  res.status(201).json({ success: true, eventId: newEvent._id });
});

const getAllEvents = tryCatch(async (req, res) => {
  const { 
    status, 
    category, 
    page = 1, 
    limit = 10, 
    sort = 'createdAt',
    order = 'desc',
    search 
  } = req.query;

  // Build query filter
  const filter = { isDeleted: { $ne: true } };
  
  if (status) filter.status = status;
  if (category) filter.category = category;
  
  // Add search functionality
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }

  // Visibility enforcement: only show events the user is allowed to see
  const userId = req.user?._id;
  if (userId) {
    // Authenticated user: can see public + their org events + their own private events
    const OrgMember = require('../models/organizationMember');
    const userOrgMemberships = await OrgMember.find({ user: userId, status: 'active' }).select('organization');
    const userOrgIds = userOrgMemberships.map(m => m.organization);
    
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { visibility: 'public' },
        { visibility: 'unlisted' },
        { visibility: 'organization', organizationId: { $in: userOrgIds } },
        { visibility: 'private', organizer: userId },
        { organizer: userId } // Always show own events
      ]
    });
  } else {
    // Unauthenticated: only public events
    filter.visibility = { $in: ['public', 'unlisted'] };
  }

  // Build sort object
  const sortObj = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  // Use optimized query with population
  const result = await queryOptimizer.getEventsWithPopulation(filter, {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sortObj,
    populate: ['organizer', 'category'],
    cache: true,
    cacheTTL: 300 // 5 minutes
  });

  res.status(200).json({
    success: true,
    data: result.events,
    pagination: result.pagination
  });
});

const getEventById = tryCatch(async (req, res) => {
  const { id } = req.params;
  const Order = require('../models/order');

  // Use optimized single document population
  const event = await Event.findById(id);

  if (!event || event.isDeleted) {
    return res.status(404).json(errorResponses.notFound('Event not found'));
  }

  // Populate related documents efficiently
  const populatedEvent = await queryOptimizer.populateDocument(event, [
    { fieldName: 'category', model: require('../models/category'), select: { name: 1, description: 1, imageUrl: 1 } },
    { fieldName: 'organizer', model: require('../models/user'), select: { username: 1, firstName: 1, lastName: 1, avatar: 1, email: 1 } },
    { fieldName: 'attendees', model: require('../models/user'), select: { username: 1, firstName: 1, lastName: 1, avatar: 1 } }
  ]);

  // Registered count = orders (tickets) for this event. Use Order count so it reflects checkout/orders, not just legacy attendees array.
  const registeredCount = await Order.countDocuments({
    event: id,
    status: { $in: ['completed', 'pending'] }
  });

  const eventData = populatedEvent.toObject ? populatedEvent.toObject() : { ...populatedEvent };
  eventData.registeredCount = registeredCount;

  res.status(200).json({
    success: true,
    data: eventData
  });
});

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Business rule: Cannot edit cancelled or completed events
    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (['cancelled', 'completed', 'rejected'].includes(existingEvent.status)) {
      return res.status(400).json({ success: false, message: `Cannot edit a ${existingEvent.status} event` });
    }

    if (req.body.isFree) req.body.price = '0';

    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedEvent) {
      return res.status(404).json({ success: false, message: 'Event update failed' });
    }

    // Notify attendees if event details changed significantly
    const significantChanges = ['startDateTime', 'endDateTime', 'location', 'title'];
    const hasSignificantChange = significantChanges.some(field => req.body[field] && req.body[field] !== existingEvent[field]?.toString());
    
    if (hasSignificantChange && existingEvent.attendees?.length > 0) {
      try {
        const EmailService = require('../services/emailService');
        const User = require('../models/user');
        const attendees = await User.find({ _id: { $in: existingEvent.attendees } }).select('email firstName');
        const changes = significantChanges.filter(f => req.body[f]).map(f => `${f}: ${req.body[f]}`).join(', ');
        
        for (const attendee of attendees) {
          await EmailService.sendEventUpdateEmail(attendee.email, {
            firstName: attendee.firstName,
            eventTitle: updatedEvent.title,
            changes
          });
        }
      } catch (emailErr) {
        console.error('Event update email failed:', emailErr.message);
      }
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.auth?.userId;

    // Soft delete instead of hard delete
    const eventToDelete = await Event.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      status: 'cancelled'
    }, { new: true });

    if (!eventToDelete) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Soft-delete orders (mark as cancelled, don't destroy data)
    await Order.updateMany({ event: id }, { status: 'cancelled' });

    // Notify attendees about cancellation
    if (eventToDelete.attendees?.length > 0) {
      try {
        const EmailService = require('../services/emailService');
        const User = require('../models/user');
        const attendees = await User.find({ _id: { $in: eventToDelete.attendees } }).select('email firstName');
        
        for (const attendee of attendees) {
          await EmailService.sendEventCancellationEmail(attendee.email, {
            firstName: attendee.firstName,
            eventTitle: eventToDelete.title,
            reason: 'The organizer has removed this event.'
          });
        }
      } catch (emailErr) {
        console.error('Cancellation email failed:', emailErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEventsByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    // Ensure user can only access their own events
    if (id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own events.' 
      });
    }

    const events = await Event.find({ organizer: id })
      .populate('category')
      .populate('organizer')
      .sort({ createdAt: -1 });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

const getRelatedEvents = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const events = await Event.find({ category: categoryId })
      .populate('category')
      .populate('organizer');

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id || req.user?._id?.toString();

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Business rule: Cannot register for your own event
    if (event.organizer.toString() === userId) {
      return res.status(400).json({ success: false, message: 'You cannot register for your own event' });
    }

    // Business rule: Co-organizers cannot register
    const isCoOrganizer = event.coOrganizers?.some(co => co.user?.toString() === userId);
    if (isCoOrganizer) {
      return res.status(400).json({ success: false, message: 'Co-organizers cannot register as attendees' });
    }

    // Business rule: Event must not be cancelled or completed
    if (['cancelled', 'completed', 'rejected'].includes(event.status)) {
      return res.status(400).json({ success: false, message: `Cannot register for ${event.status} event` });
    }

    // Business rule: If event requires approval, check approval status
    if (event.approvalStatus === 'pending' || event.approvalStatus === 'rejected') {
      return res.status(400).json({ success: false, message: 'Event is not yet approved for registration' });
    }

    if (event.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }

    if (event.capacity && event.capacity > 0 && event.attendees.length >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    event.attendees.push(userId);
    await event.save();

    // Send notification to event organizer
    try {
      const Notification = require('../models/notification');
      await Notification.create({
        user: event.organizer,
        type: 'event_registration',
        title: 'New Registration',
        message: `Someone registered for your event "${event.title}"`,
        metadata: { eventId: event._id, userId }
      });
    } catch (notifErr) {
      console.error('Notification create failed:', notifErr.message);
    }

    // Send registration confirmation email to attendee
    try {
      const EmailService = require('../services/emailService');
      const User = require('../models/user');
      const registrant = await User.findById(userId).select('email firstName');
      if (registrant?.email) {
        await EmailService.sendEventRegistrationEmail(registrant.email, {
          firstName: registrant.firstName,
          eventTitle: event.title,
          eventDate: event.startDateTime,
          eventLocation: event.location,
          eventId: event._id
        });
      }
      // Notify organizer via email
      const organizer = await User.findById(event.organizer).select('email firstName');
      if (organizer?.email) {
        await EmailService.sendOrganizerRegistrationNotification(organizer.email, {
          organizerName: organizer.firstName,
          attendeeName: registrant?.firstName || 'Someone',
          eventTitle: event.title,
          attendeeCount: event.attendees.length
        });
      }
    } catch (emailErr) {
      console.error('Registration email failed:', emailErr.message);
      // Don't fail the registration if email fails
    }

    res.status(200).json({ success: true, message: 'Registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unregister user from an event
const unregisterFromEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.attendees = event.attendees.filter((id) => id.toString() !== userId);
    await event.save();

    res.status(200).json({ success: true, message: 'Unregistered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Automatically update event status based on current time
const updateEventStatuses = async () => {
  try {
    const now = new Date();
    await Event.updateMany(
      { startDateTime: { $lte: now }, endDateTime: { $gt: now } },
      { status: 'ongoing' }
    );
    await Event.updateMany({ endDateTime: { $lte: now } }, { status: 'completed' });
  } catch (error) {
    console.error('Error updating event statuses:', error);
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByUser,
  getRelatedEvents,
  registerForEvent,
  unregisterFromEvent,
  updateEventStatuses,
};
