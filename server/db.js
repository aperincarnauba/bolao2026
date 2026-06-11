const path = require('path');
const fs = require('fs');

// ── PostgreSQL (Replit) or SQLite (local) ────────────────────────────────────
const USE_PG = !!process.env.DATABASE_URL;

let db;

if (USE_PG) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log('[db] PostgreSQL conectado');

  // Wrapper que imita a API do @libsql/client:
  //   db.execute('SELECT ...') or db.execute({ sql: '...', args: [...] })
  //   returns { rows, rowsAffected }
  db = {
    _pool: pool,
    async execute(sqlOrObj) {
      let sql, args;
      if (typeof sqlOrObj === 'string') { sql = sqlOrObj; args = []; }
      else { sql = sqlOrObj.sql; args = sqlOrObj.args || []; }
      // Convert ? placeholders → $1 $2 ... (PostgreSQL style)
      let i = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++i}`);
      const result = await pool.query(pgSql, args);
      return { rows: result.rows, rowsAffected: result.rowCount ?? 0 };
    },
  };
} else {
  const { createClient } = require('@libsql/client');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'bolao.db');
  const dbUrl = 'file:' + dbPath.replace(/\\/g, '/');
  console.log(`[db] SQLite: ${dbPath}`);
  db = createClient({ url: dbUrl });
}

// ── Schema ────────────────────────────────────────────────────────────────────
async function initDb() {
  if (USE_PG) {
    const pool = db._pool;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        stage TEXT NOT NULL,
        group_name TEXT,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        match_time TEXT NOT NULL,
        cidade TEXT,
        home_score INTEGER,
        away_score INTEGER,
        status TEXT DEFAULT 'scheduled'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        game_id INTEGER NOT NULL REFERENCES games(id),
        home_score INTEGER NOT NULL,
        away_score INTEGER NOT NULL,
        points_awarded INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, game_id)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_pred_user ON predictions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_pred_game ON predictions(game_id)`);
  } else {
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
  }

  await seedGames();
  await migrateGames();
}

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seedGames() {
  const result = await db.execute('SELECT COUNT(*) as c FROM games');
  const count = Number(result.rows[0].c);
  if (count > 0) return;

  const games = [
    // ══════════ 1ª RODADA — 11 a 14 de junho ══════════
    { stage:'group', group_name:'A', home_team:'México',          away_team:'África do Sul',  match_time:'2026-06-11T16:00:00-03:00', cidade:'Cidade do México' },
    { stage:'group', group_name:'A', home_team:'Coreia do Sul',   away_team:'República Tcheca',    match_time:'2026-06-11T23:00:00-03:00', cidade:'Guadalajara' },
    { stage:'group', group_name:'B', home_team:'Canadá',          away_team:'Bósnia e Herzegovina',match_time:'2026-06-12T16:00:00-03:00', cidade:'Toronto' },
    { stage:'group', group_name:'D', home_team:'Estados Unidos',  away_team:'Paraguai',       match_time:'2026-06-12T22:00:00-03:00', cidade:'Los Angeles' },
    { stage:'group', group_name:'D', home_team:'Austrália',       away_team:'Turquia',        match_time:'2026-06-14T01:00:00-03:00', cidade:'Vancouver' },
    { stage:'group', group_name:'B', home_team:'Catar',           away_team:'Suíça',          match_time:'2026-06-13T16:00:00-03:00', cidade:'San Francisco' },
    { stage:'group', group_name:'C', home_team:'Brasil',          away_team:'Marrocos',       match_time:'2026-06-13T19:00:00-03:00', cidade:'Nova York' },
    { stage:'group', group_name:'C', home_team:'Haiti',           away_team:'Escócia',        match_time:'2026-06-13T22:00:00-03:00', cidade:'Boston' },
    { stage:'group', group_name:'E', home_team:'Alemanha',        away_team:'Curaçau',        match_time:'2026-06-14T14:00:00-03:00', cidade:'Houston' },
    { stage:'group', group_name:'F', home_team:'Holanda',         away_team:'Japão',          match_time:'2026-06-14T17:00:00-03:00', cidade:'Dallas' },
    { stage:'group', group_name:'E', home_team:'Costa do Marfim', away_team:'Equador',        match_time:'2026-06-14T20:00:00-03:00', cidade:'Filadélfia' },
    { stage:'group', group_name:'F', home_team:'Suécia',          away_team:'Tunísia',        match_time:'2026-06-14T23:00:00-03:00', cidade:'Monterrey' },
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
    { stage:'group', group_name:'A', home_team:'República Tcheca', away_team:'África do Sul',       match_time:'2026-06-18T13:00:00-03:00', cidade:'Atlanta' },
    { stage:'group', group_name:'B', home_team:'Suíça',           away_team:'Bósnia e Herzegovina',match_time:'2026-06-18T16:00:00-03:00', cidade:'Los Angeles' },
    { stage:'group', group_name:'B', home_team:'Canadá',          away_team:'Catar',          match_time:'2026-06-18T19:00:00-03:00', cidade:'Vancouver' },
    { stage:'group', group_name:'A', home_team:'México',          away_team:'Coreia do Sul',  match_time:'2026-06-18T22:00:00-03:00', cidade:'Guadalajara' },
    { stage:'group', group_name:'D', home_team:'Turquia',         away_team:'Paraguai',       match_time:'2026-06-20T00:00:00-03:00', cidade:'San Francisco' },
    { stage:'group', group_name:'D', home_team:'Estados Unidos',  away_team:'Austrália',      match_time:'2026-06-19T16:00:00-03:00', cidade:'Seattle' },
    { stage:'group', group_name:'C', home_team:'Escócia',         away_team:'Marrocos',       match_time:'2026-06-19T19:00:00-03:00', cidade:'Boston' },
    { stage:'group', group_name:'C', home_team:'Brasil',          away_team:'Haiti',          match_time:'2026-06-19T21:30:00-03:00', cidade:'Filadélfia' },
    { stage:'group', group_name:'F', home_team:'Holanda',         away_team:'Suécia',         match_time:'2026-06-20T14:00:00-03:00', cidade:'Houston' },
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
    { stage:'group', group_name:'B', home_team:'Bósnia e Herzegovina', away_team:'Catar',     match_time:'2026-06-24T16:00:00-03:00', cidade:'Seattle' },
    { stage:'group', group_name:'C', home_team:'Escócia',         away_team:'Brasil',         match_time:'2026-06-24T19:00:00-03:00', cidade:'Miami' },
    { stage:'group', group_name:'C', home_team:'Marrocos',        away_team:'Haiti',          match_time:'2026-06-24T19:00:00-03:00', cidade:'Atlanta' },
    { stage:'group', group_name:'A', home_team:'República Tcheca', away_team:'México',        match_time:'2026-06-24T22:00:00-03:00', cidade:'Cidade do México' },
    { stage:'group', group_name:'A', home_team:'África do Sul',   away_team:'Coreia do Sul',  match_time:'2026-06-24T22:00:00-03:00', cidade:'Monterrey' },
    { stage:'group', group_name:'E', home_team:'Equador',         away_team:'Alemanha',       match_time:'2026-06-25T17:00:00-03:00', cidade:'Nova York' },
    { stage:'group', group_name:'E', home_team:'Curaçau',         away_team:'Costa do Marfim',match_time:'2026-06-25T17:00:00-03:00', cidade:'Filadélfia' },
    { stage:'group', group_name:'F', home_team:'Japão',           away_team:'Suécia',         match_time:'2026-06-25T20:00:00-03:00', cidade:'Dallas' },
    { stage:'group', group_name:'F', home_team:'Tunísia',         away_team:'Holanda',        match_time:'2026-06-25T20:00:00-03:00', cidade:'Kansas City' },
    { stage:'group', group_name:'D', home_team:'Turquia',         away_team:'Estados Unidos', match_time:'2026-06-25T23:00:00-03:00', cidade:'Los Angeles' },
    { stage:'group', group_name:'D', home_team:'Paraguai',        away_team:'Austrália',      match_time:'2026-06-25T23:00:00-03:00', cidade:'San Francisco' },
    { stage:'group', group_name:'H', home_team:'Cabo Verde',      away_team:'Arábia Saudita', match_time:'2026-06-26T17:00:00-03:00', cidade:'Houston' },
    { stage:'group', group_name:'H', home_team:'Uruguai',         away_team:'Espanha',        match_time:'2026-06-26T17:00:00-03:00', cidade:'Guadalajara' },
    { stage:'group', group_name:'G', home_team:'Egito',           away_team:'Irã',            match_time:'2026-06-26T20:00:00-03:00', cidade:'Seattle' },
    { stage:'group', group_name:'G', home_team:'Nova Zelândia',   away_team:'Bélgica',        match_time:'2026-06-26T20:00:00-03:00', cidade:'Vancouver' },
    { stage:'group', group_name:'I', home_team:'Noruega',         away_team:'França',         match_time:'2026-06-26T23:00:00-03:00', cidade:'Boston' },
    { stage:'group', group_name:'I', home_team:'Senegal',         away_team:'Iraque',         match_time:'2026-06-26T23:00:00-03:00', cidade:'Toronto' },
    { stage:'group', group_name:'L', home_team:'Panamá',          away_team:'Inglaterra',     match_time:'2026-06-27T18:00:00-03:00', cidade:'Nova York' },
    { stage:'group', group_name:'L', home_team:'Croácia',         away_team:'Gana',           match_time:'2026-06-27T18:00:00-03:00', cidade:'Filadélfia' },
    { stage:'group', group_name:'K', home_team:'Colômbia',        away_team:'Portugal',       match_time:'2026-06-27T20:30:00-03:00', cidade:'Miami' },
    { stage:'group', group_name:'K', home_team:'RD Congo',        away_team:'Uzbequistão',    match_time:'2026-06-27T20:30:00-03:00', cidade:'Atlanta' },
    { stage:'group', group_name:'J', home_team:'Argélia',         away_team:'Áustria',        match_time:'2026-06-27T15:00:00-03:00', cidade:'Kansas City' },
    { stage:'group', group_name:'J', home_team:'Jordânia',        away_team:'Argentina',      match_time:'2026-06-27T15:00:00-03:00', cidade:'Dallas' },
  ];

  for (const g of games) {
    await db.execute({
      sql: 'INSERT INTO games (stage, group_name, home_team, away_team, match_time, cidade) VALUES (?, ?, ?, ?, ?, ?)',
      args: [g.stage, g.group_name, g.home_team, g.away_team, g.match_time, g.cidade],
    });
  }
  console.log(`Seeded ${games.length} games`);
}

// ── Migrations (idempotent) ───────────────────────────────────────────────────
async function migrateGames() {
  const fixes = [
    { sql: "UPDATE games SET away_team = 'República Tcheca' WHERE away_team = 'Dinamarca'" },
    { sql: "UPDATE games SET home_team = 'República Tcheca' WHERE home_team = 'Dinamarca'" },
    { sql: "UPDATE games SET away_team = 'Bósnia e Herzegovina' WHERE away_team = 'Itália' AND group_name = 'B'" },
    { sql: "UPDATE games SET home_team = 'Bósnia e Herzegovina' WHERE home_team = 'Itália' AND group_name = 'B'" },
    { sql: "UPDATE games SET home_team = 'Suécia' WHERE home_team = 'Albânia' AND group_name = 'F'" },
    { sql: "UPDATE games SET away_team = 'Suécia' WHERE away_team = 'Albânia' AND group_name = 'F'" },
  ];
  for (const fix of fixes) {
    const r = await db.execute(fix.sql);
    if (r.rowsAffected > 0) console.log(`[migrate] ${r.rowsAffected} row(s): ${fix.sql.slice(0, 60)}`);
  }
}

module.exports = { db, initDb };
