const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "receipts.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Connected to SQLite database");
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`
  CREATE TABLE IF NOT EXISTS receipt_file (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    is_valid BOOLEAN DEFAULT 0,
    invalid_reason TEXT,
    is_processed BOOLEAN DEFAULT 0,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

    db.run(`
  CREATE TABLE IF NOT EXISTS receipt (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchased_at TIMESTAMP,
    merchant_name TEXT,
    total_amount REAL,
    file_path TEXT,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);
    db.run(`
      CREATE TRIGGER IF NOT EXISTS update_receipt_file_timestamp
      AFTER UPDATE ON receipt_file
      FOR EACH ROW
      BEGIN
        UPDATE receipt_file SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END
    `);

    db.run(`
      CREATE TRIGGER IF NOT EXISTS update_receipt_timestamp
      AFTER UPDATE ON receipt
      FOR EACH ROW
      BEGIN
        UPDATE receipt SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END
    `);
  });

  db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
}

module.exports = db;
