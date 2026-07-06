/**
 * Test setup and helpers
 */
const mongoose = require('mongoose');

// Connect to test database before all tests
beforeAll(async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eazy_event_test';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
});

// Clean up after all tests
afterAll(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await mongoose.connection.close();
});

// Helper to create a test user and get auth token
const createTestUser = async (overrides = {}) => {
  const User = require('../models/user');
  const { generateToken } = require('../middlewares/customAuth');
  
  const userData = {
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    username: `testuser${Date.now()}`,
    firstName: 'Test',
    lastName: 'User',
    authProvider: 'local',
    ...overrides
  };

  const user = await User.create(userData);
  const token = generateToken(user._id.toString());

  return { user, token };
};

module.exports = { createTestUser };
