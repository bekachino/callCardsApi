import sqlite3 from "sqlite3";

const dbPath = './db/db.sqlite';

const verbose = sqlite3.verbose();
const db = new verbose.Database(dbPath, (err) => {
  if (err) console.error('Error opening database:', err.message); else console.log('Connected to SQLite database.');
});

db.exec('PRAGMA foreign_keys = ON;');

db.run(`
  CREATE TABLE IF NOT EXISTS reasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT UNIQUE NOT NULL
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS solutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reason_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    FOREIGN KEY (reason_id) REFERENCES reasons(id) ON DELETE CASCADE
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    password TEXT NOT NULL,
    sip TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    is_senior_spec BOOLEAN DEFAULT 0
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ls_abon TEXT,
    account_id TEXT,
    n_result_id TEXT,
    phone_number TEXT,
    call_from TEXT,
    sip TEXT,
    spec_full_name TEXT,
    full_name TEXT,
    address TEXT,
    ip_address TEXT,
    mac_address TEXT,
    mac_onu TEXT,
    ip_olt TEXT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason_id INTEGER NOT NULL,
    solution_id INTEGER,
    senior_specs TEXT,
    FOREIGN KEY (reason_id) REFERENCES reasons(id) ON DELETE SET NULL,
    FOREIGN KEY (solution_id) REFERENCES solutions(id) ON DELETE SET NULL
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    check_in_time TEXT NOT NULL,
    check_out_time TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

export default db;
