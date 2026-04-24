require('dotenv').config();
const { Pool } = require('pg');

const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');
if (!isLocal) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function getLeaderboardData() {
  const [playersRes, participantsRes, rostersRes, settingsRes] = await Promise.all([
    pool.query('SELECT name, points, is_tandem, goals, assists, wins, shutouts FROM hp_players ORDER BY name'),
    pool.query('SELECT id, name FROM hp_participants ORDER BY name'),
    pool.query('SELECT participant_id, player_name FROM hp_rosters'),
    pool.query("SELECT value FROM hp_settings WHERE key = 'last_updated'"),
  ]);

  const players = {};
  playersRes.rows.forEach(p => {
    players[p.name] = {
      points: p.points,
      isTandem: p.is_tandem,
      goals: p.goals,
      assists: p.assists,
      wins: p.wins,
      shutouts: p.shutouts,
    };
  });

  const participants = participantsRes.rows.map(p => {
    const roster = rostersRes.rows
      .filter(r => r.participant_id === p.id)
      .map(r => r.player_name);
    const total = roster.reduce((sum, name) => sum + (players[name]?.points ?? 0), 0);
    return { id: p.id, name: p.name, roster, total };
  });

  participants.sort((a, b) => b.total - a.total);

  return {
    players,
    participants,
    lastUpdated: settingsRes.rows[0]?.value ?? new Date().toISOString(),
  };
}

async function updatePlayerPoints(updates) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { name, points } of updates) {
      await client.query('UPDATE hp_players SET points = $1 WHERE name = $2', [points, name]);
    }
    const now = new Date().toISOString();
    await client.query(
      "INSERT INTO hp_settings (key, value) VALUES ('last_updated', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [now]
    );
    await client.query('COMMIT');
    return now;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, getLeaderboardData, updatePlayerPoints };
