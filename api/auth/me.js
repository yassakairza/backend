const { setCors } = require('../../lib/cors');
const { getUserFromRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  res.status(200).json({ email: user.email });
};
