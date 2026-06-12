const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT
        u.id,
        u.name,
        COALESCE(SUM(p.points_awarded), 0) AS total_points,
        COUNT(p.id) AS predictions_made,
        SUM(CASE WHEN p.points_awarded = 2 THEN 1 ELSE 0 END) AS exact_scores,
        SUM(CASE WHEN p.points_awarded >= 1 THEN 1 ELSE 0 END) AS correct_results,
        COALESCE(SUM(p.underdog_value), 0) AS underdog_score
      FROM users u
      LEFT JOIN predictions p ON p.user_id = u.id
      GROUP BY u.id
      ORDER BY total_points DESC, exact_scores DESC, underdog_score DESC, predictions_made DESC
    `);

    const leaderboard = result.rows.map((row, i) => ({
      rank: i + 1,
      user_id: Number(row.id),
      name: row.name,
      total_points: Number(row.total_points),
      predictions_made: Number(row.predictions_made),
      exact_scores: Number(row.exact_scores) || 0,
      correct_results: Number(row.correct_results) || 0,
      underdog_score: Math.round(Number(row.underdog_score) * 100) / 100,
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
