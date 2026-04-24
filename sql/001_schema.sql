-- 2026 NHL Playoff Pool schema
-- Uses hp_ prefix to coexist with other tables in the dart-groups database

CREATE TABLE IF NOT EXISTS hp_players (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) UNIQUE NOT NULL,
  points    INTEGER NOT NULL DEFAULT 0,
  is_tandem BOOLEAN NOT NULL DEFAULT false,
  -- skaters: goals/assists tracked separately for breakdown display
  goals     INTEGER NOT NULL DEFAULT 0,
  assists   INTEGER NOT NULL DEFAULT 0,
  -- tandems: team wins/shutouts tracked for scoring formula
  wins      INTEGER NOT NULL DEFAULT 0,
  shutouts  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hp_participants (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS hp_rosters (
  participant_id INTEGER NOT NULL REFERENCES hp_participants(id) ON DELETE CASCADE,
  player_name    VARCHAR(100) NOT NULL,
  PRIMARY KEY (participant_id, player_name)
);

CREATE TABLE IF NOT EXISTS hp_settings (
  key   VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL
);

-- Caches NHL API player IDs so we only search once per player
CREATE TABLE IF NOT EXISTS hp_player_ids (
  player_name VARCHAR(100) PRIMARY KEY REFERENCES hp_players(name) ON DELETE CASCADE,
  nhl_id      INTEGER,
  looked_up   BOOLEAN NOT NULL DEFAULT false
);

-- Maps tandem names to the two NHL players that compose them
-- Tandem points = sum of both players' playoff points
CREATE TABLE IF NOT EXISTS hp_tandem_config (
  tandem_name VARCHAR(100) PRIMARY KEY REFERENCES hp_players(name) ON DELETE CASCADE,
  player1     VARCHAR(100),
  player2     VARCHAR(100)
);
