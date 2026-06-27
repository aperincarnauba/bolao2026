require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const { startSyncInterval } = require('./sync');
const { recalcAllFinishedGames } = require('./scoring');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

initDb().then(async () => {
  await recalcAllFinishedGames();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bolão Copa 2026 rodando na porta ${PORT}`);
    startSyncInterval(3 * 60 * 1000);
  });
}).catch(err => {
  console.error('Falha ao inicializar banco de dados:', err);
  process.exit(1);
});
