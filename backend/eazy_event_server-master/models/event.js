const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 10000 },
  
  // Event mode: in-person, online, or hybrid
  mode: {
    type: String,
    enum: ['in-person', 'online', 'hybrid'],
    default: 'in-person'
  },
  
  // For in-person/hybrid events
  location: { type: String },
  venue: { type: String },
  address: { type: String },
  
  // For online/hybrid events
  meetingLink: { type: String },
  meetingPlatform: { type: String, enum: ['zoom', 'google_meet', 'teams', 'webex', 'other', ''] },
  meetingPassword: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  imageUrl: { type: String },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  price: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  url: { type: String },
  
  // Private organizer notes (not visible to attendees)
  notes: { type: String, maxlength: 2000 },
  
  // Multi-tier ticket types
  ticketTiers: [{
    name: { type: String, required: true }, // e.g., "General", "VIP", "Speaker"
    price: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 }, // 0 = unlimited
    sold: { type: Number, default: 0 },
    description: { type: String },
    perks: [String],
    salesStart: { type: Date },
    salesEnd: { type: Date },
    isActive: { type: Boolean, default: true }
  }],
  
  // Custom registration fields (organizer-defined)
  customFields: [{
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'email', 'phone', 'select', 'checkbox', 'textarea', 'number', 'date'], default: 'text' },
    required: { type: Boolean, default: false },
    options: [String], // For select/checkbox type
    placeholder: { type: String }
  }],
  
  // Branded microsite settings
  microsite: {
    enabled: { type: Boolean, default: false },
    slug: { type: String, unique: true, sparse: true }, // e.g., /e/my-awesome-event
    theme: { type: String, enum: ['default', 'minimal', 'bold', 'elegant'], default: 'default' },
    primaryColor: { type: String, default: '#3b82f6' },
    coverImage: { type: String },
    customCSS: { type: String },
    showCountdown: { type: Boolean, default: true },
    showSocialShare: { type: Boolean, default: true }
  },
  
  // Live polls & Q&A
  polls: [{
    question: { type: String, required: true },
    options: [{ text: String, votes: { type: Number, default: 0 } }],
    isActive: { type: Boolean, default: false },
    allowMultiple: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Event feed/timeline posts
  feed: [{
    author: { type: mongoose.Schema.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    type: { type: String, enum: ['update', 'announcement', 'photo', 'poll_result'], default: 'update' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Engagement tracking
  engagement: {
    totalViews: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    avgTimeOnPage: { type: Number, default: 0 } // seconds
  },
  
  // Reminder scheduling
  reminders: {
    sent24h: { type: Boolean, default: false },
    sent1h: { type: Boolean, default: false },
    sentPostEvent: { type: Boolean, default: false }
  },
  
  // Post-event survey
  survey: {
    enabled: { type: Boolean, default: false },
    questions: [{
      question: { type: String },
      type: { type: String, enum: ['rating', 'text', 'multiple_choice'], default: 'rating' },
      options: [String]
    }],
    responses: [{
      user: { type: mongoose.Schema.ObjectId, ref: 'User' },
      answers: [mongoose.Schema.Types.Mixed],
      submittedAt: { type: Date, default: Date.now }
    }]
  },
  
  // Networking settings
  networking: {
    enabled: { type: Boolean, default: false },
    matchingCriteria: [String], // e.g., ['industry', 'role', 'interests']
    allowDirectMessage: { type: Boolean, default: true }
  },

  category: { type: mongoose.Schema.ObjectId, ref: 'Category' },
  organizer: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  
  // Organization/Multi-tenant support
  organizationId: { 
    type: mongoose.Schema.ObjectId, 
    ref: 'Organization',
    index: true
  },
  visibility: {
    type: String,
    enum: ['public', 'organization', 'private', 'unlisted'],
    default: 'public'
  },
  capacity: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'pending_approval', 'upcoming', 'ongoing', 'completed', 'cancelled', 'rejected'], 
    default: 'upcoming' 
  },
  
  // Approval workflow
  approvalStatus: {
    type: String,
    enum: ['not_required', 'pending', 'approved', 'rejected'],
    default: 'not_required'
  },
  approvedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  
  tags: [{ type: String }],
  attendees: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  
  // Recurring event support
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    type: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
      default: 'weekly'
    },
    interval: { type: Number, default: 1 }, // Every X days/weeks/months/years
    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0 = Sunday, 1 = Monday, etc.
    dayOfMonth: { type: Number, min: 1, max: 31 },
    endDate: { type: Date }, // When to stop recurring
    occurrences: { type: Number }, // Maximum number of occurrences
    customRule: { type: String } // For complex recurring patterns
  },
  parentEvent: { type: mongoose.Schema.ObjectId, ref: 'Event' }, // Reference to original recurring event
  recurringGroupId: { type: String }, // Groups all instances of a recurring event
  
  // Event collaboration
  coOrganizers: [{ 
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    role: { 
      type: String, 
      enum: ['co-organizer', 'assistant', 'moderator'],
      default: 'co-organizer'
    },
    permissions: [{
      type: String,
      enum: ['edit', 'delete', 'manage_attendees', 'send_emails', 'view_analytics']
    }],
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
  }],
  
  // Event analytics
  analytics: {
    views: { type: Number, default: 0 },
    registrations: { type: Number, default: 0 },
    checkIns: { type: Number, default: 0 },
    lastViewed: { type: Date },
    conversionRate: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 }
  },
  
  // Event template reference
  templateId: { type: mongoose.Schema.ObjectId, ref: 'EventTemplate' },
  
  // Export settings
  exportSettings: {
    allowICalExport: { type: Boolean, default: true },
    allowGoogleCalendarExport: { type: Boolean, default: true },
    allowOutlookExport: { type: Boolean, default: true }
  },
  
  // Soft delete support
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
});

// Middleware to update `updatedAt` before saving
EventSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
EventSchema.index({ organizer: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ startDateTime: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ createdAt: -1 });
EventSchema.index({ organizationId: 1, visibility: 1 });
EventSchema.index({ organizationId: 1, status: 1, startDateTime: 1 });
EventSchema.index({ title: 'text', description: 'text' }); // Text search index

const Event = mongoose.model('Event', EventSchema);
module.exports = Event;
