const express = require('express');
const router = express.Router();
const {
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  getUserOrganizations,
  getMembers,
  inviteMember,
  acceptInvite,
  declineInvite,
  getPendingInvites,
  cancelInvite,
  updateMemberRole,
  removeMember,
  leaveOrganization,
  transferOwnership
} = require('../controllers/organizationController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { 
  requireOrganization, 
  requireOrgRole, 
  requireOrgOwner,
  requireOrgPermission
} = require('../middlewares/organizationMiddleware');

// Public routes
router.get('/:id', getOrganization);

// Authenticated routes
router.use(authenticateToken);

// User's organizations
router.get('/', getUserOrganizations);
router.post('/', createOrganization);

// Invite routes (don't require org context since user might not be member yet)
router.post('/invites/:token/accept', acceptInvite);
router.post('/invites/:token/decline', declineInvite);

// Organization-specific routes (require membership)
router.use('/:orgId', async (req, res, next) => {
  req.headers['x-organization-id'] = req.params.orgId;
  next();
}, requireOrganization);

// Organization management
router.put('/:orgId', requireOrgRole(['owner', 'admin']), updateOrganization);
router.delete('/:orgId', requireOrgOwner, deleteOrganization);

// Members management
router.get('/:orgId/members', getMembers);
router.post('/:orgId/members/invite', requireOrgPermission('manage_members'), inviteMember);
router.get('/:orgId/invites', requireOrgPermission('manage_members'), getPendingInvites);
router.delete('/:orgId/invites/:inviteId', requireOrgPermission('manage_members'), cancelInvite);
router.put('/:orgId/members/:memberId/role', requireOrgPermission('manage_members'), updateMemberRole);
router.delete('/:orgId/members/:memberId', requireOrgPermission('manage_members'), removeMember);
router.post('/:orgId/leave', leaveOrganization);
router.post('/:orgId/transfer-ownership', requireOrgOwner, transferOwnership);

// Org-scoped events listing
router.get('/:orgId/events', async (req, res) => {
  try {
    const Event = require('../models/event');
    const { page = 1, limit = 20, status } = req.query;
    
    const filter = { 
      organizationId: req.params.orgId, 
      isDeleted: { $ne: true } 
    };
    if (status) filter.status = status;

    const events = await Event.find(filter)
      .populate('category', 'name')
      .populate('organizer', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: events,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk invite members (CSV/array)
router.post('/:orgId/members/bulk-invite', requireOrgPermission('manage_members'), async (req, res) => {
  try {
    const { emails, role = 'member' } = req.body;
    const OrganizationInvite = require('../models/organizationInvite');
    const crypto = require('crypto');
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'emails array is required' });
    }

    if (emails.length > 100) {
      return res.status(400).json({ success: false, message: 'Maximum 100 invites at a time' });
    }

    const validRoles = ['member', 'viewer', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be: ${validRoles.join(', ')}` });
    }

    const results = { sent: [], failed: [], duplicates: [] };

    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        results.failed.push({ email: trimmedEmail, reason: 'Invalid email format' });
        continue;
      }

      // Check if already invited or member
      const existing = await OrganizationInvite.findOne({
        organization: req.params.orgId,
        email: trimmedEmail,
        status: 'pending'
      });

      if (existing) {
        results.duplicates.push(trimmedEmail);
        continue;
      }

      // Create invite
      const token = crypto.randomBytes(32).toString('hex');
      await OrganizationInvite.create({
        organization: req.params.orgId,
        email: trimmedEmail,
        role,
        token,
        invitedBy: req.user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      results.sent.push(trimmedEmail);
    }

    res.json({
      success: true,
      message: `${results.sent.length} invites sent, ${results.duplicates.length} duplicates skipped, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Organization settings update
router.put('/:orgId/settings', requireOrgRole(['owner', 'admin']), async (req, res) => {
  try {
    const Organization = require('../models/organization');
    const { settings } = req.body;
    
    const org = await Organization.findByIdAndUpdate(
      req.params.orgId,
      { $set: { settings } },
      { new: true, runValidators: true }
    );

    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.json({ success: true, data: org.settings, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Organization dashboard stats
router.get('/:orgId/dashboard', async (req, res) => {
  try {
    const Event = require('../models/event');
    const Order = require('../models/order');
    const OrgMember = require('../models/organizationMember');

    const orgId = req.params.orgId;

    const [totalEvents, totalMembers, totalOrders, recentEvents] = await Promise.all([
      Event.countDocuments({ organizationId: orgId, isDeleted: { $ne: true } }),
      OrgMember.countDocuments({ organization: orgId, status: 'active' }),
      Order.countDocuments({ organizationId: orgId, status: 'completed' }),
      Event.find({ organizationId: orgId, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title startDateTime status attendees')
    ]);

    const revenue = await Order.aggregate([
      { $match: { organizationId: require('mongoose').Types.ObjectId(orgId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        totalMembers,
        totalOrders,
        totalRevenue: revenue[0]?.total || 0,
        recentEvents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Audit log for organization
router.get('/:orgId/audit-log', requireOrgRole(['owner', 'admin']), async (req, res) => {
  try {
    const AuditLog = require('../models/auditLog');
    const { page = 1, limit = 50, action } = req.query;
    
    const filter = { organization: req.params.orgId };
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
