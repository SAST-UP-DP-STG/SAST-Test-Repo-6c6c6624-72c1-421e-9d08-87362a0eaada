const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { authenticateJWT, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/dashboard', authenticateJWT, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  res.render('dashboard', { title: 'Dashboard', user, message: null });
});

router.get('/users', authenticateJWT, requireAdmin, async (req, res) => {
  const users = await User.findAll({ order: [['id', 'ASC']] });
  res.render('users', { title: 'Users', users });
});


router.post('/api/users/create', authenticateJWT, async (req, res) => {
  const { fullName, email, phone, nationalId, role, status, password } = req.body || {};
  if (!fullName || !email) return res.status(400).json({ error: 'fullName, email required' });

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) return res.status(409).json({ error: 'Email already exists' });

  const plainPassword = password ? String(password) : crypto.randomBytes(9).toString('base64url');
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const user = await User.create({
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    phone: phone ? String(phone).trim() : null,
    nationalId: nationalId ? String(nationalId).trim() : null,
    passwordHash,
    role: role ? String(role).trim() : 'staff',
    status: status ? String(status).trim() : 'active'
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    initialPassword: plainPassword
  });
});

router.post('/api/users/update-role', authenticateJWT, async (req, res) => {
  const { userId, role } = req.body || {};
  if (!userId || !role) return res.status(400).json({ error: 'userId, role required' });

  const user = await User.findByPk(Number(userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.role = String(role).trim();
  await user.save();

  res.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
});

router.post('/api/users/disable', authenticateJWT, async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const user = await User.findByPk(Number(userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = 'disabled';
  await user.save();

  res.json({ ok: true, user: { id: user.id, email: user.email, status: user.status } });
});

router.post('/api/users/enable', authenticateJWT, async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const user = await User.findByPk(Number(userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = 'active';
  await user.save();

  res.json({ ok: true, user: { id: user.id, email: user.email, status: user.status } });
});


module.exports = router;
