const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  position: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'registered', 'expired'],
    default: 'waiting'
  },
  notifiedAt: {
    type: Date
  },
  expiresAt: {
    type: Date  // Time limit to register after being notified
  }
}, { timestamps: true });

// Compound index to prevent duplicate waitlist entries
WaitlistSchema.index({ user: 1, event: 1 }, { unique: true });
WaitlistSchema.index({ event: 1, position: 1 });

module.exports = mongoose.model('Waitlist', WaitlistSchema);
