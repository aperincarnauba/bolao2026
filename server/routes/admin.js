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

// PUT define/altera o palpite de qualquer usuário (admin)
// Se o jogo já tem resultado, recalcula os pontos dessa previsão imediatamente
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

    // Recalculate points if game is already finished
    const gameRes = await db.execute({
      sql: "SELECT home_score, away_score FROM games WHERE id = ? AND status = 'finished'",
      args: [req.params.gameId],
    });
    if (gameRes.rows.length > 0) {
      const g = gameRes.rows[0];
      const actualSign = Math.sign(Number(g.home_score) - Number(g.away_score));
      const predSign = Math.sign(home_score - away_score);
      let pts = 0;
      if (predSign === actualSign) pts++;
      if (home_score === Number(g.home_score) && away_score === Number(g.away_score)) pts++;
      await db.execute({
        sql: 'UPDATE predictions SET points_awarded = ? WHERE user_id = ? AND game_id = ?',
        args: [pts, req.params.userId, req.params.gameId],
      });
    }

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
