const { db } = require('./db');

// Recalculates points_awarded and underdog_value for ALL predictions of a finished game.
// Call this whenever a game result changes OR a prediction for a finished game is edited.
async function recalcGame(gameId) {
  const gameRes = await db.execute({
    sql: "SELECT home_score, away_score FROM games WHERE id = ? AND status = 'finished'",
    args: [gameId],
  });
  if (gameRes.rows.length === 0) return 0;

  const g = gameRes.rows[0];
  const actualHome = Number(g.home_score);
  const actualAway = Number(g.away_score);
  const actualSign = Math.sign(actualHome - actualAway);

  const predsRes = await db.execute({
    sql: 'SELECT * FROM predictions WHERE game_id = ?',
    args: [gameId],
  });
  const preds = predsRes.rows;
  if (preds.length === 0) return 0;

  // Underdog odds: total / correctCount — 1
  const correctCount = preds.filter(
    p => Math.sign(Number(p.home_score) - Number(p.away_score)) === actualSign
  ).length;
  const underdogValue = correctCount > 0 ? (preds.length / correctCount) - 1 : 0;

  for (const p of preds) {
    const predSign = Math.sign(Number(p.home_score) - Number(p.away_score));
    let pts = 0;
    if (predSign === actualSign) pts++;
    if (Number(p.home_score) === actualHome && Number(p.away_score) === actualAway) pts++;
    const uv = predSign === actualSign ? underdogValue : 0;

    await db.execute({
      sql: 'UPDATE predictions SET points_awarded = ?, underdog_value = ? WHERE id = ?',
      args: [pts, uv, p.id],
    });
  }

  return preds.length;
}

module.exports = { recalcGame };
