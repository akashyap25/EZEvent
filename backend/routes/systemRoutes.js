const express = require('express');
const { getCacheStats, clearCache } = require('../middlewares/cacheMiddleware');
const { performanceMonitor } = require('../utils/performanceMonitor');
const { getAllVersions, getVersionInfo } = require('../middlewares/apiVersioning');
const { getRateLimitStatus } = require('../middlewares/userRateLimiting');

// Ops/monitoring endpoints previously defined inline in app.js.
const router = express.Router();

router.get('/cache/stats', getCacheStats);
router.delete('/cache/clear', clearCache);

router.get('/performance/metrics', (req, res) => {
  res.json({ success: true, data: performanceMonitor.getMetrics() });
});

router.get('/performance/report', (req, res) => {
  res.json({ success: true, data: performanceMonitor.getPerformanceReport() });
});

router.get('/versions', getAllVersions);
router.get('/versions/:version', getVersionInfo);

router.get('/rate-limit-status', getRateLimitStatus);

// Public platform stats (cached, no auth needed)
router.get('/stats', async (req, res) => {
  try {
    const Event = require('../models/event');
    const User = require('../models/user');
    const Category = require('../models/category');
    const Order = require('../models/order');

    const [totalEvents, totalUsers, totalCategories, totalOrders] = await Promise.all([
      Event.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ isActive: true }),
      Category.countDocuments({ isDeleted: { $ne: true } }),
      Order.countDocuments({ status: 'completed' })
    ]);

    res.json({
      success: true,
      data: { totalEvents, totalUsers, totalCategories, totalOrders }
    });
  } catch (error) {
    res.json({
      success: true,
      data: { totalEvents: 0, totalUsers: 0, totalCategories: 0, totalOrders: 0 }
    });
  }
});

module.exports = router;
