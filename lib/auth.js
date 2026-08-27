const crypto = require('crypto');

// IMPORTANT: set a real JWT_SECRET in your Vercel environment variables.
// This fallback is only for local testing and is NOT safe for production.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlJSON(obj) {
  return base64url(JSON.stringify(obj));
}
function base64urlDecodeJSON(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

// ---------- Session tokens (JWT-like, HMAC-SHA256 signed) ----------
function signToken(payload, expiresInSeconds = 60 * 60 * 24 * 30) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
  const headerB64 = base64urlJSON(header);
  const payloadB64 = base64urlJSON(fullPayload);
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest();
  return `${data}.${base64url(sig)}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = base64url(crypto.createHmac('sha256', JWT_SECRET).update(data).digest());
  const a = Buffer.from(sigB64);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = base64urlDecodeJSON(payloadB64);
  } catch (e) {
    return null;
  }
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
  return payload;
}

// ---------- Password hashing (scrypt, built into Node -- no dependency needed) ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(attempt, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ---------- Cookies ----------
function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(val);
  });
  return cookies;
}

function setSessionCookie(res, token) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  // SameSite=None + Secure is required for the cookie to be sent on
  // cross-origin fetch requests (frontend and backend are on different domains).
  res.setHeader(
    'Set-Cookie',
    `session=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=None`
  );
}
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None`);
}

function getUserFromRequest(req) {
  const cookies = parseCookies(req);
  return verifyToken(cookies.session);
}

module.exports = {
  signToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  getUserFromRequest,
};
