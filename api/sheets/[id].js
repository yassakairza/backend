const connectDB = require('../../lib/db');
const Sheet = require('../../models/Sheet');
const { setCors } = require('../../lib/cors');
const { getUserFromRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id } = req.query;

  try {
    await connectDB();
    const sheet = await Sheet.findOne({ slug: id });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    if (req.method === 'GET') {
      return res.status(200).json({ data: sheet.data, updatedAt: sheet.updatedAt });
    }

    if (req.method === 'PUT') {
      const { key, data } = req.body || {};
      const user = getUserFromRequest(req);
      const isOwner = user && sheet.ownerId && String(sheet.ownerId) === String(user.userId);
      const hasValidKey = key && key === sheet.editToken;
      if (!isOwner && !hasValidKey) {
        return res.status(403).json({ error: 'Invalid or missing edit key' });
      }
      sheet.data = data;
      await sheet.save();
      return res.status(200).json({ ok: true, updatedAt: sheet.updatedAt });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Sheet route error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
};
