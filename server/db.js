const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'bolao.db');
const db = createClient({ url: `file:${dbPath}` });

async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage TEXT NOT NULL,
      group_name TEXT,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      match_time TEXT NOT NULL,
      cidade TEXT,
      home_score INTEGER,
      away_score INTEGER,
      status TEXT DEFAULT 'scheduled'
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      game_id INTEGER NOT NULL REFERENCES games(id),
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      points_awarded INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, game_id)
    );

    CREATE INDEX IF NOT EXISTS idx_pred_user ON predictions(user_id);
    CREATE INDEX IF NOT EXISTS idx_pred_game ON predictions(game_id);
  `);

  await seedGames();
}

async function seedGames() {
  const result = await db.execute('SELECT COUNT(*) as c FROM games');
  const count = result.rows[0].c;
  if (count > 0) return;

  // Todos os horários em BRT (UTC-3) — formato: YYYY-MM-DDTHH:MM:00-03:00
  const games = [
    // ══════════ 1ª RODADA — 11 a 14 de junho ══════════
    { stage:'group', group_name:'A', home_team:'México',          away_team:'África do Sul',  match_time:'2026-06-11T16:00:00-03:00', cidade:'Cidade do México' },
    { stage:'group', group_name:'A', home_team:'Coreia do Sul',   away_team:'Dinamarca',      match_time:'2026-06-11T23:00:00-03:00', cidade:'Guadalajara' },
    { stage:'group', group_name:'B', home_team:'Canadá',          away_team:'Itália',         match_time:'2026-06-12T16:00:00-03:00', cidade:'Toronto' },
    { stage:'group', group_name:'D', home_team:'Estados Unidos',  away_team:'Paraguai',       match_time:'2026-06-12T22:00:00-03:00', cidade:'Los Angeles' },
    { stage:'group', group_name:'D', home_team:'Austrália',       away_team:'Turquia',        match_time:'2026-06-13T01:00:00-03:00', cidade:'Vancouver' },
    { stage:'group', group_name:'B', home_team:'Catar',           away_team:'Suíça',          match_time:'2026-06-13T16:00:00-03:00', cidade:'San Francisco' },
    { stage:'group', group_name:'C', home_team:'Brasil',          away_team:'Marrocos',       match_time:'2026-06-13T19:00:00-03:00', cidade:'Nova York' },
    { stage:'group', group_name:'C', home_team:'Haiti',           away_team:'Escócia',        match_time:'2026-06-13T22:00:00-03:00', cidade:'Boston' },
    { stage:'group', group_name:'E', home_team:'Alemanha',        away_team:'Curaçau',        match_time:'2026-06-14T14:00:00-03:00', cidade:'Houston' },
    { stage:'group', group_name:'F', home_team:'Holanda',         away_team:'Japão',          match_time:'2026-06-14T17:00:00-03:00', cidade:'Dallas' },
    { stage:'group', group_name:'E', home_team:'Costa do Marfim', away_team:'Equador',        match_time:'2026-06-14T20:00:00-03:00', cidade:'Filadélfia' },
    { stage:'group', group_name:'F', home_team:'Albânia',         away_team:'Tunísia',        match_time:'2026-06-14T23:00:00-03:00', cidade:'Monterrey' },

    // ── 1ª RODADA cont. — 15 a 17 de junho (Grupos G–L) ──
    { stage:'group', group_name:'H', home_team:'Espanha',         away_team:'Cabo Verde',     match_time:'2026-06-15T13:00:00-03:00', cidade:'Atlanta' },
    { stage:'group', group_name:'G', home_team:'Bélgica',         away_team:'Egito',          match_time:'2026-06-15T16:00:00-03:00', cidade:'Seattle' },
    { stage:'group', group_name:'H', home_team:'Arábia Saudita',  away_team:'Uruguai',        match_time:'2026-06-15T19:00:00-03:00', cidade:'Miami' },
    { stage:'group', group_name:'G', home_team:'Irã',             away_team:'Nova Zelândia',  match_time:'2026-06-15T22:00:00-03:00', cidade:'Los Angeles' },
    { stage:'group', group_name:'J', home_team:'Argentina',       away_team:'Argélia',        match_time:'2026-06-16T14:00:00-03:00', cidade:'Kansas City' },
    { stage:'group', group_name:'I', home_team:'França',          away_team:'Senegal',        match_time:'2026-06-16T16:00:00-03:00', cidade:'Nova York' },
    { stage:'group', group_name:'I', home_team:'Iraque',          away_team:'Noruega',        match_time:'2026-06-16T19:00:00-03:00', cidade:'Boston' },
    { stage:'group', group_name:'J', home_team:'Áustria',         away_team:'Jordânia',       match_time:'2026-06-17T01:00:00-03:00', cidade:'San Francisco' },
    { stage:'group', group_name:'K', home_team:'Portugal',        away_team:'RD Congo',       match_time:'2026-06-17T14:00:00-03:00', cidade:'Houston' },
    { stage:'group', group_name:'L', home_team:'Inglaterra',      away_team:'Croácia',        match_time:'2026-06-17T17:00:00-03:00', cidade:'Dallas' },
    { stage:'group', group_name:'L', home_team:'Gana',            away_team:'Panamá',         match_time:'2026-06-17T20:00:00-03:00', cidade:'Toronto' },
    { stage:'group', group_name:'K', home_team:'Uzbequistão',     away_team:'Colômbia',       match_time:'2026-06-17T23:00:00-03:00', cidade:'Cidade do México' },

    // ══════════ 2ª RODADA — 18 a 23 de junho ══════════
    { stage:'group', group_name:'A', home_team:'Dinamarca',       away_team:'África do Sul',  match_time:'2026-06-18T13:00:00-03:00', cidade:'Atlanta' },
    { stage:'group', group_name:'B', home_team:'Suíça',           away_team:'Itália',         match_time:'2026-06-18T16:00:00-03:00', cidade:'Los Angeles' },
    { stage:'group', group_name:'B', home_team:'Canadá',          away_team:'Catar',          match_time:'2026-06-18T19:00:00-03:00', cidade:'Vancouver' },
    { stage:'group', group_name:'A', home_team:'México',          away_team:'Coreia do Sul',  match_time:'2026-06-18T22:00:00-03:00', cidade:'Guadalajara' },
    { stage:'group', group_name:'D', home_team:'Turquia',         away_team:'Paraguai',       match_time:'2026-06-19T01:00:00-03:00', cidade:'San Francisco' },
    { stage:'group', group_name:'D', home_team:'Estados Unidos',  away_team:'Austrália',      match_time:'2026-06-19T16:00:00-03:00', cidade:'Seattle' },
    { stage:'group', group_name:'C', home_team:'Escócia',         away_team:'Marrocos',       match_time:'2026-06-19T19:00:00-03:00', cidade:'Boston' },
    { stage:'group', group_name:'C', home_team:'Brasil',          away_team:'Haiti',          match_time:'2026-06-19T22:00:00-03:00', cidade:'Filadélfia' },
    { stage:'group', group_name:'F', home_team:'Holanda',         away_team:'Albânia',        match_time:'2026-06-20T14:00:00-03:00', cidade:'Houston' },
    { stage:'group', group_name:'E', home_team:'Alemanha',        away_team:'Costa do Marfim',match_time:'2026-06-20T17:00:00-03:00', cidade:'Toronto' },
    { stage:'group', group_name:'E', home_team:'Equador',         away_team:'Curaçau',        match_time:'2026-06-20T21:00:00-03:00', cidade:'Kansas City' },
    { stage:'group', group_name:'F', home_team:'Tunísia',         away_team:'Japão',          match_time:'2026-06-21T01:00:00-03:00', cidade:'Monterrey' },
    { stage:'group', group_name:'H', home_team:'Espanha',         away_team:'Arábia Saudita', match_time:'2026-06-21T13:00:00-03:00', cidade:'Atlanta' },
    { stage:'group', group_name:'G', home_team:'Bélgica',         away_team:'Irã',            match_time:'2026-06-21T16:00:00-03:00', cidade:'Los Angeles' },
    { stage:'group', group_name:'H', home_team:'Uruguai',         away_team:'Cabo Verde',     match_time:'2026-06-21T19:00:00-03:00', cidade:'Miami' },
    { stage:'group', group_name:'G', home_team:'Nova Zelândia',   away_team:'Egito',          match_time:'2026-06-21T22:00:00-03:00', cidade:'Vancouver' },
    { stage:'group', group_name:'J', home_team:'Argentina',       away_team:'Áustria',        match_time:'2026-06-22T14:00:00-03:00', cidade:'Dallas' },
    { stage:'group', group_name:'I', home_team:'França',          away_team:'Iraque',         match_time:'2026-06-22T18:00:00-03:00', cidade:'Filadélfia' },
    { stage:'group', group_name:'I', home_team:'Noruega',         away_team:'Senegal',        match_time:'2026-06-22T21:00:00-03:00', cidade:'Nova York' },
    { stage:'group', group_name:'J', home_team:'Jordânia',        away_team:'Argélia',        match_time:'2026-06-23T00:00:00-03:00', cidade:'San Francisco' },
    { stage:'group', group_name:'K', home_team:'Portugal',        away_team:'Uzbequistão',    match_time:'2026-06-23T14:00:00-03:00', cidade:'Houston' },
    { stage:'group', group_name:'L', home_team:'Inglaterra',      away_team:'Gana',           match_time:'2026-06-23T17:00:00-03:00', cidade:'Boston' },
    { stage:'group', group_name:'L', home_team:'Panamá',          away_team:'Croácia',        match_time:'2026-06-23T20:00:00-03:00', cidade:'Toronto' },
    { stage:'group', group_name:'K', home_team:'Colômbia',        away_team:'RD Congo',       match_time:'2026-06-23T23:00:00-03:00', cidade:'Guadalajara' },

    // ══════════ 3ª RODADA — 24 a 27 de junho ══════════
    { stage:'group', group_name:'B', home_team:'Suíça',           away_team:'Canadá',         match_time:'2026-06-24T16:00:00-03:00', cidade:'Vancouver' },
    { stage:'group', group_name:'B', home_team:'Itália',          away_team:'Catar',          match_time:'2026-06-24T16:00:00-03:00', cidade:'Seattle' },
    { stage:'group', group_name:'C', home_team:'Escócia',         away_team:'Brasil',         match_time:'2026-06-24T19:00:00-03:00', cidade:'Miami' },
    { stage:'group', group_name:'C', home_team:'Marrocos',        away_team:'Haiti',          match_time:'2026-06-24T19:00:00-03:00', cidade:'Atlanta' },
    { stage:'group', group_name:'A', home_team:'Dinamarca',       away_team:'México',         match_time:'2026-06-24T22:00:00-03:00', cidade:'Cidade do México' },
    { stage:'group', group_name:'A', home_team:'África do Sul',   away_team:'Coreia do Sul',  match_time:'2026-06-24T22:00:00-03:00', cidade:'Monterrey' },
    { stage:'group', group_name:'E', home_team:'Equador',         away_team:'Alemanha',       match_time:'2026-06-25T17:00:00-03:00', cidade:'Nova York' },
    { stage:'group', group_name:'E', home_team:'Curaçau',         away_team:'Costa do Marfim',match_time:'2026-06-25T17:00:00-03:00', cidade:'Filadélfia' },
    { stage:'group', group_name:'F', home_team:'Japão',           away_team:'Albânia',        match_time:'2026-06-25T20:00:00-03:00', cidade:'Dallas' },
    { stage:'group', group_name:'F', home_team:'Tunísia',         away_team:'Holanda',        match_time:'2026-06-25T20:00:00-03:00', cidade:'Kansas City' },
    { stage:'group', group_name:'D', home_team:'Turquia',         away_team:'Estados Unidos', match_time:'2026-06-25T23:00:00-03:00', cidade:'Los Angeles' },
    { stage:'group', group_name:'D', home_team:'Paraguai',        away_team:'Austrália',      match_time:'2026-06-25T23:00:00-03:00', cidade:'San Francisco' },
    { stage:'group', group_name:'I', home_team:'Noruega',         away_team:'França',         match_time:'2026-06-26T16:00:00-03:00', cidade:'Boston' },
    { stage:'group', group_name:'I', home_team:'Senegal',         away_team:'Iraque',         match_time:'2026-06-26T16:00:00-03:00', cidade:'Toronto' },
    { stage:'group', group_name:'H', home_team:'Cabo Verde',      away_team:'Arábia Saudita', match_time:'2026-06-26T21:00:00-03:00', cidade:'Houston' },
    { stage:'group', group_name:'H', home_team:'Uruguai',         away_team:'Espanha',        match_time:'2026-06-26T21:00:00-03:00', cidade:'Guadalajara' },
    { stage:'group', group_name:'G', home_team:'Egito',           away_team:'Irã',            match_time:'2026-06-27T00:00:00-03:00', cidade:'Seattle' },
    { stage:'group', group_name:'G', home_team:'Nova Zelândia',   away_team:'Bélgica',        match_time:'2026-06-27T00:00:00-03:00', cidade:'Vancouver' },
    { stage:'group', group_name:'L', home_team:'Panamá',          away_team:'Inglaterra',     match_time:'2026-06-27T18:00:00-03:00', cidade:'Nova York' },
    { stage:'group', group_name:'L', home_team:'Croácia',         away_team:'Gana',           match_time:'2026-06-27T18:00:00-03:00', cidade:'Filadélfia' },
    { stage:'group', group_name:'K', home_team:'Colômbia',        away_team:'Portugal',       match_time:'2026-06-27T20:30:00-03:00', cidade:'Miami' },
    { stage:'group', group_name:'K', home_team:'RD Congo',        away_team:'Uzbequistão',    match_time:'2026-06-27T20:30:00-03:00', cidade:'Atlanta' },
    { stage:'group', group_name:'J', home_team:'Argélia',         away_team:'Áustria',        match_time:'2026-06-27T23:00:00-03:00', cidade:'Kansas City' },
    { stage:'group', group_name:'J', home_team:'Jordânia',        away_team:'Argentina',      match_time:'2026-06-27T23:00:00-03:00', cidade:'Dallas' },
  ];

  for (const g of games) {
    await db.execute({
      sql: 'INSERT INTO games (stage, group_name, home_team, away_team, match_time, cidade) VALUES (?, ?, ?, ?, ?, ?)',
      args: [g.stage, g.group_name, g.home_team, g.away_team, g.match_time, g.cidade],
    });
  }
  console.log(`Seeded ${games.length} games`);
}

module.exports = { db, initDb };
