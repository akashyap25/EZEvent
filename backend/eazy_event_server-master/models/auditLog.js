const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  // Who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // What organization context (optional — null for platform-level actions)
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  
  // Action type
  action: {
    type: String,
    required: true,
    enum: [
      // Member actions
      'member_invited', 'member_removed', 'member_role_changed', 'member_joined', 'member_left',
      // Event actions
      'event_created', 'event_updated', 'event_deleted', 'event_published', 'event_cancelled',
      'event_approved', 'event_rejected',
      // Org actions
      'organization_created', 'organization_updated', 'organization_deleted',
      'settings_updated', 'ownership_transferred',
      // User actions
      'user_registered', 'user_login', 'user_deactivated', 'password_changed'
    ],
    index: true
  },
  
  // Target of the action
  targetType: {
    type: String,
    enum: ['user', 'event', 'organization', 'member', 'settings']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Human-readable description
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // IP and device info
  ipAddress: { type: String },
  userAgent: { type: String }
  
}, { timestamps: true });

// Indexes for efficient querying
AuditLogSchema.index({ organization: 1, createdAt: -1 });
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

// TTL: auto-delete logs older than 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static helper to create log entry
AuditLogSchema.statics.log = async function({ user, organization, action, targetType, targetId, description, metadata, req }) {
  return this.create({
    user,
    organization,
    action,
    targetType,
    targetId,
    description,
    metadata,
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get?.('User-Agent')
  });
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);
