const { nanoid } = require('nanoid');
const connectDB = require('../../lib/db');
const Sheet = require('../../models/Sheet');
const { setCors } = require('../../lib/cors');
const { getUserFromRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    const slug = nanoid(10);
    const editToken = nanoid(32);
    const user = getUserFromRequest(req);
    const sheet = new Sheet({
      slug,
      editToken,
      data: (req.body && req.body.data) || {},
      ownerId: user ? user.userId : null,
    });
    await sheet.save();
    res.status(200).json({ id: slug, editToken });
  } catch (err) {
    console.error('Create sheet error:', err);
    res.status(500).json({ error: 'Failed to create sheet' });
  }
};
