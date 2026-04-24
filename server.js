require('dotenv').config();
const express = require('express');
const path = require('path');
const { getLeaderboardData, updatePlayerPoints } = require('./db');
const { syncStats } = require('./nhlSync');

const app = express();
const clients = new Set();

// BASE_PATH: set to /hockeypool on DO, empty for local dev
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');

app.use(express.json());

// Redirect /hockeypool → /hockeypool/ so relative URLs in HTML resolve correctly
if (BASE) {
  app.get(BASE, (req, res) => res.redirect(301, BASE + '/'));
}

app.use(BASE + '/', express.static(path.join(__dirname, 'public')));

app.get(BASE + '/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = data => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const ping = () => res.write(': ping\n\n');

  getLeaderboardData()
    .then(send)
    .catch(err => console.error('SSE initial data error:', err));

  const keepalive = setInterval(ping, 25000);
  clients.add(send);
  req.on('close', () => {
    clearInterval(keepalive);
    clients.delete(send);
  });
});

function broadcast(data) {
  clients.forEach(send => send(data));
}

app.get(BASE + '/api/data', async (req, res) => {
  try {
    res.json(await getLeaderboardData());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post(BASE + '/api/update', async (req, res) => {
  if (req.body.adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  const updates = req.body.updates;
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'updates array required' });
  }
  try {
    await updatePlayerPoints(updates);
    const data = await getLeaderboardData();
    broadcast(data);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.post(BASE + '/api/sync', async (req, res) => {
  if (req.body.adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  res.json({ message: 'Sync started' });
  syncStats(broadcast).catch(err => console.error('Manual sync error:', err));
});

// Health check at both root and prefixed path so DO can reach it
app.get('/api/health', (req, res) => res.json({ ok: true }));
if (BASE) app.get(BASE + '/api/health', (req, res) => res.json({ ok: true }));

const SYNC_INTERVAL_MS = 10 * 60 * 1000;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Hockey pool running on http://localhost:${PORT}${BASE}/`);
  syncStats(broadcast).catch(err => console.error('Startup sync error:', err));
  setInterval(
    () => syncStats(broadcast).catch(err => console.error('Scheduled sync error:', err)),
    SYNC_INTERVAL_MS
  );
});
