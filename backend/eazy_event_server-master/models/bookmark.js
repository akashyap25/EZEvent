const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
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
  }
}, { timestamps: true });

// Compound index to prevent duplicate bookmarks
BookmarkSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', BookmarkSchema);
