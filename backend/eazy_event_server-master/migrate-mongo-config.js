// migrate-mongo configuration
const config = {
  mongodb: {
    url: process.env.MONGO_URI || "mongodb://localhost:27017/eazy_event_dev",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
