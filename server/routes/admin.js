const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { syncResults, getSyncInfo } = require('../sync');
const { db } = require('../db');

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'aperincarnauba@gmail.com';

router.get('/sync-status', (req, res) => {
  res.json(getSyncInfo());
});

router.post('/sync', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL)
    return res.status(403).json({ error: 'Acesso negado' });
  const result = await syncResults();
  res.json(result);
});

// Apaga todos os usuários e palpites (mantém jogos intactos)
router.post('/reset-users', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL)
    return res.status(403).json({ error: 'Acesso negado' });
  try {
    await db.execute('DELETE FROM predictions');
    await db.execute('DELETE FROM users');
    res.json({ success: true });
  } catch (err) {
    console.error('[reset-users]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
