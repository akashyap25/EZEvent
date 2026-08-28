/**
 * Unified Notification Service
 * Industry-standard service for all communication types (Email, SMS, Push)
 */

const fs = require('fs');
const path = require('path');
const communicationConfig = require('../config/communicationConfig');
const Event = require('../models/event');

const LOGO_BASE64 = fs.readFileSync(path.join(__dirname, '../assets/logo.png')).toString('base64');

class NotificationService {
  constructor() {
    this.emailTransporter = communicationConfig.getEmailTransporter();
    this.smsClient = communicationConfig.getSMSClient();
    this.isEmailEnabled = communicationConfig.isEmailConfigured();
    this.isSMSEnabled = communicationConfig.isSMSConfigured();
  }

  /**
   * Send notification via multiple channels
   * @param {Object} options - Notification options
   * @param {Array} options.channels - ['email', 'sms', 'push']
   * @param {String|Array} options.recipients - Email addresses or phone numbers
   * @param {String} options.subject - Notification subject
   * @param {String} options.message - Notification message
   * @param {String} options.template - Template name (optional)
   * @param {Object} options.data - Template data (optional)
   * @returns {Promise<Object>} Send results
   */
  async sendNotification(options) {
    const { channels = ['email'], recipients, subject, message, template, data = {} } = options;
    
    if (!recipients || (!Array.isArray(recipients) && !recipients)) {
      throw new Error('Recipients are required');
    }

    const recipientsList = Array.isArray(recipients) ? recipients : [recipients];
    const results = {
      email: { sent: 0, failed: 0, errors: [] },
      sms: { sent: 0, failed: 0, errors: [] },
      push: { sent: 0, failed: 0, errors: [] }
    };

    // Send via each requested channel
    for (const channel of channels) {
      if (channel === 'email' && this.isEmailEnabled) {
        await this.sendEmailNotifications(recipientsList, subject, message, template, data, results);
      } else if (channel === 'sms' && this.isSMSEnabled) {
        await this.sendSMSNotifications(recipientsList, message, results);
      } else if (channel === 'push') {
        await this.sendPushNotifications(recipientsList, subject, message, results);
      }
    }

    return results;
  }

  /**
   * Send email notifications
   * @private
   */
  async sendEmailNotifications(recipients, subject, message, template, data, results) {
    for (const recipient of recipients) {
      try {
        let htmlContent = message;
        
        if (template) {
          htmlContent = await this.generateEmailTemplate(template, { ...data, message });
        }

        const mailOptions = {
          from: communicationConfig.emailConfig.from,
          to: recipient,
          subject,
          html: htmlContent
        };

        await this.emailTransporter.sendMail(mailOptions);
        results.email.sent++;
      } catch (error) {
        results.email.failed++;
        results.email.errors.push({ recipient, error: error.message });
      }
    }
  }

  /**
   * Send SMS notifications
   * @private
   */
  async sendSMSNotifications(recipients, message, results) {
    for (const recipient of recipients) {
      try {
        await this.smsClient.messages.create({
          body: message,
          from: communicationConfig.smsConfig.phoneNumber,
          to: recipient
        });
        results.sms.sent++;
      } catch (error) {
        results.sms.failed++;
        results.sms.errors.push({ recipient, error: error.message });
      }
    }
  }

  /**
   * Send push notifications
   * @private
   */
  async sendPushNotifications(_recipients, _subject, _message, _results) {
    // Implementation for push notifications
    // This would integrate with your push notification service
    }

  /**
   * Send event-related notifications
   * @param {String} eventId - Event ID
   * @param {String} type - Notification type
   * @param {Object} data - Additional data
   * @returns {Promise<Object>} Send results
   */
  async sendEventNotification(eventId, type, data = {}) {
    const event = await Event.findById(eventId).populate('organizer');
    if (!event) {
      throw new Error('Event not found');
    }

    // Get event attendees
    const attendees = await this.getEventAttendees(eventId);
    
    const notificationConfig = this.getEventNotificationConfig(type, event, data);
    
    return await this.sendNotification({
      channels: notificationConfig.channels,
      recipients: attendees,
      subject: notificationConfig.subject,
      message: notificationConfig.message,
      template: notificationConfig.template,
      data: { ...data, event }
    });
  }

  /**
   * Get event attendees
   * @private
   */
  async getEventAttendees(_eventId) {
    // This would query your database for event attendees
    // Implementation depends on your data model
    return [];
  }

  /**
   * Get event notification configuration
   * @private
   */
  getEventNotificationConfig(type, event, _data) {
    const configs = {
      'event_created': {
        channels: ['email'],
        subject: `New Event: ${event.title}`,
        message: `A new event "${event.title}" has been created.`,
        template: 'event_created'
      },
      'event_updated': {
        channels: ['email', 'sms'],
        subject: `Event Updated: ${event.title}`,
        message: `The event "${event.title}" has been updated.`,
        template: 'event_updated'
      },
      'event_cancelled': {
        channels: ['email', 'sms'],
        subject: `Event Cancelled: ${event.title}`,
        message: `The event "${event.title}" has been cancelled.`,
        template: 'event_cancelled'
      },
      'event_reminder': {
        channels: ['email', 'sms', 'push'],
        subject: `Reminder: ${event.title}`,
        message: `Don't forget! "${event.title}" is coming up soon.`,
        template: 'event_reminder'
      }
    };

    return configs[type] || {
      channels: ['email'],
      subject: 'Event Notification',
      message: 'You have a new event notification.',
      template: 'default'
    };
  }

  /**
   * Generate email template
   * @private
   */
  async generateEmailTemplate(templateName, data) {
    // This would integrate with your template engine
    // For now, return basic HTML
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EZEvent Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #4338ca 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="data:image/png;base64,${LOGO_BASE64}" alt="EZEvent" width="40" height="40" style="border-radius: 10px; margin-bottom: 10px;" />
            <h1>🎉 EZEvent</h1>
          </div>
          <div class="content">
            ${data.message || 'You have a new notification from EZEvent.'}
          </div>
          <div class="footer">
            <p>This email was sent from EZEvent</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      email: {
        enabled: this.isEmailEnabled,
        configured: communicationConfig.isEmailConfigured()
      },
      sms: {
        enabled: this.isSMSEnabled,
        configured: communicationConfig.isSMSConfigured()
      },
      push: {
        enabled: false,
        configured: false
      }
    };
  }
}

module.exports = new NotificationService();
