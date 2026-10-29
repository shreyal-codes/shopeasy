// SQLite connection using Node's built-in sqlite module (Node 22.13 or newer).
// No native package to compile, so it installs cleanly on Windows.
// On the very first run it creates the tables, inserts the seed data
// and adds the admin + demo accounts.
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'shopeasy.db');
const raw = new DatabaseSync(dbFile);
raw.exec('PRAGMA foreign_keys = ON');

// Small wrapper so the controllers can use db.prepare(...).get/all/run and db.transaction(...)
const db = {
  exec: (sql) => raw.exec(sql),

  prepare: (sql) => {
    const stmt = raw.prepare(sql);
    return {
      run: (...args) => stmt.run(...args),   // returns { changes, lastInsertRowid }
      get: (...args) => stmt.get(...args),   // one row or undefined
      all: (...args) => stmt.all(...args),   // array of rows
    };
  },

  // Runs fn between BEGIN and COMMIT. If anything throws, ROLLBACK undoes every change.
  transaction: (fn) => (...args) => {
    raw.exec('BEGIN');
    try {
      const result = fn(...args);
      raw.exec('COMMIT');
      return result;
    } catch (err) {
      raw.exec('ROLLBACK');
      throw err;
    }
  },
};

const tableExists = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
  .get();

if (!tableExists) {
  console.log('First run: creating database...');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));

  const addUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  addUser.run('Store Admin', 'admin@shopeasy.com', bcrypt.hashSync('admin123', 10), 'admin');
  addUser.run('Demo Customer', 'customer@shopeasy.com', bcrypt.hashSync('customer123', 10), 'customer');
  console.log('Database ready.');
}

module.exports = db;
