import sqlite3 from "sqlite3";

const verbose = sqlite3.verbose();
const db = new verbose.Database('./database.sqlite', (err) => {
  if (err) console.error('Error opening database:', err.message);
  else console.log('Connected to SQLite database.');
});

export default db;
