const axios = require('axios');

class IntegrationService {
  /**
   * Send Slack notification via incoming webhook
   */
  static async sendSlackNotification(webhookUrl, { title, message, color = '#3b82f6', fields = [] }) {
    if (!webhookUrl) return { success: false, message: 'No webhook URL configured' };

    try {
      const payload = {
        attachments: [{
          color,
          title,
          text: message,
          fields: fields.map(f => ({ title: f.label, value: f.value, short: true })),
          footer: 'EZEvent',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      await axios.post(webhookUrl, payload, { timeout: 5000 });
      return { success: true };
    } catch (error) {
      console.error('Slack notification failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Notify org's Slack on event registration
   */
  static async notifySlackRegistration(org, { attendeeName, eventTitle, attendeeCount }) {
    const webhookUrl = org?.settings?.notifications?.webhookUrl;
    if (!webhookUrl) return;

    return this.sendSlackNotification(webhookUrl, {
      title: '🎟️ New Registration',
      message: `*${attendeeName}* registered for *${eventTitle}*`,
      color: '#10b981',
      fields: [
        { label: 'Event', value: eventTitle },
        { label: 'Total Attendees', value: String(attendeeCount) }
      ]
    });
  }

  /**
   * Notify org's Slack on event creation
   */
  static async notifySlackEventCreated(org, { eventTitle, organizer }) {
    const webhookUrl = org?.settings?.notifications?.webhookUrl;
    if (!webhookUrl) return;

    return this.sendSlackNotification(webhookUrl, {
      title: '📅 New Event Created',
      message: `*${organizer}* created a new event: *${eventTitle}*`,
      color: '#3b82f6'
    });
  }

  /**
   * Notify org's Slack on event cancellation
   */
  static async notifySlackEventCancelled(org, { eventTitle, reason }) {
    const webhookUrl = org?.settings?.notifications?.webhookUrl;
    if (!webhookUrl) return;

    return this.sendSlackNotification(webhookUrl, {
      title: '❌ Event Cancelled',
      message: `*${eventTitle}* has been cancelled${reason ? `: ${reason}` : ''}`,
      color: '#ef4444'
    });
  }

  /**
   * Verify custom domain ownership via DNS CNAME check
   */
  static async verifyDomain(domain) {
    if (!domain) return { verified: false, message: 'No domain provided' };

    try {
      const dns = require('dns').promises;
      const records = await dns.resolveCname(domain).catch(() => []);
      
      // Check if CNAME points to our platform
      const expectedTarget = process.env.PLATFORM_DOMAIN || 'app.ezevent.com';
      const isVerified = records.some(r => r.includes(expectedTarget));

      return {
        verified: isVerified,
        records,
        message: isVerified 
          ? 'Domain verified successfully' 
          : `CNAME must point to ${expectedTarget}`
      };
    } catch (error) {
      return { verified: false, message: error.message };
    }
  }
}

module.exports = IntegrationService;
