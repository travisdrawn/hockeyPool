require('dotenv').config();
const { pool } = require('./db');

const PLAYERS = [
  { name: 'Nathan MacKinnon', points: 1, isTandem: false },
  { name: 'Nikita Kucherov', points: 4, isTandem: false },
  { name: 'Connor McDavid', points: 0, isTandem: false },
  { name: 'Mikko Rantanen', points: 4, isTandem: false },
  { name: 'Nick Suzuki', points: 3, isTandem: false },
  { name: 'David Pastrnak', points: 6, isTandem: false },
  { name: 'Evan Bouchard', points: 0, isTandem: false },
  { name: 'Cale Makar', points: 0, isTandem: false },
  { name: 'Kirill Kaprizov', points: 5, isTandem: false },
  { name: 'Jason Robertson', points: 8, isTandem: false },
  { name: 'Leon Draisaitl', points: 5, isTandem: false },
  { name: 'Jack Eichel', points: 2, isTandem: false },
  { name: 'Cole Caufield', points: 3, isTandem: false },
  { name: 'Wyatt Johnston', points: 8, isTandem: false },
  { name: 'Matt Boldy', points: 6, isTandem: false },
  { name: 'Lane Hutson', points: 3, isTandem: false },
  { name: 'Artemi Panarin', points: 4, isTandem: false },
  { name: 'Jake Guentzel', points: 4, isTandem: false },
  { name: 'Clayton Keller', points: 0, isTandem: false },
  { name: 'Tim Stutzle', points: 0, isTandem: false },
  { name: 'Sidney Crosby', points: 1, isTandem: false },
  { name: 'Tage Thompson', points: 5, isTandem: false },
  { name: 'Sebastian Aho', points: 2, isTandem: false },
  { name: 'Mitch Marner', points: 2, isTandem: false },
  { name: 'Brandon Hagel', points: 7, isTandem: false },
  { name: 'Dylan Guenther', points: 3, isTandem: false },
  { name: 'Adrian Kempe', points: 0, isTandem: false },
  { name: 'Drake Batherson', points: 2, isTandem: false },
  { name: 'Travis Konecny', points: 2, isTandem: false },
  { name: 'Trevor Zegras', points: 4, isTandem: false },
  { name: 'Leo Carlsson', points: 3, isTandem: false },
  { name: 'Darren Raddysh', points: 2, isTandem: false },
  { name: 'Morgan Geekie', points: 6, isTandem: false },
  { name: 'Andrei Svechnikov', points: 0, isTandem: false },
  { name: 'Cutter Gauthier', points: 5, isTandem: false },
  { name: 'Nikolaj Ehlers', points: 1, isTandem: false },
  { name: 'Bryan Rust', points: 3, isTandem: false },
  { name: 'Brock Nelson', points: 0, isTandem: false },
  { name: 'Rasmus Dahlin', points: 1, isTandem: false },
  { name: 'Erik Karlsson', points: 3, isTandem: false },
  { name: 'Miro Heiskanen', points: 3, isTandem: false },
  { name: 'Ivan Demidov', points: 1, isTandem: false },
  { name: 'Beckett Sennecke', points: 0, isTandem: false },
  { name: 'Ben Kindel', points: 0, isTandem: false },
  { name: 'Brady Tkachuk', points: 0, isTandem: false },
  { name: 'Tyson Forester', points: 0, isTandem: false },
  { name: 'Quinton Byfield', points: 1, isTandem: false },
  { name: 'Mark Stone', points: 4, isTandem: false },
  { name: 'Seth Jarvis', points: 0, isTandem: false },
  { name: 'Jason Zucker', points: 0, isTandem: false },
  { name: 'Scott Laughton', points: 0, isTandem: false },
  { name: 'Martin Necas', points: 1, isTandem: false },
  { name: 'Valeri Nichushkin', points: 0, isTandem: false },
  { name: 'Roope Hintz', points: 0, isTandem: false },
  { name: 'Nazem Kadri', points: 1, isTandem: false },
  { name: 'Tampa Tandem', points: 2, isTandem: true },
  { name: 'Dallas Tandem', points: 4, isTandem: true },
  { name: 'Boston Tandem', points: 2, isTandem: true },
  { name: 'Colorado Tandem', points: 4, isTandem: true },
  { name: 'Utah Tandem', points: 2, isTandem: true },
  { name: 'Anaheim Tandem', points: 2, isTandem: true },
  { name: 'Carolina Tandem', points: 7, isTandem: true },
  { name: 'Philadelphia Tandem', points: 9, isTandem: true },
  { name: 'Montreal Tandem', points: 2, isTandem: true },
];

const PARTICIPANTS = [
  {
    name: 'Connor Wiley',
    paid: false,
    roster: [
      'Nathan MacKinnon', 'David Pastrnak', 'Cale Makar', 'Kirill Kaprizov',
      'Cole Caufield', 'Matt Boldy', 'Jake Guentzel', 'Tage Thompson',
      'Mitch Marner', 'Travis Konecny', 'Leo Carlsson', 'Andrei Svechnikov',
      'Brock Nelson', 'Rasmus Dahlin', 'Ivan Demidov', 'Tyson Forester',
      'Tampa Tandem', 'Colorado Tandem', 'Montreal Tandem', 'Mark Stone',
    ],
  },
  {
    name: 'Matt Byl',
    paid: true,
    roster: [
      'Connor McDavid', 'Mikko Rantanen', 'Cale Makar', 'Kirill Kaprizov',
      'Cole Caufield', 'Lane Hutson', 'Tim Stutzle', 'Tage Thompson',
      'Brandon Hagel', 'Adrian Kempe', 'Trevor Zegras', 'Morgan Geekie',
      'Brock Nelson', 'Miro Heiskanen', 'Ivan Demidov', 'Tyson Forester',
      'Dallas Tandem', 'Colorado Tandem', 'Carolina Tandem', 'Seth Jarvis',
    ],
  },
  {
    name: 'Aaron Dempsey',
    paid: true,
    roster: [
      'Nathan MacKinnon', 'Mikko Rantanen', 'Cale Makar', 'Kirill Kaprizov',
      'Wyatt Johnston', 'Lane Hutson', 'Tim Stutzle', 'Sidney Crosby',
      'Dylan Guenther', 'Adrian Kempe', 'Leo Carlsson', 'Andrei Svechnikov',
      'Bryan Rust', 'Rasmus Dahlin', 'Ivan Demidov', 'Brady Tkachuk',
      'Dallas Tandem', 'Colorado Tandem', 'Montreal Tandem', 'Jason Zucker',
    ],
  },
  {
    name: 'Zach Speirs',
    paid: false,
    roster: [
      'Nikita Kucherov', 'Mikko Rantanen', 'Cale Makar', 'Leon Draisaitl',
      'Cole Caufield', 'Matt Boldy', 'Tim Stutzle', 'Tage Thompson',
      'Brandon Hagel', 'Adrian Kempe', 'Leo Carlsson', 'Morgan Geekie',
      'Nikolaj Ehlers', 'Erik Karlsson', 'Ivan Demidov', 'Brady Tkachuk',
      'Tampa Tandem', 'Utah Tandem', 'Montreal Tandem', 'Scott Laughton',
    ],
  },
  {
    name: 'Jovi Chaggar',
    paid: true,
    roster: [
      'Nathan MacKinnon', 'Mikko Rantanen', 'Cale Makar', 'Leon Draisaitl',
      'Jack Eichel', 'Artemi Panarin', 'Tim Stutzle', 'Sidney Crosby',
      'Mitch Marner', 'Adrian Kempe', 'Trevor Zegras', 'Andrei Svechnikov',
      'Brock Nelson', 'Rasmus Dahlin', 'Beckett Sennecke', 'Brady Tkachuk',
      'Tampa Tandem', 'Colorado Tandem', 'Montreal Tandem', 'Martin Necas',
    ],
  },
  {
    name: 'Sean Stok',
    paid: false,
    roster: [
      'Nathan MacKinnon', 'Mikko Rantanen', 'Cale Makar', 'Leon Draisaitl',
      'Cole Caufield', 'Matt Boldy', 'Jake Guentzel', 'Sidney Crosby',
      'Mitch Marner', 'Drake Batherson', 'Darren Raddysh', 'Andrei Svechnikov',
      'Bryan Rust', 'Miro Heiskanen', 'Ben Kindel', 'Brady Tkachuk',
      'Tampa Tandem', 'Colorado Tandem', 'Philadelphia Tandem', 'Mark Stone',
    ],
  },
  {
    name: 'Tanner Griffin',
    paid: false,
    roster: [
      'Connor McDavid', 'Mikko Rantanen', 'Evan Bouchard', 'Leon Draisaitl',
      'Wyatt Johnston', 'Matt Boldy', 'Tim Stutzle', 'Tage Thompson',
      'Mitch Marner', 'Travis Konecny', 'Trevor Zegras', 'Andrei Svechnikov',
      'Nikolaj Ehlers', 'Rasmus Dahlin', 'Beckett Sennecke', 'Brady Tkachuk',
      'Dallas Tandem', 'Colorado Tandem', 'Montreal Tandem', 'Valeri Nichushkin',
    ],
  },
  {
    name: 'Travis Rawn',
    paid: false,
    roster: [
      'Connor McDavid', 'David Pastrnak', 'Cale Makar', 'Leon Draisaitl',
      'Jack Eichel', 'Artemi Panarin', 'Jake Guentzel', 'Sebastian Aho',
      'Mitch Marner', 'Adrian Kempe', 'Leo Carlsson', 'Andrei Svechnikov',
      'Bryan Rust', 'Miro Heiskanen', 'Ivan Demidov', 'Brady Tkachuk',
      'Dallas Tandem', 'Anaheim Tandem', 'Philadelphia Tandem', 'Roope Hintz',
    ],
  },
  {
    name: 'Tyler Rettie',
    paid: false,
    roster: [
      'Nikita Kucherov', 'Nick Suzuki', 'Evan Bouchard', 'Kirill Kaprizov',
      'Jack Eichel', 'Artemi Panarin', 'Jake Guentzel', 'Sebastian Aho',
      'Brandon Hagel', 'Adrian Kempe', 'Leo Carlsson', 'Cutter Gauthier',
      'Bryan Rust', 'Miro Heiskanen', 'Ivan Demidov', 'Quinton Byfield',
      'Dallas Tandem', 'Anaheim Tandem', 'Carolina Tandem', 'Nazem Kadri',
    ],
  },
  {
    name: 'Kyle',
    paid: false,
    roster: [
      'Nathan MacKinnon', 'Mikko Rantanen', 'Cale Makar', 'Jason Robertson',
      'Wyatt Johnston', 'Matt Boldy', 'Jake Guentzel', 'Sebastian Aho',
      'Brandon Hagel', 'Adrian Kempe', 'Darren Raddysh', 'Andrei Svechnikov',
      'Brock Nelson', 'Miro Heiskanen', 'Ivan Demidov', 'Quinton Byfield',
      'Tampa Tandem', 'Utah Tandem', 'Carolina Tandem', 'Valeri Nichushkin',
    ],
  },
  {
    name: 'Monty Corrigan',
    paid: false,
    roster: [
      'Nikita Kucherov', 'Mikko Rantanen', 'Cale Makar', 'Jason Robertson',
      'Cole Caufield', 'Lane Hutson', 'Clayton Keller', 'Sidney Crosby',
      'Brandon Hagel', 'Drake Batherson', 'Leo Carlsson', 'Morgan Geekie',
      'Brock Nelson', 'Miro Heiskanen', 'Ben Kindel', 'Tyson Forester',
      'Tampa Tandem', 'Colorado Tandem', 'Montreal Tandem', 'Nazem Kadri',
    ],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS hp_players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        points INTEGER NOT NULL DEFAULT 0,
        is_tandem BOOLEAN NOT NULL DEFAULT false
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hp_participants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        paid BOOLEAN NOT NULL DEFAULT false
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hp_rosters (
        participant_id INTEGER REFERENCES hp_participants(id) ON DELETE CASCADE,
        player_name VARCHAR(100) NOT NULL,
        PRIMARY KEY (participant_id, player_name)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hp_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    for (const p of PLAYERS) {
      await client.query(
        `INSERT INTO hp_players (name, points, is_tandem) VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET points = $2, is_tandem = $3`,
        [p.name, p.points, p.isTandem]
      );
    }

    for (const p of PARTICIPANTS) {
      const res = await client.query(
        `INSERT INTO hp_participants (name, paid) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET paid = $2 RETURNING id`,
        [p.name, p.paid]
      );
      const participantId = res.rows[0].id;

      await client.query('DELETE FROM hp_rosters WHERE participant_id = $1', [participantId]);
      for (const playerName of p.roster) {
        await client.query(
          'INSERT INTO hp_rosters (participant_id, player_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [participantId, playerName]
        );
      }
    }

    await client.query(
      `INSERT INTO hp_settings (key, value) VALUES ('last_updated', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [new Date().toISOString()]
    );

    await client.query('COMMIT');
    console.log('Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
