/**
 * EZEvent Load Test
 * 
 * Simulates concurrent users hitting the API.
 * Usage: npm run loadtest
 * 
 * Configurable via env vars:
 *   LOAD_TEST_URL=http://localhost:5000 (default)
 *   LOAD_TEST_USERS=50 (concurrent virtual users)
 *   LOAD_TEST_DURATION=30 (seconds)
 */

const BASE = process.env.LOAD_TEST_URL || 'http://localhost:5000';
const VIRTUAL_USERS = parseInt(process.env.LOAD_TEST_USERS || '50');
const DURATION_SEC = parseInt(process.env.LOAD_TEST_DURATION || '30');

let stats = {
  requests: 0,
  successes: 0,
  failures: 0,
  latencies: [],
  errors: {},
  statusCodes: {}
};

let running = true;

async function makeRequest(method, path, body, headers = {}) {
  const start = Date.now();
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
    if (body) opts.body = JSON.stringify(body);
    
    const res = await fetch(`${BASE}${path}`, opts);
    const duration = Date.now() - start;
    
    stats.requests++;
    stats.latencies.push(duration);
    stats.statusCodes[res.status] = (stats.statusCodes[res.status] || 0) + 1;
    
    if (res.ok) {
      stats.successes++;
    } else {
      stats.failures++;
    }
    
    return { status: res.status, duration };
  } catch (err) {
    const duration = Date.now() - start;
    stats.requests++;
    stats.failures++;
    stats.latencies.push(duration);
    stats.errors[err.code || err.message] = (stats.errors[err.code || err.message] || 0) + 1;
    return { status: 0, duration, error: err.message };
  }
}

// Scenario: Typical user browsing flow
async function userScenario(userId) {
  while (running) {
    // 1. View homepage (events list)
    await makeRequest('GET', '/api/events');
    await sleep(randomDelay(100, 500));
    
    // 2. View categories
    await makeRequest('GET', '/api/categories');
    await sleep(randomDelay(50, 200));
    
    // 3. View a specific event
    await makeRequest('GET', '/api/events');
    await sleep(randomDelay(200, 800));
    
    // 4. Search events
    await makeRequest('GET', '/api/search/events?query=tech');
    await sleep(randomDelay(100, 400));
    
    // 5. Check health
    await makeRequest('GET', '/health');
    await sleep(randomDelay(500, 2000));
  }
}

// Scenario: Authenticated user
async function authUserScenario(userId) {
  // Login first
  const loginRes = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.com', password: 'Demo@123!' })
  });
  
  let token = null;
  try {
    const data = await loginRes.json();
    token = data.accessToken;
  } catch { return; }
  
  if (!token) return;
  const headers = { Authorization: `Bearer ${token}` };
  
  while (running) {
    // Authenticated actions
    await makeRequest('GET', '/api/users/me', null, headers);
    await sleep(randomDelay(200, 600));
    
    await makeRequest('GET', '/api/notifications', null, headers);
    await sleep(randomDelay(100, 300));
    
    await makeRequest('GET', '/api/bookmarks', null, headers);
    await sleep(randomDelay(300, 1000));
    
    await makeRequest('GET', '/api/events/my', null, headers);
    await sleep(randomDelay(500, 2000));
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomDelay(min, max) { return Math.floor(Math.random() * (max - min) + min); }

function calculatePercentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * (p / 100));
  return sorted[idx] || 0;
}

function printResults() {
  const duration = DURATION_SEC;
  const rps = (stats.requests / duration).toFixed(1);
  const avgLatency = stats.latencies.length > 0 
    ? (stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length).toFixed(0) 
    : 0;
  const p95 = calculatePercentile(stats.latencies, 95);
  const p99 = calculatePercentile(stats.latencies, 99);
  const maxLatency = Math.max(...stats.latencies, 0);
  const errorRate = stats.requests > 0 ? ((stats.failures / stats.requests) * 100).toFixed(1) : 0;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           LOAD TEST RESULTS                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`  Target:          ${BASE}`);
  console.log(`  Virtual Users:   ${VIRTUAL_USERS}`);
  console.log(`  Duration:        ${duration}s`);
  console.log(`  Total Requests:  ${stats.requests}`);
  console.log(`  Requests/sec:    ${rps}`);
  console.log('');
  console.log('  ─── Latency ───');
  console.log(`  Average:         ${avgLatency}ms`);
  console.log(`  P95:             ${p95}ms`);
  console.log(`  P99:             ${p99}ms`);
  console.log(`  Max:             ${maxLatency}ms`);
  console.log('');
  console.log('  ─── Reliability ───');
  console.log(`  Successes:       ${stats.successes}`);
  console.log(`  Failures:        ${stats.failures}`);
  console.log(`  Error Rate:      ${errorRate}%`);
  console.log('');
  console.log('  ─── Status Codes ───');
  Object.entries(stats.statusCodes).sort().forEach(([code, count]) => {
    console.log(`  ${code}: ${count}`);
  });
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('');
    console.log('  ─── Errors ───');
    Object.entries(stats.errors).forEach(([err, count]) => {
      console.log(`  ${err}: ${count}`);
    });
  }
  
  console.log('');
  
  // Pass/Fail criteria
  const passed = errorRate < 1 && p95 < 2000 && parseInt(rps) > 10;
  if (passed) {
    console.log('  ✅ PASSED — Error rate <1%, P95 <2s, RPS >10');
  } else {
    console.log('  ❌ FAILED —');
    if (errorRate >= 1) console.log(`     Error rate ${errorRate}% >= 1%`);
    if (p95 >= 2000) console.log(`     P95 ${p95}ms >= 2000ms`);
    if (parseInt(rps) <= 10) console.log(`     RPS ${rps} <= 10`);
  }
  
  process.exit(passed ? 0 : 1);
}

async function run() {
  console.log(`\n🚀 Starting load test: ${VIRTUAL_USERS} users for ${DURATION_SEC}s against ${BASE}\n`);
  
  // Check server is reachable
  try {
    const r = await fetch(`${BASE}/health`);
    if (!r.ok) throw new Error(`Health check returned ${r.status}`);
  } catch (err) {
    console.error(`❌ Server not reachable at ${BASE}: ${err.message}`);
    process.exit(1);
  }
  
  // Start virtual users (80% browsing, 20% authenticated)
  const browsingUsers = Math.floor(VIRTUAL_USERS * 0.8);
  const authUsers = VIRTUAL_USERS - browsingUsers;
  
  const promises = [];
  for (let i = 0; i < browsingUsers; i++) {
    promises.push(userScenario(i));
  }
  for (let i = 0; i < authUsers; i++) {
    promises.push(authUserScenario(i));
  }
  
  // Stop after duration
  setTimeout(() => {
    running = false;
    setTimeout(printResults, 2000); // Wait for in-flight requests
  }, DURATION_SEC * 1000);
  
  await Promise.allSettled(promises);
}

run();
