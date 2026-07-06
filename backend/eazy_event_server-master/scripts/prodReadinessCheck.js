/**
 * Production Readiness Check Script
 * Run: node scripts/prodReadinessCheck.js
 * 
 * Validates the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

const results = { pass: [], fail: [], warn: [] };

function check(name, condition, message) {
  if (condition) {
    results.pass.push(`✅ ${name}`);
  } else {
    results.fail.push(`❌ ${name}: ${message}`);
  }
}

function warn(name, condition, message) {
  if (!condition) {
    results.warn.push(`⚠️  ${name}: ${message}`);
  }
}

// --- ENVIRONMENT CHECKS ---
// Check required env vars
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'SESSION_SECRET', 'CSRF_SECRET'];
const optionalEnvVars = ['STRIPE_SECRET_KEY', 'GOOGLE_GEMINI_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'REDIS_URL'];

requiredEnvVars.forEach(v => {
  check(`ENV: ${v}`, process.env[v], `Required environment variable ${v} is not set`);
});

optionalEnvVars.forEach(v => {
  warn(`ENV: ${v}`, process.env[v], `Optional - feature will be disabled`);
});

// --- SECURITY CHECKS ---
check('JWT_SECRET length', 
  (process.env.JWT_SECRET || '').length >= 64, 
  'JWT_SECRET should be at least 64 characters');

check('NODE_ENV is production', 
  process.env.NODE_ENV === 'production', 
  'NODE_ENV should be "production" for deployment');

warn('STRIPE_WEBHOOK_SECRET', 
  process.env.STRIPE_WEBHOOK_SECRET, 
  'Stripe webhook verification will not work');

// --- FILE CHECKS ---
const criticalFiles = [
  'app.js',
  'package.json',
  'package-lock.json',
  'Dockerfile',
  'docker-compose.yml',
  '.env.example'
];

criticalFiles.forEach(file => {
  check(`File: ${file}`, fs.existsSync(path.join(__dirname, '..', file)), `Missing: ${file}`);
});

// Check no .env file committed (security)
const envFile = path.join(__dirname, '..', '.env');
warn('.env not in repo', 
  !fs.existsSync(envFile) || process.env.CI, 
  '.env file exists - ensure it is in .gitignore');

// --- DEPENDENCY CHECKS ---
const pkg = require('../package.json');

check('nodemon not in production start', 
  !pkg.scripts.start?.includes('nodemon'), 
  'Production start script should use "node" not "nodemon"');

check('jest in devDependencies', 
  pkg.devDependencies?.jest !== undefined, 
  'jest should be in devDependencies, not dependencies');

// Check for known vulnerable patterns
const appContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
check('No eval() usage', 
  !appContent.includes('eval('), 
  'eval() found in app.js - security risk');

check('No hardcoded secrets', 
  !appContent.includes("'your-secret-key'"), 
  'Hardcoded secret found in code');

// --- PERFORMANCE CHECKS ---
const modelsDir = path.join(__dirname, '..', 'models');
if (fs.existsSync(modelsDir)) {
  const models = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
  check('Models exist', models.length > 0, 'No model files found');
  
  // Check for indexes
  const indexConfig = path.join(__dirname, '..', 'config', 'databaseIndexes.js');
  check('Database indexes configured', fs.existsSync(indexConfig), 'No database index configuration found');
}

// --- DOCKER CHECKS ---
const dockerfile = path.join(__dirname, '..', 'Dockerfile');
if (fs.existsSync(dockerfile)) {
  const dockerContent = fs.readFileSync(dockerfile, 'utf8');
  check('Multi-stage Docker build', 
    dockerContent.includes('AS production'), 
    'Dockerfile should use multi-stage builds');
  check('Non-root user in Docker', 
    dockerContent.includes('USER'), 
    'Dockerfile should run as non-root user');
  check('Health check in Docker', 
    dockerContent.includes('HEALTHCHECK'), 
    'Dockerfile should include HEALTHCHECK');
}

// --- API CHECKS ---
check('Health endpoint exists', 
  appContent.includes("/health"), 
  'No /health endpoint found');

check('Error handler exists', 
  appContent.includes('errorHandler'), 
  'Global error handler not found');

check('Compression enabled', 
  appContent.includes('compression'), 
  'Response compression not enabled');

check('Helmet security headers', 
  appContent.includes('helmet') || appContent.includes('xssHelmetConfig'), 
  'Helmet security headers not configured');

// --- PRINT RESULTS ---
if (results.pass.length > 0) {
  results.pass.forEach(r => console.log(`  ${r}`));
}

if (results.warn.length > 0) {
  results.warn.forEach(r => console.log(`  ${r}`));
}

if (results.fail.length > 0) {
  results.fail.forEach(r => console.log(`  ${r}`));
}

process.exit(results.fail.length > 0 ? 1 : 0);

