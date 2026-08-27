const connectDB = require('../../lib/db');
const Sheet = require('../../models/Sheet');
const { setCors } = require('../../lib/cors');
const { getUserFromRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not logged in' });

  try {
    await connectDB();
    const sheets = await Sheet.find({ ownerId: user.userId }).sort({ updatedAt: -1 });
    const list = sheets.map((s) => {
      const fields = (s.data && s.data.fields) || {};
      return {
        id: s.slug,
        editToken: s.editToken,
        name: fields.f_name || 'Unnamed Character',
        species: fields.f_species || '',
        cls: fields.f_class || '',
        level: fields.f_level || '',
        updatedAt: s.updatedAt,
      };
    });
    res.status(200).json({ sheets: list });
  } catch (err) {
    console.error('List sheets error:', err);
    res.status(500).json({ error: 'Failed to load your characters' });
  }
};
