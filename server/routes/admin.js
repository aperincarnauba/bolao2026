const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { syncResults, getSyncInfo } = require('../sync');
const { recalcGame } = require('../scoring');
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

// GET todos os palpites de um jogo (admin, sem restrição de lock)
router.get('/game-predictions/:gameId', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL)
    return res.status(403).json({ error: 'Acesso negado' });
  try {
    const result = await db.execute({
      sql: `SELECT u.id as user_id, u.name, p.home_score, p.away_score, p.points_awarded
            FROM users u
            LEFT JOIN predictions p ON p.user_id = u.id AND p.game_id = ?
            ORDER BY u.name ASC`,
      args: [req.params.gameId],
    });
    res.json({ predictions: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT define/altera o palpite de qualquer usuário (admin), recalcula pontos + underdog
router.put('/game-predictions/:gameId/:userId', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL)
    return res.status(403).json({ error: 'Acesso negado' });
  const { home_score, away_score } = req.body;
  if (home_score === undefined || away_score === undefined)
    return res.status(400).json({ error: 'home_score e away_score obrigatórios' });
  try {
    await db.execute({
      sql: `INSERT INTO predictions (user_id, game_id, home_score, away_score)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, game_id) DO UPDATE SET
              home_score = excluded.home_score,
              away_score = excluded.away_score`,
      args: [req.params.userId, req.params.gameId, home_score, away_score],
    });
    await recalcGame(Number(req.params.gameId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET lista todos os usuários (admin)
router.get('/users', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL)
    return res.status(403).json({ error: 'Acesso negado' });
  try {
    const result = await db.execute(
      'SELECT id, name, email, created_at FROM users ORDER BY name ASC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE um usuário específico (admin, não pode se auto-deletar)
router.delete('/users/:userId', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL)
    return res.status(403).json({ error: 'Acesso negado' });
  if (String(req.params.userId) === String(req.user.userId))
    return res.status(400).json({ error: 'Você não pode apagar sua própria conta' });
  try {
    await db.execute({ sql: 'DELETE FROM predictions WHERE user_id = ?', args: [req.params.userId] });
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [req.params.userId] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
