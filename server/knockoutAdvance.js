const { db } = require('./db')

// ── Bracket schedule ──────────────────────────────────────────────────────────
// Each R16 entry: which two R32 games' winners face each other, and when.
// Times in UTC (BRT = UTC-3).
const R16_SCHEDULE = [
  // Chave A
  { homeR32: ['Alemanha', 'Paraguai'],                    awayR32: ['França', 'Suécia'],          time: '2026-07-04T21:00:00Z', cidade: 'Filadélfia' },       // 0: Oit-A1 · 04/jul 18h — Lincoln Financial Field
  { homeR32: ['África do Sul', 'Canadá'],                 awayR32: ['Holanda', 'Marrocos'],        time: '2026-07-04T17:00:00Z', cidade: 'Houston' },          // 1: Oit-A2 · 04/jul 14h — NRG Stadium
  { homeR32: ['Portugal', 'Croácia'],                     awayR32: ['Espanha', 'Áustria'],         time: '2026-07-06T19:00:00Z', cidade: 'Dallas' },           // 2: Oit-A3 · 06/jul 16h — AT&T Stadium
  { homeR32: ['Estados Unidos', 'Bósnia e Herzegovina'],  awayR32: ['Bélgica', 'Senegal'],         time: '2026-07-07T00:00:00Z', cidade: 'Seattle' },          // 3: Oit-A4 · 06/jul 21h — Lumen Field
  // Chave B
  { homeR32: ['Brasil', 'Japão'],                         awayR32: ['Costa do Marfim', 'Noruega'], time: '2026-07-05T20:00:00Z', cidade: 'Nova York' },        // 4: Oit-B1 · 05/jul 17h — MetLife Stadium
  { homeR32: ['México', 'Equador'],                       awayR32: ['Inglaterra', 'RD Congo'],     time: '2026-07-06T00:00:00Z', cidade: 'Cidade do México' }, // 5: Oit-B2 · 05/jul 21h — Estádio Azteca
  { homeR32: ['Argentina', 'Cabo Verde'],                 awayR32: ['Austrália', 'Egito'],         time: '2026-07-07T16:00:00Z', cidade: 'Atlanta' },          // 6: Oit-B3 · 07/jul 13h — Mercedes-Benz Stadium
  { homeR32: ['Suíça', 'Argélia'],                        awayR32: ['Colômbia', 'Gana'],           time: '2026-07-07T20:00:00Z', cidade: 'Vancouver' },        // 7: Oit-B4 · 07/jul 17h — BC Place Stadium
]

// QF: indexes refer to R16_SCHEDULE above
const QF_SCHEDULE = [
  { homeR16: 0, awayR16: 1, time: '2026-07-09T17:00:00Z' }, // QF-A · 09/jul 14h
  { homeR16: 2, awayR16: 3, time: '2026-07-10T16:00:00Z' }, // QF-B · 10/jul 13h
  { homeR16: 4, awayR16: 5, time: '2026-07-11T16:00:00Z' }, // QF-C · 11/jul 13h
  { homeR16: 6, awayR16: 7, time: '2026-07-11T20:00:00Z' }, // QF-D · 11/jul 17h
]

// SF: indexes refer to QF_SCHEDULE above
const SF_SCHEDULE = [
  { homeQF: 0, awayQF: 1, time: '2026-07-14T16:00:00Z' }, // SF-A (Chave A) · 14/jul 13h
  { homeQF: 2, awayQF: 3, time: '2026-07-15T16:00:00Z' }, // SF-B (Chave B / 🇧🇷) · 15/jul 13h
]

const FINAL_TIME = '2026-07-19T16:00:00Z' // MetLife Stadium · 19/jul 13h
const THIRD_PLACE_TIME = '2026-07-18T18:00:00Z' // Disputa de 3º lugar · 18/jul 15h

// ── Helpers ───────────────────────────────────────────────────────────────────
function gameWinner(game) {
  if (!game || game.status !== 'finished') return null
  const ph = game.penalty_home != null ? Number(game.penalty_home) : null
  const pa = game.penalty_away != null ? Number(game.penalty_away) : null
  if (ph !== null) return ph > pa ? game.home_team : game.away_team
  const hs = Number(game.home_score), as_ = Number(game.away_score)
  if (hs > as_) return game.home_team
  if (as_ > hs) return game.away_team
  return null
}

function gameLoser(game) {
  if (!game || game.status !== 'finished') return null
  const ph = game.penalty_home != null ? Number(game.penalty_home) : null
  const pa = game.penalty_away != null ? Number(game.penalty_away) : null
  if (ph !== null) return ph > pa ? game.away_team : game.home_team
  const hs = Number(game.home_score), as_ = Number(game.away_score)
  if (hs > as_) return game.away_team
  if (as_ > hs) return game.home_team
  return null
}

// ── Main advance function ─────────────────────────────────────────────────────
async function advanceKnockout() {
  // Single snapshot of all knockout games
  const { rows } = await db.execute({
    sql: `SELECT * FROM games WHERE stage != 'group'`,
    args: [],
  })

  function findRow(t1, t2) {
    if (!t1 || !t2) return null
    return rows.find(g =>
      (g.home_team === t1 && g.away_team === t2) ||
      (g.home_team === t2 && g.away_team === t1)
    ) ?? null
  }

  function winner(t1, t2) {
    return gameWinner(findRow(t1, t2))
  }

  function loser(t1, t2) {
    return gameLoser(findRow(t1, t2))
  }

  async function maybeCreate(homeTeam, awayTeam, matchTime, stage, cidade = null) {
    if (!homeTeam || !awayTeam) return
    // Already in snapshot (from a previous run) or just exists
    if (findRow(homeTeam, awayTeam)) return
    // Double-check DB directly to avoid race conditions between multiple sync calls
    const { rows: chk } = await db.execute({
      sql: `SELECT id FROM games WHERE (home_team = ? AND away_team = ?) OR (home_team = ? AND away_team = ?) LIMIT 1`,
      args: [homeTeam, awayTeam, awayTeam, homeTeam],
    })
    if (chk.length > 0) return
    await db.execute({
      sql: `INSERT INTO games (home_team, away_team, match_time, stage, cidade, status) VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      args: [homeTeam, awayTeam, matchTime, stage, cidade],
    })
    console.log(`[advance] Criado ${stage}: ${homeTeam} × ${awayTeam}`)
  }

  // ── R16 ──────────────────────────────────────────────────────────────────
  const r16 = R16_SCHEDULE.map(m => ({
    home: winner(...m.homeR32),
    away: winner(...m.awayR32),
    time: m.time,
    cidade: m.cidade,
  }))

  for (const { home, away, time, cidade } of r16) {
    await maybeCreate(home, away, time, 'r16', cidade)
  }

  // ── QF ───────────────────────────────────────────────────────────────────
  const qf = QF_SCHEDULE.map(m => ({
    home: winner(r16[m.homeR16].home, r16[m.homeR16].away),
    away: winner(r16[m.awayR16].home, r16[m.awayR16].away),
    time: m.time,
  }))

  for (const { home, away, time } of qf) {
    await maybeCreate(home, away, time, 'qf')
  }

  // ── SF ───────────────────────────────────────────────────────────────────
  const sf = SF_SCHEDULE.map(m => ({
    home: winner(qf[m.homeQF].home, qf[m.homeQF].away),
    away: winner(qf[m.awayQF].home, qf[m.awayQF].away),
    time: m.time,
  }))

  for (const { home, away, time } of sf) {
    await maybeCreate(home, away, time, 'sf')
  }

  // ── Disputa de 3º lugar ──────────────────────────────────────────────────
  await maybeCreate(
    loser(sf[0].home, sf[0].away),
    loser(sf[1].home, sf[1].away),
    THIRD_PLACE_TIME,
    'third'
  )

  // ── Final ─────────────────────────────────────────────────────────────────
  await maybeCreate(
    winner(sf[0].home, sf[0].away),
    winner(sf[1].home, sf[1].away),
    FINAL_TIME,
    'final'
  )
}

module.exports = { advanceKnockout }
