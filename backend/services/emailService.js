const communicationConfig = require('../config/communicationConfig');

class EmailService {
  constructor() {
    this.transporter = communicationConfig.getEmailTransporter();
    this.isConfigured = communicationConfig.isEmailConfigured();
  }

  async sendPasswordResetEmail(email, resetToken, firstName) {
    const resetUrl = `${process.env.CLIENT_BASE_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Eazy Event" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request - Eazy Event',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <p>Eazy Event Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName || 'User'}!</h2>
              <p>We received a request to reset your password for your Eazy Event account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul>
                  <li>This link will expire in 15 minutes</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                  <li>For security, this link can only be used once</li>
                </ul>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>This email was sent from Eazy Event Platform</p>
              <p>If you have any questions, please contact our support team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordChangedConfirmation(email, firstName) {
    const mailOptions = {
      from: `"Eazy Event" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Changed Successfully - Eazy Event',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .security-note { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed Successfully</h1>
              <p>Eazy Event Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName || 'User'}!</h2>
              <p>Your password has been successfully changed for your Eazy Event account.</p>
              <div class="security-note">
                <strong>🔒 Security Information:</strong>
                <ul>
                  <li>Your password was changed on ${new Date().toLocaleString()}</li>
                  <li>If you didn't make this change, please contact support immediately</li>
                  <li>All your active sessions have been logged out for security</li>
                </ul>
              </div>
              <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>This email was sent from Eazy Event Platform</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendEmailVerification(email, verificationToken, firstName) {
    const verificationUrl = `${process.env.CLIENT_BASE_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Eazy Event" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email - Eazy Event',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Verify Your Email</h1>
              <p>Eazy Event Platform</p>
            </div>
            <div class="content">
              <h2>Welcome ${firstName || 'User'}!</h2>
              <p>Thank you for registering with Eazy Event. Please verify your email address to complete your registration.</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
            </div>
            <div class="footer">
              <p>This email was sent from Eazy Event Platform</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Event registration confirmation to attendee
  async sendEventRegistrationEmail(to, { firstName, eventTitle, eventDate, eventLocation, eventId }) {
    const dateStr = eventDate ? new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD';
    return this.sendEmail({
      to,
      subject: `You're registered for "${eventTitle}"!`,
      html: `<h2>Hi ${firstName}!</h2>
        <p>You've successfully registered for <strong>${eventTitle}</strong>.</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Location:</strong> ${eventLocation || 'See event page'}</p>
        <p>You can view your ticket and event details in your dashboard.</p>
        <p>See you there! 🎉</p>`
    });
  }

  // Notify organizer when someone registers
  async sendOrganizerRegistrationNotification(to, { organizerName, attendeeName, eventTitle, attendeeCount }) {
    return this.sendEmail({
      to,
      subject: `New registration for "${eventTitle}"`,
      html: `<h2>Hi ${organizerName}!</h2>
        <p><strong>${attendeeName}</strong> just registered for your event "<strong>${eventTitle}</strong>".</p>
        <p>You now have <strong>${attendeeCount}</strong> registered attendees.</p>`
    });
  }

  // Notify all attendees when event is cancelled
  async sendEventCancellationEmail(to, { firstName, eventTitle, reason }) {
    return this.sendEmail({
      to,
      subject: `Event Cancelled: "${eventTitle}"`,
      html: `<h2>Hi ${firstName},</h2>
        <p>We're sorry to inform you that <strong>${eventTitle}</strong> has been cancelled.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you made a payment, a refund will be processed automatically.</p>
        <p>We apologize for any inconvenience.</p>`
    });
  }

  // Notify attendees when event is updated
  async sendEventUpdateEmail(to, { firstName, eventTitle, changes }) {
    return this.sendEmail({
      to,
      subject: `Event Updated: "${eventTitle}"`,
      html: `<h2>Hi ${firstName},</h2>
        <p>The event "<strong>${eventTitle}</strong>" has been updated.</p>
        ${changes ? `<p><strong>Changes:</strong> ${changes}</p>` : ''}
        <p>Please check the event page for the latest details.</p>`
    });
  }

  // Custom organizer email to attendees
  async sendCustomOrganizerEmail(to, { firstName, eventTitle, subject, message, organizerName }) {
    return this.sendEmail({
      to,
      subject: `[${eventTitle}] ${subject}`,
      html: `<h2>Hi ${firstName},</h2>
        <p>A message from the organizer of "<strong>${eventTitle}</strong>":</p>
        <blockquote style="border-left: 3px solid #3b82f6; padding-left: 12px; margin: 16px 0; color: #374151;">${message}</blockquote>
        <p>— ${organizerName}</p>`
    });
  }
}

module.exports = new EmailService();