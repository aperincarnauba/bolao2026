const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { syncResults, getSyncInfo } = require('../sync');

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'aperincarnauba@gmail.com';

// GET /api/admin/sync-status — anyone can poll this to see last sync info
router.get('/sync-status', (req, res) => {
  res.json(getSyncInfo());
});

// POST /api/admin/sync — admin triggers a manual sync
router.post('/sync', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL)
    return res.status(403).json({ error: 'Acesso negado' });

  const result = await syncResults();
  res.json(result);
});

module.exports = router;
