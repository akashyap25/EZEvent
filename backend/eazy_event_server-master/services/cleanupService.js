const Token = require('../models/Token');
const PasswordReset = require('../models/PasswordReset');
const { cleanupExpiredTokens } = require('../middlewares/secureAuth');

class CleanupService {
  constructor() {
    this.isRunning = false;
  }

  // Start the cleanup service
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    // Run cleanup every hour
    this.interval = setInterval(async () => {
      await this.runCleanup();
    }, 60 * 60 * 1000); // 1 hour

    // Run initial cleanup
    this.runCleanup();
  }

  // Stop the cleanup service
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    }

  // Run cleanup tasks
  async runCleanup() {
    try {
      const results = await Promise.allSettled([
        this.cleanupExpiredTokens(),
        this.cleanupExpiredPasswordResets(),
        this.cleanupOldSessions()
      ]);

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Cleanup task ${index} failed:`, result.reason);
        }
      });

      } catch (error) {
      console.error('Cleanup service error:', error);
    }
  }

  // Clean up expired tokens
  async cleanupExpiredTokens() {
    try {
      const result = await Token.cleanupExpiredTokens();
      return result;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }

  // Clean up expired password reset requests
  async cleanupExpiredPasswordResets() {
    try {
      const result = await PasswordReset.cleanupExpiredRequests();
      return result;
    } catch (error) {
      console.error('Error cleaning up expired password resets:', error);
      throw error;
    }
  }

  // Clean up old sessions (optional - handled by MongoDB TTL)
  async cleanupOldSessions() {
    try {
      // This would be handled by MongoDB TTL indexes
      // But we can add custom cleanup logic here if needed
      return { deletedCount: 0 };
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
      throw error;
    }
  }

  // Manual cleanup trigger
  async manualCleanup() {
    await this.runCleanup();
  }
}

module.exports = new CleanupService();
