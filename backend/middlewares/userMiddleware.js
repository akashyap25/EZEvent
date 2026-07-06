const User = require('../models/user');

// Middleware to ensure user exists in database
const ensureUserExists = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return next();
    }

    const userId = req.auth.userId;
    let user = await User.findById(userId);

    if (!user) {
      // Create user if they don't exist
      const userData = {
        clerkId: req.auth.clerkId || userId,
        email: `${userId}@local.app`,
        username: `user_${userId.slice(-8)}`,
        firstName: 'User',
        lastName: 'Name',
        photo: '',
      };

      user = await User.create(userData);
      } else {
      }

    // Attach user to request for use in other middleware/controllers
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in ensureUserExists middleware:', error);
    next(error);
  }
};

module.exports = {
  ensureUserExists,
};
