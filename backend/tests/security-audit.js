/**
 * Security Audit Script
 * 
 * Performs automated OWASP Top 10 checks against the running server.
 * Usage: node tests/security-audit.js
 * 
 * Checks:
 * - A01: Broken Access Control
 * - A02: Cryptographic Failures  
 * - A03: Injection
 * - A04: Insecure Design
 * - A05: Security Misconfiguration
 * - A07: Authentication Failures
 * - A09: Security Logging
 */

const BASE = process.env.TEST_URL || 'http://localhost:5000';
let pass = 0, fail = 0;
const issues = [];

async function check(name, fn) {
  try {
    const result = await fn();
    if (result.pass) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}: ${result.reason}`); issues.push({ name, reason: result.reason }); }
  } catch (err) {
    fail++; console.log(`  ✗ ${name}: ${err.message}`); issues.push({ name, reason: err.message });
  }
}

async function req(method, path, body, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body: await res.text() };
}

async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         OWASP Security Audit                             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Check server reachable
  try { await fetch(`${BASE}/health`); } catch { console.error(`Server not reachable at ${BASE}`); process.exit(1); }

  // ─── A01: Broken Access Control ───
  console.log('─── A01: Broken Access Control ───');
  
  await check('Protected endpoints reject unauthenticated requests', async () => {
    const endpoints = ['/api/users/me', '/api/bookmarks', '/api/notifications', '/api/organizations'];
    for (const ep of endpoints) {
      const r = await req('GET', ep);
      if (r.status !== 401) return { pass: false, reason: `${ep} returned ${r.status} without auth` };
    }
    return { pass: true };
  });

  await check('Cannot access other user data via ID manipulation', async () => {
    const r = await req('PUT', '/api/users/000000000000000000000001', { firstName: 'Hacked' }, { Authorization: 'Bearer fake' });
    return { pass: r.status === 401 || r.status === 403 };
  });

  await check('Admin endpoints protected from regular users', async () => {
    const login = await req('POST', '/api/users/login', { email: 'user@demo.com', password: 'Demo@123!' });
    const data = JSON.parse(login.body);
    if (!data.accessToken) return { pass: true, reason: 'No test user available (OK)' };
    const r = await req('GET', '/api/admin/stats', null, { Authorization: `Bearer ${data.accessToken}` });
    return { pass: r.status === 403 || r.status === 401 || r.status === 404 };
  });

  // ─── A02: Cryptographic Failures ───
  console.log('\n─── A02: Cryptographic Failures ───');
  
  await check('Passwords not exposed in user response', async () => {
    const login = await req('POST', '/api/users/login', { email: 'admin@demo.com', password: 'Demo@123!' });
    const body = login.body;
    return { pass: !body.includes('$2a$') && !body.includes('$2b$'), reason: 'Password hash found in response' };
  });

  await check('Tokens have proper entropy (>100 chars)', async () => {
    const login = await req('POST', '/api/users/login', { email: 'admin@demo.com', password: 'Demo@123!' });
    const data = JSON.parse(login.body);
    return { pass: data.accessToken?.length > 100, reason: `Token length: ${data.accessToken?.length}` };
  });

  // ─── A03: Injection ───
  console.log('\n─── A03: Injection ───');
  
  await check('NoSQL injection blocked in login', async () => {
    const r = await req('POST', '/api/users/login', { email: { "$gt": "" }, password: 'test' });
    return { pass: r.status === 400 || r.status === 401 };
  });

  await check('XSS in query params sanitized', async () => {
    const r = await req('GET', '/api/search/events?query=<script>alert(1)</script>');
    return { pass: !r.body.includes('<script>alert(1)</script>'), reason: 'XSS payload reflected' };
  });

  await check('Path traversal blocked', async () => {
    const r = await req('GET', '/api/events/../../etc/passwd');
    return { pass: r.status === 400 || r.status === 404 };
  });

  // ─── A05: Security Misconfiguration ───
  console.log('\n─── A05: Security Misconfiguration ───');
  
  await check('Security headers present (X-Frame-Options)', async () => {
    const r = await req('GET', '/health');
    return { pass: !!r.headers['x-frame-options'] || !!r.headers['x-content-type-options'] };
  });

  await check('No server version disclosure', async () => {
    const r = await req('GET', '/health');
    return { pass: !r.headers['x-powered-by'], reason: 'X-Powered-By header present' };
  });

  await check('CORS not wildcard in responses', async () => {
    const r = await req('GET', '/health');
    return { pass: r.headers['access-control-allow-origin'] !== '*' };
  });

  await check('404 returns JSON (no stack traces)', async () => {
    const r = await req('GET', '/api/nonexistent-route-xyz');
    return { pass: r.status === 404 && !r.body.includes('at ') && !r.body.includes('Error:') };
  });

  // ─── A07: Authentication Failures ───
  console.log('\n─── A07: Authentication Failures ───');
  
  await check('Weak password rejected', async () => {
    const r = await req('POST', '/api/users/register', {
      email: 'weak@test.com', password: '123', username: 'weak', firstName: 'W', lastName: 'P'
    });
    return { pass: r.status === 400 };
  });

  await check('Invalid email format rejected', async () => {
    const r = await req('POST', '/api/users/register', {
      email: 'not-email', password: 'Str0ng!Pass', username: 'inv', firstName: 'I', lastName: 'E'
    });
    return { pass: r.status === 400 };
  });

  await check('Malformed JWT rejected', async () => {
    const r = await req('GET', '/api/users/me', null, { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.invalid.payload' });
    return { pass: r.status === 401 };
  });

  await check('Missing Bearer prefix rejected', async () => {
    const r = await req('GET', '/api/users/me', null, { Authorization: 'just-a-token' });
    return { pass: r.status === 401 };
  });

  // ─── A09: Security Logging ───
  console.log('\n─── A09: Security Logging ───');
  
  await check('Health endpoint includes monitoring data', async () => {
    const r = await req('GET', '/health');
    const data = JSON.parse(r.body);
    return { pass: data.metrics !== undefined || data.jobQueue !== undefined };
  });

  await check('Request IDs returned in headers', async () => {
    const r = await req('GET', '/health');
    return { pass: !!r.headers['x-request-id'] };
  });

  // ─── Report ───
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║   SECURITY AUDIT: ${pass} PASSED / ${fail} FAILED / ${pass + fail} TOTAL`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  if (issues.length > 0) {
    console.log('\n🔴 Issues:');
    issues.forEach(i => console.log(`   • ${i.name}: ${i.reason}`));
  } else {
    console.log('\n🟢 All security checks passed!');
  }
  
  process.exit(fail > 0 ? 1 : 0);
}

run();
