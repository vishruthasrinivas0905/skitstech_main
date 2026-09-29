import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer as reservePort } from 'node:net';

let processHandle;
let baseUrl;

async function getFreePort() {
  const server = reservePort();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

before(async () => {
  const port = await getFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  processHandle = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: String(port), MONGODB_URI: '' }, stdio: 'ignore' });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(`${baseUrl}/api/health`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error('Test server failed to start');
});

after(() => processHandle?.kill());

test('health endpoint reports local demo mode without MongoDB credentials', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', storage: 'demo-memory' });
});

test('contact endpoint rejects invalid email and missing consent', async () => {
  const invalidEmail = await fetch(`${baseUrl}/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Test User', email: 'bad', message: 'Hello', consent: true }) });
  assert.equal(invalidEmail.status, 422);
  const noConsent = await fetch(`${baseUrl}/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Test User', email: 'test@example.com', message: 'Hello', consent: false }) });
  assert.equal(noConsent.status, 422);
});

test('contact endpoint accepts a valid inquiry and acknowledges it', async () => {
  const response = await fetch(`${baseUrl}/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Test User', email: 'test@example.com', phone: '+91 12345', service: 'Patents', message: 'A sample test inquiry.', consent: true }) });
  assert.equal(response.status, 201);
  assert.match((await response.json()).message, /received/i);
});

test('static home page contains the requested destinations', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const text of ['Our Legal Partners', 'IP TOOLS', 'WISDOM', 'CONTACT']) assert.ok(html.toLowerCase().includes(text.toLowerCase()), `missing ${text}`);
  assert.match(html, /brand-text"><strong>S<span>K<\/span>LS<\/strong>/);
});

test('static client assets are served with the correct content types', async () => {
  const [script, stylesheet, favicon] = await Promise.all([
    fetch(`${baseUrl}/js/app.js`), fetch(`${baseUrl}/css/styles.css`), fetch(`${baseUrl}/assets/favicon.svg`)
  ]);
  assert.match(script.headers.get('content-type'), /javascript/);
  assert.match(stylesheet.headers.get('content-type'), /text\/css/);
  assert.match(favicon.headers.get('content-type'), /image\/svg\+xml/);
  assert.match(await stylesheet.text(), /\.hero-grid/);
});
