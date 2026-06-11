const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM predictions WHERE user_id = ?',
      args: [req.user.userId],
    });
    res.json({ predictions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/:gameId', requireAuth, async (req, res) => {
  const { home_score, away_score } = req.body;

  if (home_score === undefined || away_score === undefined)
    return res.status(400).json({ error: 'home_score e away_score são obrigatórios' });
  if (home_score < 0 || away_score < 0)
    return res.status(400).json({ error: 'Placares devem ser não-negativos' });

  try {
    const gameRes = await db.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [req.params.gameId] });
    if (gameRes.rows.length === 0) return res.status(404).json({ error: 'Jogo não encontrado' });
    const game = gameRes.rows[0];

    if (new Date() >= new Date(game.match_time))
      return res.status(403).json({ error: 'Jogo já começou — palpite bloqueado' });

    await db.execute({
      sql: `INSERT INTO predictions (user_id, game_id, home_score, away_score, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id, game_id) DO UPDATE SET
              home_score = excluded.home_score,
              away_score = excluded.away_score,
              updated_at = datetime('now')`,
      args: [req.user.userId, req.params.gameId, home_score, away_score],
    });

    const predRes = await db.execute({
      sql: 'SELECT * FROM predictions WHERE user_id = ? AND game_id = ?',
      args: [req.user.userId, req.params.gameId],
    });
    res.json({ prediction: predRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
