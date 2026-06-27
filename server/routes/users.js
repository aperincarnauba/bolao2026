const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:userId/profile', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const userRes = await db.execute({ sql: 'SELECT id, name FROM users WHERE id = ?', args: [userId] });
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    const user = userRes.rows[0];

    const statsRes = await db.execute({
      sql: `
        SELECT
          COALESCE(SUM(p.points_awarded), 0) AS total_points,
          SUM(CASE WHEN g.status = 'finished' AND p.home_score = g.home_score AND p.away_score = g.away_score THEN 1 ELSE 0 END) AS exact_scores,
          SUM(CASE WHEN p.points_awarded > 0 THEN 1 ELSE 0 END) AS correct_results,
          COALESCE(SUM(p.underdog_value), 0) AS underdog_score,
          COUNT(p.id) AS predictions_made
        FROM predictions p
        JOIN games g ON g.id = p.game_id
        WHERE p.user_id = ?
      `,
      args: [userId],
    });
    const stats = statsRes.rows[0];

    // Predictions only for games that have already started (locked)
    const predsRes = await db.execute({
      sql: `
        SELECT
          g.id, g.stage, g.group_name, g.home_team, g.away_team,
          g.match_time, g.cidade, g.status,
          g.home_score AS actual_home, g.away_score AS actual_away,
          p.home_score AS pred_home, p.away_score AS pred_away,
          p.points_awarded, p.underdog_value
        FROM games g
        LEFT JOIN predictions p ON p.game_id = g.id AND p.user_id = ?
        WHERE g.match_time <= ?
        ORDER BY g.match_time ASC
      `,
      args: [userId, new Date().toISOString()],
    });

    res.json({
      user: { id: Number(user.id), name: user.name },
      stats: {
        total_points: Number(stats.total_points),
        exact_scores: Number(stats.exact_scores) || 0,
        correct_results: Number(stats.correct_results) || 0,
        underdog_score: Math.round(Number(stats.underdog_score) * 100) / 100,
        predictions_made: Number(stats.predictions_made),
      },
      games: predsRes.rows.map(r => ({
        id: Number(r.id),
        stage: r.stage,
        group_name: r.group_name,
        home_team: r.home_team,
        away_team: r.away_team,
        match_time: r.match_time,
        cidade: r.cidade,
        status: r.status,
        actual_home: r.actual_home !== null ? Number(r.actual_home) : null,
        actual_away: r.actual_away !== null ? Number(r.actual_away) : null,
        pred_home: r.pred_home !== null ? Number(r.pred_home) : null,
        pred_away: r.pred_away !== null ? Number(r.pred_away) : null,
        points_awarded: r.points_awarded !== null ? Number(r.points_awarded) : null,
        underdog_value: r.underdog_value !== null ? Number(r.underdog_value) : 0,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
