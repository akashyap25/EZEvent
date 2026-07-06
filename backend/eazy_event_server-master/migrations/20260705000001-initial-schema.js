/**
 * Migration: Initial schema setup
 * This serves as a baseline - documents the initial schema state
 */
module.exports = {
  async up(db) {
    // Create indexes that should exist from the start
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('events').createIndex({ organizer: 1, createdAt: -1 });
    await db.collection('events').createIndex({ category: 1, startDateTime: 1 });
    await db.collection('events').createIndex({ startDateTime: 1, status: 1 });
    await db.collection('orders').createIndex({ event: 1, createdAt: -1 });
    await db.collection('orders').createIndex({ buyer: 1, createdAt: -1 });
    await db.collection('organizations').createIndex({ slug: 1 }, { unique: true });
    await db.collection('organizations').createIndex({ owner: 1 });
    
    console.log('  ✓ Initial indexes created');
  },

  async down(db) {
    // Dropping indexes is generally safe
    await db.collection('users').dropIndex('email_1').catch(() => {});
    await db.collection('users').dropIndex('username_1').catch(() => {});
    console.log('  ✓ Initial indexes dropped');
  }
};
