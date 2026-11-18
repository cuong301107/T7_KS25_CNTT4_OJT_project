const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Phuc vu frontend tinh (thu muc frontend nam cung cap voi backend)
const frontendDir = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendDir));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, status: 'ok', database: 'connected' });
  } catch (e) {
    res.status(503).json({ success: false, status: 'degraded', database: 'unreachable', error: e.message });
  }
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log('==============================================');
  console.log('  ShopEase API dang chay tai:');
  console.log(`  http://localhost:${env.port}`);
  console.log('==============================================');
});
