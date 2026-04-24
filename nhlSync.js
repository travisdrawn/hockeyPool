require('dotenv').config();
const { pool, getLeaderboardData } = require('./db');

const SEASON = 20252026;
const BASE = `https://api-web.nhle.com/v1`;

const TANDEM_TEAMS = {
  'Tampa Tandem':        'TBL',
  'Dallas Tandem':       'DAL',
  'Boston Tandem':       'BOS',
  'Carolina Tandem':     'CAR',
  'Utah Tandem':         'UTA',
  'Anaheim Tandem':      'ANA',
  'Philadelphia Tandem': 'PHI',
  'Colorado Tandem':     'COL',
  'Montreal Tandem':     'MTL',
};

function normalize(name) {
  return name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`NHL API ${res.status} — ${url}`);
  return res.json();
}

// Returns Map<normalizedName, value> for a given category
async function fetchSkaterLeaders(category) {
  const data = await fetchJson(`${BASE}/skater-stats-leaders/${SEASON}/3?categories=${category}&limit=500`);
  const map = new Map();
  for (const p of (data[category] ?? [])) {
    map.set(normalize(`${p.firstName.default} ${p.lastName.default}`), p.value);
  }
  return map;
}

// Returns { [teamAbbrev]: { wins, shutouts, goals, assists } }
async function fetchGoalieStatsByTeam() {
  const [winsData, soData, goalsData, assistsData] = await Promise.all([
    fetchJson(`${BASE}/goalie-stats-leaders/${SEASON}/3?categories=wins&limit=50`),
    fetchJson(`${BASE}/goalie-stats-leaders/${SEASON}/3?categories=shutouts&limit=50`),
    fetchJson(`${BASE}/goalie-stats-leaders/${SEASON}/3?categories=goals&limit=50`).catch(() => ({ goals: [] })),
    fetchJson(`${BASE}/goalie-stats-leaders/${SEASON}/3?categories=assists&limit=50`).catch(() => ({ assists: [] })),
  ]);

  const teams = {};
  const ensure = a => { if (!teams[a]) teams[a] = { wins: 0, shutouts: 0, goals: 0, assists: 0 }; };

  for (const g of (winsData.wins       ?? [])) { ensure(g.teamAbbrev); teams[g.teamAbbrev].wins     += g.value; }
  for (const g of (soData.shutouts     ?? [])) { ensure(g.teamAbbrev); teams[g.teamAbbrev].shutouts += g.value; }
  for (const g of (goalsData.goals     ?? [])) { ensure(g.teamAbbrev); teams[g.teamAbbrev].goals    += g.value; }
  for (const g of (assistsData.assists ?? [])) { ensure(g.teamAbbrev); teams[g.teamAbbrev].assists  += g.value; }

  return teams;
}

async function syncStats(broadcastFn) {
  console.log('[nhlSync] Starting sync…');

  let goalMap, assistMap, goalieTeams;
  try {
    [goalMap, assistMap, goalieTeams] = await Promise.all([
      fetchSkaterLeaders('goals'),
      fetchSkaterLeaders('assists'),
      fetchGoalieStatsByTeam(),
    ]);
    console.log(`[nhlSync] ${goalMap.size} goal scorers | ${assistMap.size} assist leaders fetched.`);
  } catch (err) {
    console.error('[nhlSync] Fetch failed:', err.message);
    return;
  }

  const { rows: players } = await pool.query('SELECT name, is_tandem FROM hp_players');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const { name, is_tandem } of players) {
      if (!is_tandem) {
        const goals   = goalMap.get(normalize(name))   ?? 0;
        const assists = assistMap.get(normalize(name)) ?? 0;
        const points  = (goals * 2) + (assists * 1);
        await client.query(
          'UPDATE hp_players SET goals=$1, assists=$2, points=$3 WHERE name=$4',
          [goals, assists, points, name]
        );
      } else {
        const abbrev = TANDEM_TEAMS[name];
        if (!abbrev) continue;
        const s = goalieTeams[abbrev] ?? { wins: 0, shutouts: 0, goals: 0, assists: 0 };
        const points = (s.wins * 2) + (s.shutouts * 5) + (s.goals * 2) + (s.assists * 1);
        await client.query(
          'UPDATE hp_players SET wins=$1, shutouts=$2, goals=$3, assists=$4, points=$5 WHERE name=$6',
          [s.wins, s.shutouts, s.goals, s.assists, points, name]
        );
      }
    }

    const now = new Date().toISOString();
    await client.query(
      "INSERT INTO hp_settings (key,value) VALUES ('last_updated',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [now]
    );

    await client.query('COMMIT');
    console.log('[nhlSync] DB updated.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[nhlSync] DB update failed:', err.message);
  } finally {
    client.release();
  }

  if (broadcastFn) {
    const data = await getLeaderboardData();
    broadcastFn(data);
  }

  console.log('[nhlSync] Done.');
}

module.exports = { syncStats };
