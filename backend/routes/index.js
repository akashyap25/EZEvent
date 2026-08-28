// Mounts all API route modules onto the Express app.
function mountRoutes(app) {
  const v1EventRoutes = require('./v1/eventRoutes');
  const v1UserRoutes = require('./v1/userRoutes');
  const eventRoutes = require('./eventRoutes');
  const userRoutes = require('./userRoutes');
  const orderRoutes = require('./orderRoutes');
  const categoryRoutes = require('./categoryRoutes');
  const taskRoutes = require('./taskRoutes');
  const webhookRoutes = require('./webhookRoutes');
  const chatRoutes = require('./chatRoutes');
  const pushNotificationRoutes = require('./pushNotificationRoutes');
  const emailRoutes = require('./emailRoutes');
  const smsRoutes = require('./smsRoutes');
  const socialMediaRoutes = require('./socialMediaRoutes');
  const authRoutes = require('./authRoutes');
  const communicationRoutes = require('./communicationRoutes');
  const recurringEventRoutes = require('./recurringEventRoutes');
  const eventAnalyticsRoutes = require('./eventAnalyticsRoutes');
  const calendarExportRoutes = require('./calendarExportRoutes');
  const eventCollaborationRoutes = require('./eventCollaborationRoutes');
  const eventTemplateRoutes = require('./eventTemplateRoutes');
  const organizationRoutes = require('./organizationRoutes');
  const searchRoutes = require('./searchRoutes');
  const bookmarkRoutes = require('./bookmarkRoutes');
  const waitlistRoutes = require('./waitlistRoutes');
  const uploadRoutes = require('./uploadRoutes');
  const adminRoutes = require('./adminRoutes');
  const billingRoutes = require('./billingRoutes');
  const engagementRoutes = require('./engagementRoutes');
  const aiRoutes = require('./aiRoutes');
  const supportRoutes = require('./supportRoutes');
  const checkInRoutes = require('./checkInRoutes');
  const reviewRoutes = require('./reviewRoutes');

  // API v1 routes
  app.use('/api/v1/events', v1EventRoutes);
  app.use('/api/v1/users', v1UserRoutes);

  // Legacy (unversioned) routes, kept for backward compatibility
  app.use('/api/events', eventRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/notifications', pushNotificationRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/sms', smsRoutes);
  app.use('/api/social', socialMediaRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/communication', communicationRoutes);
  app.use('/api/recurring-events', recurringEventRoutes);
  app.use('/api/analytics', eventAnalyticsRoutes);
  app.use('/api/calendar-export', calendarExportRoutes);
  app.use('/api/collaboration', eventCollaborationRoutes);
  app.use('/api/templates', eventTemplateRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/bookmarks', bookmarkRoutes);
  app.use('/api/waitlist', waitlistRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/engagement', engagementRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/check-in', checkInRoutes);
  app.use('/api/reviews', reviewRoutes);
}

module.exports = mountRoutes;
