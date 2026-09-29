import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const root = join(fileURLToPath(new URL('..', import.meta.url)), 'public');
const port = Number(process.env.PORT || 3000);
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
let mongoCollection;
let mongoReady = false;
const demoSubmissions = [];

async function connectMongo() {
  if (!process.env.MONGODB_URI) return;
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    mongoCollection = client.db(process.env.MONGODB_DB || 'skls_website').collection(process.env.CONTACT_COLLECTION || 'contact_inquiries');
    await mongoCollection.createIndex({ createdAt: -1 });
    mongoReady = true;
    console.log('MongoDB connected; contact inquiries will be persisted.');
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
  }
}

function send(response, status, body, contentType = 'application/json; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  response.end(typeof body === 'string' ? body : JSON.stringify(body));
}

async function parseBody(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 16_000) throw new Error('Request too large');
  }
  return JSON.parse(raw || '{}');
}

function validateInquiry(data) {
  const fields = ['name', 'email', 'message'];
  for (const field of fields) if (typeof data[field] !== 'string' || !data[field].trim()) return `${field} is required.`;
  if (data.name.trim().length > 120 || data.email.trim().length > 254 || data.message.trim().length > 4000) return 'Please shorten one or more fields.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'Please enter a valid email address.';
  if (data.phone && (typeof data.phone !== 'string' || data.phone.length > 40)) return 'Please enter a valid phone number.';
  return null;
}

async function handle(request, response) {
  if (request.method === 'OPTIONS') return send(response, 204, '');
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health' && request.method === 'GET') return send(response, 200, { status: 'ok', storage: mongoReady ? 'mongodb' : 'demo-memory' });
  if (url.pathname === '/api/contact' && request.method === 'POST') {
    let data;
    try { data = await parseBody(request); } catch { return send(response, 400, { error: 'Please send a valid request.' }); }
    if (data.website) return send(response, 200, { message: 'Thank you. Your message has been received.' }); // honeypot
    const problem = validateInquiry(data);
    if (problem) return send(response, 422, { error: problem });
    const inquiry = { name: data.name.trim(), email: data.email.trim(), phone: String(data.phone || '').trim(), service: String(data.service || '').slice(0, 120), message: data.message.trim(), consent: data.consent === true, createdAt: new Date(), source: 'website' };
    if (!inquiry.consent) return send(response, 422, { error: 'Please confirm that we may contact you about this inquiry.' });
    if (mongoReady) await mongoCollection.insertOne(inquiry);
    else demoSubmissions.push(inquiry);
    console.log(`Contact inquiry received (${mongoReady ? 'MongoDB' : 'demo memory'}): ${inquiry.email}`);
    return send(response, 201, { message: 'Thank you. Your message has been received.', storage: mongoReady ? 'mongodb' : 'demo-memory' });
  }
  if (url.pathname.startsWith('/api/')) return send(response, 404, { error: 'API endpoint not found.' });
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const target = normalize(join(root, pathname));
  if (!target.startsWith(root)) return send(response, 403, 'Forbidden', 'text/plain; charset=utf-8');
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error('Not a file');
    const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json' }[extname(target)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': mime, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    createReadStream(target).pipe(response);
  } catch {
    const html = await readFile(join(root, 'index.html'), 'utf8');
    send(response, 200, html, 'text/html; charset=utf-8');
  }
}

createServer((request, response) => handle(request, response).catch((error) => {
  console.error(error);
  send(response, 500, { error: 'Something went wrong. Please try again.' });
})).listen(port, () => console.log(`SKLS site running at http://localhost:${port}`));
connectMongo();
