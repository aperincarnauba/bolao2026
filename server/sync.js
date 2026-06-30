const { db } = require('./db');
const { recalcGame } = require('./scoring');
const { advanceKnockout } = require('./knockoutAdvance');

// Maps football-data.org English team names → Portuguese names stored in our DB
const TEAM_MAP = {
  'Mexico': 'México',
  'Brazil': 'Brasil',
  'Argentina': 'Argentina',
  'Colombia': 'Colômbia',
  'Uruguay': 'Uruguai',
  'Ecuador': 'Equador',
  'Paraguay': 'Paraguai',
  'Panama': 'Panamá',
  'Haiti': 'Haiti',
  'Curaçao': 'Curaçau',
  'Canada': 'Canadá',
  'United States': 'Estados Unidos',
  'Spain': 'Espanha',
  'France': 'França',
  'Germany': 'Alemanha',
  'England': 'Inglaterra',
  'Portugal': 'Portugal',
  'Netherlands': 'Holanda',
  'Belgium': 'Bélgica',
  'Italy': 'Itália',
  'Croatia': 'Croácia',
  'Austria': 'Áustria',
  'Denmark': 'Dinamarca',
  'Norway': 'Noruega',
  'Switzerland': 'Suíça',
  'Albania': 'Albânia',
  'Turkey': 'Turquia',
  'Scotland': 'Escócia',
  'Morocco': 'Marrocos',
  'Senegal': 'Senegal',
  'Egypt': 'Egito',
  "Côte d'Ivoire": 'Costa do Marfim',
  "Ivory Coast": 'Costa do Marfim',
  'Ghana': 'Gana',
  'Tunisia': 'Tunísia',
  'Algeria': 'Argélia',
  'DR Congo': 'RD Congo',
  'Cape Verde': 'Cabo Verde',
  'Japan': 'Japão',
  'Korea Republic': 'Coreia do Sul',
  'South Korea': 'Coreia do Sul',
  'Saudi Arabia': 'Arábia Saudita',
  'Iran': 'Irã',
  'Australia': 'Austrália',
  'New Zealand': 'Nova Zelândia',
  'Iraq': 'Iraque',
  'Jordan': 'Jordânia',
  'Uzbekistan': 'Uzbequistão',
  'Qatar': 'Catar',
  'South Africa': 'África do Sul',
  'Nigeria': 'Nigéria',
  'Cameroon': 'Camarões',
  'Venezuela': 'Venezuela',
  'Bolivia': 'Bolívia',
  'Chile': 'Chile',
  'Peru': 'Peru',
  'Jamaica': 'Jamaica',
  'Costa Rica': 'Costa Rica',
  'Serbia': 'Sérvia',
  'Poland': 'Polônia',
  'Ukraine': 'Ucrânia',
  // Nomes que a API retorna diferentes dos nossos
  'Czechia': 'República Tcheca',
  'Czech Republic': 'República Tcheca',
  'Sweden': 'Suécia',
  'Bosnia-Herzegovina': 'Bósnia e Herzegovina',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina',
  'Cape Verde Islands': 'Cabo Verde',
  'Congo DR': 'RD Congo',
  'DR Congo': 'RD Congo',
};

let lastSyncTime = null;
let lastSyncCount = 0;
let lastSyncStatus = 'never';

function mapTeam(name) {
  return TEAM_MAP[name] || name;
}

async function applyResult(gameId, homeScore, awayScore, penaltyHome = null, penaltyAway = null) {
  await db.execute({
    sql: "UPDATE games SET home_score = ?, away_score = ?, penalty_home = ?, penalty_away = ?, status = 'finished' WHERE id = ?",
    args: [homeScore, awayScore, penaltyHome, penaltyAway, gameId],
  });
  await recalcGame(gameId);
}

async function syncResults() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    lastSyncStatus = 'no_key';
    return { updated: 0, status: 'no_key' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=FINISHED',
      {
        headers: { 'X-Auth-Token': apiKey },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (res.status === 403) {
      lastSyncStatus = 'forbidden';
      console.log('[Sync] Chave de API inválida ou sem acesso ao WC 2026');
      return { updated: 0, status: 'forbidden' };
    }
    if (res.status === 404) {
      lastSyncStatus = 'not_found';
      console.log('[Sync] Competição WC 2026 ainda não disponível nesta API');
      return { updated: 0, status: 'not_found' };
    }
    if (!res.ok) {
      lastSyncStatus = 'error';
      console.log(`[Sync] HTTP ${res.status}`);
      return { updated: 0, status: 'error' };
    }

    const data = await res.json();
    const matches = data.matches || [];
    let updated = 0;

    for (const match of matches) {
      const homeTeam = mapTeam(match.homeTeam.name);
      const awayTeam = mapTeam(match.awayTeam.name);

      const duration = match.score?.duration;
      let homeScore, awayScore, penaltyHome = null, penaltyAway = null;

      if (duration === 'PENALTY_SHOOTOUT') {
        // Placar nos 90 min (o que conta para os palpites)
        homeScore = match.score?.regularTime?.home ?? null;
        awayScore = match.score?.regularTime?.away ?? null;
        const ftH = match.score?.fullTime?.home;
        const ftA = match.score?.fullTime?.away;
        // fullTime normalmente tem o placar dos pênaltis (ex: 4×5).
        // Se ainda estiver empatado ou nulo, a API ainda não atualizou — pular.
        if (ftH == null || ftA == null || ftH === ftA) {
          console.log(`[Sync] Pênaltis incompletos na API para ${homeTeam} × ${awayTeam} — entrada manual necessária`);
          continue;
        }
        penaltyHome = ftH;
        penaltyAway = ftA;
      } else {
        // REGULAR ou EXTRA_TIME: fullTime tem o resultado final
        homeScore = match.score?.fullTime?.home;
        awayScore = match.score?.fullTime?.away;
      }

      if (homeScore === null || homeScore === undefined) continue;
      if (awayScore === null || awayScore === undefined) continue;

      // Find a matching unfinished game in our DB
      const found = await db.execute({
        sql: "SELECT id FROM games WHERE home_team = ? AND away_team = ? AND status != 'finished'",
        args: [homeTeam, awayTeam],
      });

      if (found.rows.length === 0) continue;

      const gameId = Number(found.rows[0].id);
      await applyResult(gameId, homeScore, awayScore, penaltyHome, penaltyAway);
      updated++;
    }

    lastSyncTime = new Date().toISOString();
    lastSyncCount = updated;
    lastSyncStatus = 'ok';

    if (updated > 0) {
      console.log(`[Sync] ${updated} jogo(s) atualizado(s) automaticamente`);
      await advanceKnockout();
    }

    return { updated, status: 'ok' };
  } catch (err) {
    lastSyncStatus = 'error';
    console.log('[Sync] Erro:', err.message);
    return { updated: 0, status: 'error', message: err.message };
  }
}

function getSyncInfo() {
  return { lastSyncTime, lastSyncCount, lastSyncStatus };
}

function startSyncInterval(intervalMs = 3 * 60 * 1000) {
  // Run immediately on startup, then every intervalMs
  syncResults();
  setInterval(syncResults, intervalMs);
}

module.exports = { syncResults, startSyncInterval, getSyncInfo, applyResult, mapTeam };
