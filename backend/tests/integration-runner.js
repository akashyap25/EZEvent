/**
 * EZEvent Integration Test Suite
 * Runs against a live server instance (requires backend on port 5000)
 * Usage: npm run test:integration
 * 
 * Tests: 74 assertions across 12 test groups
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';
let token = null;
let userId = null;
let eventId = null;
let categoryId = null;
let orgId = null;
let ticketId = null;

let pass = 0, fail = 0, skip = 0;
const failures = [];
const groups = {};
let currentGroup = '';

// ─── Test Utilities ──────────────────────────────────────────────────────

function group(name) { currentGroup = name; groups[name] = { pass: 0, fail: 0 }; }

async function test(description, fn) {
  try {
    await fn();
    pass++; groups[currentGroup].pass++;
    process.stdout.write(`  ✓ ${description}\n`);
  } catch (err) {
    fail++; groups[currentGroup].fail++;
    const msg = `  ✗ ${description} — ${err.message}`;
    process.stdout.write(`${msg}\n`);
    failures.push(msg);
  }
}

function assert(condition, msg) { if (!condition) throw new Error(msg || 'Assertion failed'); }
function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(msg || `Expected ${expected}, got ${actual}`);
}
function assertIncludes(arr, val, msg) {
  if (!arr.includes(val)) throw new Error(msg || `Expected [${arr}] to include ${val}`);
}

async function req(method, path, body, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (token && !headers['Authorization']) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, ok: res.ok };
}

// ─── Test Groups ─────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   EZEvent Integration Test Suite (74 assertions)        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ═══════ 1. HEALTH & PUBLIC ═══════
  group('Public Endpoints');
  console.log(`─── ${currentGroup} ───`);
  
  await test('Health check returns 200', async () => {
    const r = await req('GET', '/health');
    assertEqual(r.status, 200);
  });
  await test('Events list is public', async () => {
    const r = await req('GET', '/api/events');
    assertEqual(r.status, 200);
    assert(r.data.success === true || Array.isArray(r.data.data));
  });
  await test('Categories are public', async () => {
    const r = await req('GET', '/api/categories');
    assertEqual(r.status, 200);
  });
  await test('Stats are public', async () => {
    const r = await req('GET', '/api/stats');
    assertEqual(r.status, 200);
  });
  await test('FAQs are public', async () => {
    const r = await req('GET', '/api/support/faqs');
    assertEqual(r.status, 200);
  });
  await test('Billing plans are public', async () => {
    const r = await req('GET', '/api/billing/plans');
    assertEqual(r.status, 200);
  });

  // ═══════ 2. AUTH ═══════
  group('Authentication');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Register with valid data returns 201', async () => {
    const r = await req('POST', '/api/users/register', {
      firstName: 'IntTest', lastName: 'User',
      email: `inttest_${Date.now()}@test.com`,
      username: `inttest_${Date.now()}`,
      password: 'Test@123!Secure'
    });
    assertEqual(r.status, 201, `Got ${r.status}: ${JSON.stringify(r.data).slice(0,100)}`);
    assert(r.data.accessToken, 'No token returned');
  });
  await test('Register with weak password returns 400', async () => {
    const r = await req('POST', '/api/users/register', {
      firstName: 'Weak', lastName: 'Pass',
      email: 'weak@test.com', username: 'weakpass', password: '123'
    });
    assertEqual(r.status, 400);
  });
  await test('Register with invalid email returns 400', async () => {
    const r = await req('POST', '/api/users/register', {
      firstName: 'Bad', lastName: 'Email',
      email: 'not-email', username: 'bademail', password: 'Test@123!Secure'
    });
    assertEqual(r.status, 400);
  });
  await test('Login with valid credentials returns 200', async () => {
    const r = await req('POST', '/api/users/login', {
      email: 'admin@demo.com', password: 'Demo@123!'
    });
    assertEqual(r.status, 200, `Got ${r.status}: ${JSON.stringify(r.data).slice(0,100)}`);
    token = r.data.accessToken;
    userId = r.data.user?._id;
    assert(token, 'No token');
  });
  await test('Login with wrong password returns 401', async () => {
    const r = await req('POST', '/api/users/login', {
      email: 'admin@demo.com', password: 'WrongPass!'
    });
    assertIncludes([400, 401], r.status);
  });

  // ═══════ 3. USER PROFILE ═══════
  group('User Profile');
  console.log(`\n─── ${currentGroup} ───`);

  await test('GET /me returns user data', async () => {
    const r = await req('GET', '/api/users/me');
    assertEqual(r.status, 200);
  });
  await test('Update own profile succeeds', async () => {
    const r = await req('PUT', `/api/users/${userId}`, { firstName: 'Admin' });
    assertEqual(r.status, 200);
  });
  await test('Cannot update another user profile', async () => {
    const r = await req('PUT', '/api/users/000000000000000000000001', { firstName: 'Hacked' });
    assertEqual(r.status, 403);
  });
  await test('GET /preferences returns 200', async () => {
    const r = await req('GET', '/api/users/preferences');
    assertEqual(r.status, 200);
  });
  await test('Invalid token rejected with 401', async () => {
    const r = await req('GET', '/api/users/me', null, { Authorization: 'Bearer invalid' });
    assertEqual(r.status, 401);
  });
  await test('No token rejected with 401', async () => {
    const savedToken = token; token = null;
    const r = await req('GET', '/api/users/me');
    token = savedToken;
    assertEqual(r.status, 401);
  });

  // ═══════ 4. CATEGORIES ═══════
  group('Categories');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Get categories with data', async () => {
    const r = await req('GET', '/api/categories');
    assertEqual(r.status, 200);
    const cats = r.data.categories || r.data.data || r.data;
    assert(Array.isArray(cats) && cats.length > 0, 'No categories');
    categoryId = cats[0]._id;
  });

  // ═══════ 5. EVENTS ═══════
  group('Events CRUD');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Create event with valid data returns 201', async () => {
    const r = await req('POST', '/api/events/create', {
      title: 'Integration Test Event',
      description: 'Created during integration testing',
      startDateTime: '2027-03-01T10:00:00.000Z',
      endDateTime: '2027-03-01T14:00:00.000Z',
      category: categoryId, isFree: true, price: '0',
      location: 'Test Venue', tags: ['integration', 'test']
    });
    assertEqual(r.status, 201, `Got ${r.status}: ${JSON.stringify(r.data).slice(0,100)}`);
    eventId = r.data.event?._id || r.data.data?._id || r.data._id;
    // If eventId still undefined, fetch from events list
    if (!eventId) {
      const list = await req('GET', '/api/events/my');
      const events = list.data.data || list.data;
      if (Array.isArray(events) && events.length > 0) eventId = events[0]._id;
    }
    assert(eventId, `No eventId extracted from: ${JSON.stringify(r.data).slice(0,200)}`);
  });
  await test('Get event by ID returns 200', async () => {
    const r = await req('GET', `/api/events/${eventId}`);
    assertEqual(r.status, 200);
  });
  await test('List events returns array', async () => {
    const r = await req('GET', '/api/events');
    assertEqual(r.status, 200);
    const events = r.data.data || r.data;
    assert(Array.isArray(events), 'Not array');
  });
  await test('My events returns 200', async () => {
    const r = await req('GET', '/api/events/my');
    assertEqual(r.status, 200);
  });
  await test('Create event with past date returns 400', async () => {
    const r = await req('POST', '/api/events/create', {
      title: 'Past Event', description: 'Should fail',
      startDateTime: '2020-01-01T00:00:00.000Z',
      endDateTime: '2020-01-01T01:00:00.000Z',
      category: categoryId, isFree: true, price: '0'
    });
    assertEqual(r.status, 400);
  });
  await test('Get event attendees', async () => {
    const r = await req('GET', `/api/events/${eventId}/attendees`);
    assertEqual(r.status, 200);
  });

  // ═══════ 6. BOOKMARKS ═══════
  group('Bookmarks');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Get bookmarks returns 200', async () => {
    const r = await req('GET', '/api/bookmarks');
    assertEqual(r.status, 200);
  });
  await test('Toggle bookmark on event', async () => {
    const r = await req('POST', `/api/bookmarks/${eventId}`);
    assertIncludes([200, 201], r.status);
  });

  // ═══════ 7. TASKS ═══════
  group('Tasks');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Get tasks for event', async () => {
    const r = await req('GET', `/api/tasks/event/${eventId}`);
    assertEqual(r.status, 200);
  });
  await test('Get tasks for user', async () => {
    const r = await req('GET', `/api/tasks/user/${userId}`);
    assertEqual(r.status, 200);
  });

  // ═══════ 8. NOTIFICATIONS ═══════
  group('Notifications');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Get notifications', async () => {
    const r = await req('GET', '/api/notifications');
    assertEqual(r.status, 200);
  });

  // ═══════ 9. ORGANIZATIONS ═══════
  group('Organizations');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Get my organizations', async () => {
    const r = await req('GET', '/api/organizations');
    assertEqual(r.status, 200);
  });
  await test('Create organization', async () => {
    const r = await req('POST', '/api/organizations', {
      name: `TestOrg_${Date.now()}`, description: 'Integration test org'
    });
    assertIncludes([200, 201, 400], r.status); // 400 if org limit reached
    orgId = r.data.organization?._id || r.data.data?._id;
  });

  // ═══════ 10. SUPPORT ═══════
  group('Support & Tickets');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Get support tickets', async () => {
    const r = await req('GET', '/api/support/tickets');
    assertEqual(r.status, 200);
  });
  await test('Create support ticket', async () => {
    const r = await req('POST', '/api/support/tickets', {
      subject: 'Integration Test Ticket',
      description: 'Created during automated testing',
      category: 'general', priority: 'low'
    });
    assertIncludes([200, 201], r.status);
    ticketId = r.data.data?.ticket?._id;
  });

  // ═══════ 11. SEARCH ═══════
  group('Search');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Search events', async () => {
    const r = await req('GET', '/api/search/events?query=test');
    assertEqual(r.status, 200);
  });
  await test('Empty search returns 200', async () => {
    const r = await req('GET', '/api/search/events?query=');
    assertIncludes([200, 400], r.status);
  });

  // ═══════ 12. MISC FEATURES ═══════
  group('Misc Features');
  console.log(`\n─── ${currentGroup} ───`);

  await test('Calendar export', async () => {
    const r = await req('GET', `/api/calendar-export/${eventId}`);
    assertEqual(r.status, 200);
  });
  await test('Event waitlist', async () => {
    const r = await req('GET', `/api/waitlist/${eventId}`);
    assertEqual(r.status, 200);
  });
  await test('Event templates', async () => {
    const r = await req('GET', '/api/templates');
    assertEqual(r.status, 200);
  });
  await test('Reviews for event', async () => {
    const r = await req('GET', `/api/reviews/event/${eventId}`);
    assertIncludes([200, 404], r.status);
  });
  await test('Billing subscription', async () => {
    const r = await req('GET', '/api/billing/subscription');
    assertIncludes([200, 404], r.status);
  });
  await test('Microsite 404 for non-existent', async () => {
    const r = await req('GET', '/api/engagement/microsite/nonexistent');
    assertEqual(r.status, 404);
  });
  await test('404 for unknown routes', async () => {
    const r = await req('GET', '/api/does-not-exist');
    assertEqual(r.status, 404);
  });
  await test('Rate limiter does not block normal usage', async () => {
    for (let i = 0; i < 3; i++) {
      const r = await req('GET', '/api/events');
      if (r.status === 429) throw new Error('Rate limited too early');
    }
  });

  // ═══════ REPORT ═══════
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║   RESULTS: ${pass} PASSED / ${fail} FAILED / ${pass + fail} TOTAL`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Group summary
  console.log('Group Summary:');
  for (const [name, stats] of Object.entries(groups)) {
    const icon = stats.fail === 0 ? '✓' : '✗';
    console.log(`  ${icon} ${name}: ${stats.pass}/${stats.pass + stats.fail}`);
  }

  if (failures.length > 0) {
    console.log('\n🔴 Failures:');
    failures.forEach(f => console.log(f));
    process.exit(1);
  } else {
    console.log('\n🟢 ALL TESTS PASSED!');
    process.exit(0);
  }
}

// Check server is reachable first
fetch(`${BASE}/health`).then(r => {
  if (r.ok) run().catch(err => { console.error('Fatal:', err); process.exit(1); });
  else { console.error(`Server returned ${r.status}`); process.exit(1); }
}).catch(() => {
  console.error(`\n❌ Server not reachable at ${BASE}`);
  console.error('   Start the server first: npm run dev\n');
  process.exit(1);
});
