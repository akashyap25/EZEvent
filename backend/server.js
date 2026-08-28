const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = require('./app');
const logger = require('./utils/logger');
const connectToMongo = require('./db/db');
const { cacheService } = require('./services/cacheService');
const cleanupService = require('./services/cleanupService');
const { performanceMonitor } = require('./utils/performanceMonitor');
const ChatSocket = require('./socket/chatSocket');

const port = process.env.PORT || 5000;

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || process.env.CLIENT_BASE_URL || 'http://localhost:5174',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Attach Redis adapter for multi-instance scaling (if Redis is configured)
if (process.env.REDIS_URL) {
  const { createAdapter } = require('@socket.io/redis-adapter');
  const { createClient } = require('redis');

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter connected — multi-instance ready');
    })
    .catch((err) => {
      logger.warn(`Socket.IO Redis adapter failed, using in-memory (single instance only): ${err.message}`);
    });
} else {
  logger.info('Socket.IO using in-memory adapter (single instance). Set REDIS_URL for multi-instance.');
}

// eslint-disable-next-line unused-imports/no-unused-vars
const chatSocket = new ChatSocket(io);

server.listen(port, async () => {
  await connectToMongo();

  try {
    await cacheService.connect();
  } catch (error) {
    logger.warn(`Redis cache service not available: ${error.message}`);
  }

  cleanupService.start();

  const reminderService = require('./services/reminderService');
  reminderService.start();

  setInterval(() => {
    performanceMonitor.exportMetrics();
  }, 60000); // Export metrics every minute

  const gracefulShutdown = () => {
    cleanupService.stop();
    server.close(async () => {
      try {
        await cacheService.disconnect();
        await mongoose.connection.close();
      } catch (err) {
        logger.error(`Error during shutdown: ${err.message}`);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});
