const { setCors } = require('../../lib/cors');
const { clearSessionCookie } = require('../../lib/auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
};
