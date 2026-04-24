require('dotenv').config();
const express = require('express');
const path = require('path');
const { getLeaderboardData, updatePlayerPoints } = require('./db');
const { syncStats } = require('./nhlSync');

const app = express();
const clients = new Set();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Server-Sent Events — all connected browsers get live updates
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = data => res.write(`data: ${JSON.stringify(data)}\n\n`);

  getLeaderboardData()
    .then(send)
    .catch(err => console.error('SSE initial data error:', err));

  clients.add(send);
  req.on('close', () => clients.delete(send));
});

function broadcast(data) {
  clients.forEach(send => send(data));
}

app.get('/api/data', async (req, res) => {
  try {
    res.json(await getLeaderboardData());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: update one or more player point totals manually
// Body: { adminKey: string, updates: [{ name: string, points: number }] }
app.post('/api/update', async (req, res) => {
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

// Admin: force an immediate NHL API sync
app.post('/api/sync', async (req, res) => {
  if (req.body.adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  res.json({ message: 'Sync started' });
  syncStats(broadcast).catch(err => console.error('Manual sync error:', err));
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Hockey pool running on http://localhost:${PORT}`);

  // Initial sync on startup, then every 10 minutes
  syncStats(broadcast).catch(err => console.error('Startup sync error:', err));
  setInterval(
    () => syncStats(broadcast).catch(err => console.error('Scheduled sync error:', err)),
    SYNC_INTERVAL_MS
  );
});
