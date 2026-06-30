const express = require('express');
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { recalcGame } = require('../scoring');
const { advanceKnockout } = require('../knockoutAdvance');

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'aperincarnauba@gmail.com';

function isLocked(matchTime) {
  return new Date() >= new Date(matchTime);
}

function rowToGame(row) {
  return {
    id: Number(row.id),
    stage: row.stage,
    group_name: row.group_name,
    home_team: row.home_team,
    away_team: row.away_team,
    match_time: row.match_time,
    cidade: row.cidade || null,
    home_score: row.home_score !== null ? Number(row.home_score) : null,
    away_score: row.away_score !== null ? Number(row.away_score) : null,
    penalty_home: row.penalty_home != null ? Number(row.penalty_home) : null,
    penalty_away: row.penalty_away != null ? Number(row.penalty_away) : null,
    status: row.status,
    locked: isLocked(row.match_time),
    user_prediction: null,
  };
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM games ORDER BY match_time ASC');
    const games = result.rows.map(rowToGame);

    if (req.user) {
      const predsResult = await db.execute({
        sql: 'SELECT * FROM predictions WHERE user_id = ?',
        args: [req.user.userId],
      });
      const predMap = {};
      for (const p of predsResult.rows) {
        predMap[Number(p.game_id)] = {
          home_score: Number(p.home_score),
          away_score: Number(p.away_score),
          points_awarded: Number(p.points_awarded),
        };
      }
      for (const g of games) g.user_prediction = predMap[g.id] || null;
    }

    res.json({ games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Jogo não encontrado' });
    const game = rowToGame(result.rows[0]);

    if (req.user) {
      const predResult = await db.execute({
        sql: 'SELECT * FROM predictions WHERE user_id = ? AND game_id = ?',
        args: [req.user.userId, game.id],
      });
      game.user_prediction = predResult.rows[0]
        ? { home_score: Number(predResult.rows[0].home_score), away_score: Number(predResult.rows[0].away_score), points_awarded: Number(predResult.rows[0].points_awarded) }
        : null;
    }

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/:id/result', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL)
    return res.status(403).json({ error: 'Acesso negado' });

  const { home_score, away_score, penalty_home, penalty_away } = req.body;
  if (home_score === undefined || away_score === undefined)
    return res.status(400).json({ error: 'home_score e away_score são obrigatórios' });
  if (home_score < 0 || away_score < 0)
    return res.status(400).json({ error: 'Placares devem ser não-negativos' });

  try {
    const gameRes = await db.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [req.params.id] });
    if (gameRes.rows.length === 0) return res.status(404).json({ error: 'Jogo não encontrado' });

    const ph = penalty_home != null ? Number(penalty_home) : null;
    const pa = penalty_away != null ? Number(penalty_away) : null;

    await db.execute({
      sql: "UPDATE games SET home_score = ?, away_score = ?, penalty_home = ?, penalty_away = ?, status = 'finished' WHERE id = ?",
      args: [home_score, away_score, ph, pa, req.params.id],
    });

    const updated = await recalcGame(Number(req.params.id));
    await advanceKnockout();
    res.json({ success: true, updated_predictions: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/:id/predictions', optionalAuth, async (req, res) => {
  try {
    const gameRes = await db.execute({ sql: 'SELECT match_time FROM games WHERE id = ?', args: [req.params.id] });
    if (gameRes.rows.length === 0) return res.status(404).json({ error: 'Jogo não encontrado' });

    if (!isLocked(gameRes.rows[0].match_time))
      return res.status(403).json({ error: 'Palpites visíveis apenas após o jogo iniciar' });

    const predsRes = await db.execute({
      sql: `SELECT u.name, p.home_score, p.away_score, p.points_awarded
            FROM predictions p JOIN users u ON p.user_id = u.id
            WHERE p.game_id = ?
            ORDER BY p.points_awarded DESC, u.name ASC`,
      args: [req.params.id],
    });

    res.json({
      predictions: predsRes.rows.map(r => ({
        user_name: r.name,
        home_score: Number(r.home_score),
        away_score: Number(r.away_score),
        points_awarded: r.points_awarded !== null ? Number(r.points_awarded) : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.patch('/:id/teams', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL)
    return res.status(403).json({ error: 'Acesso negado' });
  const { home_team, away_team } = req.body;
  if (!home_team || !away_team)
    return res.status(400).json({ error: 'home_team e away_team são obrigatórios' });
  await db.execute({ sql: 'UPDATE games SET home_team = ?, away_team = ? WHERE id = ?', args: [home_team, away_team, req.params.id] });
  res.json({ success: true });
});

module.exports = router;
