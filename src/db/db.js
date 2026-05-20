const Database = require('better-sqlite3');
const path = require('path');

// Create/open the SQLite database
const dbPath = path.join(__dirname, '../../bugtracker.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Export the database instance
module.exports = db;
