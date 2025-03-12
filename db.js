import sqlite3 from "sqlite3";

const dbPath = './db/db.sqlite';

const verbose = sqlite3.verbose();
const db = new verbose.Database(dbPath, (err) => {
  if (err) console.error('Error opening database:', err.message);
  else console.log('Connected to SQLite database.');
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
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    password TEXT NOT NULL,
    sip TEXT NOT NULL,
    phone_number TEXT NOT NULL
  );
`);

export default db;
