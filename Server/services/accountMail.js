const crypto = require('node:crypto');
const outbox = [];
const configured = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM && process.env.PUBLIC_SITE_URL);
function site() {
  const url = new URL(process.env.PUBLIC_SITE_URL || 'http://localhost:5173');
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('PUBLIC_SITE_URL must use HTTPS');
  return url.origin;
}
async function send({ to, kind, token }) {
  const link = `${site()}/${kind === 'reset' ? 'reset-password' : 'verify-email'}#token=${token}`;
  const message = { from: process.env.MAIL_FROM, to: [to], subject: kind === 'reset' ? 'Reset your CineLog password' : 'Verify your CineLog email', text: `${kind === 'reset' ? 'Reset your password within 30 minutes' : 'Verify your email within 24 hours'}: ${link}\n\nIf you did not request this, you can ignore this email.` };
  if (process.env.NODE_ENV === 'test' && process.env.MAIL_TRANSPORT === 'test') { outbox.push(message); return; }
  if (!configured()) throw Object.assign(new Error('Email delivery has not been configured.'), { status: 503 });
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `cinelog-${kind}-${crypto.createHash('sha256').update(token).digest('hex')}` }, body: JSON.stringify(message), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw Object.assign(new Error('Email delivery is temporarily unavailable.'), { status: 503 });
}
module.exports = { send, configured, outbox };
