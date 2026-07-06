const Event = require('../models/event');
const User = require('../models/user');
const EmailService = require('./emailService');
const logger = require('../utils/logger');

/**
 * Reminder Scheduler Service
 * Checks for upcoming events and sends automated reminders
 * Should be called periodically (every 15 minutes via setInterval)
 */
class ReminderService {
  constructor() {
    this.interval = null;
  }

  start() {
    // Run every 15 minutes
    this.interval = setInterval(() => this.checkAndSendReminders(), 15 * 60 * 1000);
    logger.info('Reminder service started (checking every 15 minutes)');
    // Run immediately on start
    this.checkAndSendReminders();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async checkAndSendReminders() {
    try {
      await this.send24HourReminders();
      await this.send1HourReminders();
      await this.sendPostEventSurvey();
    } catch (error) {
      logger.error('Reminder service error:', error.message);
    }
  }

  async send24HourReminders() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Find events starting in ~24 hours that haven't been reminded yet
    const events = await Event.find({
      startDateTime: { $gte: in23h, $lte: in24h },
      status: 'upcoming',
      isDeleted: { $ne: true },
      'reminders.sent24h': false,
      attendees: { $exists: true, $not: { $size: 0 } }
    }).populate('attendees', 'email firstName');

    for (const event of events) {
      for (const attendee of event.attendees) {
        try {
          await EmailService.sendEmail({
            to: attendee.email,
            subject: `Reminder: "${event.title}" starts tomorrow!`,
            html: `<h2>Hi ${attendee.firstName}!</h2>
              <p>Just a reminder that <strong>${event.title}</strong> starts in 24 hours.</p>
              <p><strong>Date:</strong> ${new Date(event.startDateTime).toLocaleString()}</p>
              <p><strong>Location:</strong> ${event.location || event.meetingLink || 'See event page'}</p>
              <p>Don't forget to prepare!</p>`
          });
        } catch (err) {
          // Continue with other attendees
        }
      }

      // Mark as sent
      await Event.findByIdAndUpdate(event._id, { 'reminders.sent24h': true });
      logger.info(`Sent 24h reminders for event: ${event.title} (${event.attendees.length} attendees)`);
    }
  }

  async send1HourReminders() {
    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in45m = new Date(now.getTime() + 45 * 60 * 1000);

    const events = await Event.find({
      startDateTime: { $gte: in45m, $lte: in1h },
      status: 'upcoming',
      isDeleted: { $ne: true },
      'reminders.sent1h': false,
      attendees: { $exists: true, $not: { $size: 0 } }
    }).populate('attendees', 'email firstName');

    for (const event of events) {
      for (const attendee of event.attendees) {
        try {
          await EmailService.sendEmail({
            to: attendee.email,
            subject: `Starting soon: "${event.title}" in 1 hour!`,
            html: `<h2>Hi ${attendee.firstName}!</h2>
              <p><strong>${event.title}</strong> starts in about 1 hour!</p>
              ${event.meetingLink ? `<p><a href="${event.meetingLink}">Join Meeting</a></p>` : ''}
              <p>See you there! 🎉</p>`
          });
        } catch (err) {
          // Continue
        }
      }

      await Event.findByIdAndUpdate(event._id, { 'reminders.sent1h': true });
      logger.info(`Sent 1h reminders for event: ${event.title}`);
    }
  }

  async sendPostEventSurvey() {
    const now = new Date();
    const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ago25h = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    // Events that ended ~24 hours ago with survey enabled
    const events = await Event.find({
      endDateTime: { $gte: ago25h, $lte: ago24h },
      isDeleted: { $ne: true },
      'reminders.sentPostEvent': false,
      'survey.enabled': true,
      attendees: { $exists: true, $not: { $size: 0 } }
    }).populate('attendees', 'email firstName');

    for (const event of events) {
      for (const attendee of event.attendees) {
        try {
          await EmailService.sendEmail({
            to: attendee.email,
            subject: `How was "${event.title}"? Share your feedback`,
            html: `<h2>Hi ${attendee.firstName}!</h2>
              <p>Thanks for attending <strong>${event.title}</strong>!</p>
              <p>We'd love to hear your feedback. Please take a moment to share your experience.</p>
              <p><a href="${process.env.CLIENT_BASE_URL}/events/${event._id}#survey">Share Feedback</a></p>`
          });
        } catch (err) {
          // Continue
        }
      }

      await Event.findByIdAndUpdate(event._id, { 'reminders.sentPostEvent': true });
      logger.info(`Sent post-event survey for: ${event.title}`);
    }
  }
}

module.exports = new ReminderService();
