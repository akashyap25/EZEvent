const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Event = require('../models/event');
const Order = require('../models/order');
const { authenticateToken, requireAuth } = require('../middlewares/authMiddleware');

// Admin role check middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Dashboard overview stats
router.get('/stats', authenticateToken, requireAuth, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalOrders, recentUsers, recentEvents] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Event.countDocuments({ isDeleted: { $ne: true } }),
      Order.countDocuments({ status: 'completed' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email createdAt'),
      Event.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5).select('title organizer startDateTime status').populate('organizer', 'firstName lastName')
    ]);

    const revenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalEvents,
          totalOrders,
          totalRevenue: revenue[0]?.total || 0
        },
        recentUsers,
        recentEvents
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// List users (with search and pagination)
router.get('/users', authenticateToken, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const users = await User.find(filter)
      .select('-password -passwordHistory')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Update user role
router.patch('/users/:userId/role', authenticateToken, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Prevent self-demotion
    if (userId === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot change your own admin role' });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user, message: `User role updated to ${role}` });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

// Deactivate/activate user
router.patch('/users/:userId/status', authenticateToken, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }

    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user, message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Admin update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

// Export event attendees as CSV
router.get('/events/:eventId/export', authenticateToken, requireAuth, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('attendees', 'firstName lastName email username');
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const orders = await Order.find({ event: req.params.eventId, status: 'completed' })
      .populate('buyer', 'firstName lastName email');

    // Generate CSV
    const csvHeader = 'Name,Email,Order Status,Amount,Date\n';
    const csvRows = orders.map(order => {
      const buyer = order.buyer;
      return `"${buyer?.firstName || ''} ${buyer?.lastName || ''}","${buyer?.email || ''}","${order.status}","${order.totalAmount}","${order.createdAt?.toISOString() || ''}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="event-${req.params.eventId}-attendees.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
});

module.exports = router;
