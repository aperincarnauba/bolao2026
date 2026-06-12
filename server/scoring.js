const { db } = require('./db');

// Points per game type. Brazil always gets the highest between its bonus (3,4) and the stage.
function getGamePoints(stage, homeTeam, awayTeam) {
  const isBrazil = homeTeam === 'Brasil' || awayTeam === 'Brasil';
  let resultPts, exactPts;
  if (stage === 'final') {
    resultPts = 4; exactPts = 5;
  } else if (stage === 'group') {
    resultPts = 1; exactPts = 2;
  } else {
    // r32, r16, qf, sf — mata-mata
    resultPts = 2; exactPts = 3;
  }
  if (isBrazil) {
    resultPts = Math.max(resultPts, 3);
    exactPts = Math.max(exactPts, 4);
  }
  return { resultPts, exactPts };
}

async function recalcGame(gameId) {
  const gameRes = await db.execute({
    sql: "SELECT home_score, away_score, stage, home_team, away_team FROM games WHERE id = ? AND status = 'finished'",
    args: [gameId],
  });
  if (gameRes.rows.length === 0) return 0;

  const g = gameRes.rows[0];
  const actualHome = Number(g.home_score);
  const actualAway = Number(g.away_score);
  const actualSign = Math.sign(actualHome - actualAway);
  const { resultPts, exactPts } = getGamePoints(g.stage, g.home_team, g.away_team);

  const predsRes = await db.execute({
    sql: 'SELECT * FROM predictions WHERE game_id = ?',
    args: [gameId],
  });
  const preds = predsRes.rows;
  if (preds.length === 0) return 0;

  const correctCount = preds.filter(
    p => Math.sign(Number(p.home_score) - Number(p.away_score)) === actualSign
  ).length;
  const underdogValue = correctCount > 0 ? (preds.length / correctCount) - 1 : 0;

  for (const p of preds) {
    const predSign = Math.sign(Number(p.home_score) - Number(p.away_score));
    let pts = 0;
    if (Number(p.home_score) === actualHome && Number(p.away_score) === actualAway) {
      pts = exactPts; // placar exato — maior tier, não soma com resultado
    } else if (predSign === actualSign) {
      pts = resultPts; // só resultado certo
    }
    const uv = predSign === actualSign ? underdogValue : 0;
    await db.execute({
      sql: 'UPDATE predictions SET points_awarded = ?, underdog_value = ? WHERE id = ?',
      args: [pts, uv, p.id],
    });
  }

  return preds.length;
}

async function recalcAllFinishedGames() {
  const result = await db.execute("SELECT id FROM games WHERE status = 'finished'");
  for (const row of result.rows) {
    await recalcGame(Number(row.id));
  }
  if (result.rows.length > 0) {
    console.log(`[scoring] Recalculados ${result.rows.length} jogo(s) finalizado(s)`);
  }
}

module.exports = { getGamePoints, recalcGame, recalcAllFinishedGames };
