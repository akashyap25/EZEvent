/**
 * Async Job Queue
 * 
 * Lightweight in-process background job processor.
 * Processes emails, SMS, and other async tasks without blocking HTTP handlers.
 * 
 * Features:
 * - Non-blocking: fire-and-forget from route handlers
 * - Retry with exponential backoff (3 attempts)
 * - Concurrency control (max 5 parallel jobs)
 * - Dead letter queue for failed jobs
 * - Upgradeable to BullMQ/Redis when ready
 */

class JobQueue {
  constructor(options = {}) {
    this.queue = [];
    this.processing = 0;
    this.maxConcurrency = options.concurrency || 5;
    this.maxRetries = options.maxRetries || 3;
    this.deadLetterQueue = [];
    this.stats = { processed: 0, failed: 0, retried: 0 };
    this.handlers = new Map();
    this.isProcessing = false;
  }

  /**
   * Register a job handler
   * @param {string} jobType - e.g., 'email', 'sms', 'notification'
   * @param {Function} handler - async function(data) => result
   */
  register(jobType, handler) {
    this.handlers.set(jobType, handler);
  }

  /**
   * Add a job to the queue (non-blocking, returns immediately)
   * @param {string} type - job type (must be registered)
   * @param {Object} data - job payload
   * @param {Object} options - { priority, delay, retries }
   */
  add(type, data, options = {}) {
    const job = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      data,
      attempts: 0,
      maxRetries: options.retries || this.maxRetries,
      priority: options.priority || 0,
      createdAt: Date.now(),
      delay: options.delay || 0
    };

    this.queue.push(job);
    // Sort by priority (higher first)
    this.queue.sort((a, b) => b.priority - a.priority);

    // Start processing if not already
    if (!this.isProcessing) {
      this._processNext();
    }

    return job.id;
  }

  /**
   * Process next jobs in queue
   */
  async _processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.processing < this.maxConcurrency) {
      const job = this.queue.shift();
      
      // Handle delayed jobs
      if (job.delay > 0 && Date.now() - job.createdAt < job.delay) {
        this.queue.push(job);
        setTimeout(() => this._processNext(), job.delay);
        continue;
      }

      this.processing++;
      this._executeJob(job).finally(() => {
        this.processing--;
        this._processNext();
      });
    }
  }

  /**
   * Execute a single job with retry logic
   */
  async _executeJob(job) {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      console.error(`[JobQueue] No handler for job type: ${job.type}`);
      this.deadLetterQueue.push({ ...job, error: 'No handler registered' });
      return;
    }

    try {
      job.attempts++;
      await handler(job.data);
      this.stats.processed++;
    } catch (error) {
      if (job.attempts < job.maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000; // 2s, 4s, 8s
        this.stats.retried++;
        setTimeout(() => {
          this.queue.push(job);
          this._processNext();
        }, delay);
      } else {
        // Max retries exceeded — move to dead letter queue
        this.stats.failed++;
        this.deadLetterQueue.push({
          ...job,
          error: error.message,
          failedAt: Date.now()
        });
        console.error(`[JobQueue] Job ${job.id} failed after ${job.attempts} attempts:`, error.message);
      }
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      queued: this.queue.length,
      processing: this.processing,
      deadLetter: this.deadLetterQueue.length
    };
  }

  /**
   * Get dead letter queue entries
   */
  getDeadLetterQueue() {
    return this.deadLetterQueue;
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue() {
    this.deadLetterQueue = [];
  }
}

// ─── Singleton Instance ──────────────────────────────────────────────────

const jobQueue = new JobQueue({ concurrency: 5, maxRetries: 3 });

// ─── Register Handlers ───────────────────────────────────────────────────

// Email handler
jobQueue.register('email', async (data) => {
  const EmailService = require('./emailService');
  const { method, args } = data;
  
  if (typeof EmailService[method] === 'function') {
    return await EmailService[method](...args);
  }
  throw new Error(`Unknown email method: ${method}`);
});

// SMS handler
jobQueue.register('sms', async (data) => {
  const smsService = require('./smsService');
  const { method, args } = data;
  
  if (typeof smsService[method] === 'function') {
    return await smsService[method](...args);
  }
  throw new Error(`Unknown SMS method: ${method}`);
});

// Push notification handler
jobQueue.register('push', async (data) => {
  const pushService = require('./pushNotificationService');
  const { method, args } = data;
  
  if (typeof pushService[method] === 'function') {
    return await pushService[method](...args);
  }
  throw new Error(`Unknown push method: ${method}`);
});

// Generic notification handler
jobQueue.register('notification', async (data) => {
  const NotificationService = require('./notificationService');
  const { method, args } = data;
  
  if (typeof NotificationService[method] === 'function') {
    return await NotificationService[method](...args);
  }
  throw new Error(`Unknown notification method: ${method}`);
});

// ─── Helper Functions ────────────────────────────────────────────────────

/**
 * Queue an email to be sent in the background
 * @param {string} method - EmailService method name
 * @param  {...any} args - Arguments to pass to the method
 */
const queueEmail = (method, ...args) => {
  return jobQueue.add('email', { method, args }, { priority: 5 });
};

/**
 * Queue an SMS to be sent in the background
 * @param {string} method - smsService method name
 * @param  {...any} args - Arguments to pass
 */
const queueSMS = (method, ...args) => {
  return jobQueue.add('sms', { method, args }, { priority: 3 });
};

/**
 * Queue a push notification
 * @param {string} method - pushService method name
 * @param  {...any} args - Arguments to pass
 */
const queuePush = (method, ...args) => {
  return jobQueue.add('push', { method, args }, { priority: 2 });
};

/**
 * Queue a generic notification
 * @param {string} method - NotificationService method name
 * @param  {...any} args - Arguments to pass
 */
const queueNotification = (method, ...args) => {
  return jobQueue.add('notification', { method, args }, { priority: 1 });
};

module.exports = {
  jobQueue,
  queueEmail,
  queueSMS,
  queuePush,
  queueNotification
};
