const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { hashSync } = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const env = require("./env");

const dbAbsolutePath = path.resolve(process.cwd(), env.DB_PATH);
fs.mkdirSync(path.dirname(dbAbsolutePath), { recursive: true });

const db = new Database(dbAbsolutePath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('viewer', 'analyst', 'admin')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS financial_records (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    ledger_hash TEXT,
    counterparty TEXT,
    status TEXT NOT NULL DEFAULT 'verified',
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

function seedUsers() {
  const count = db.prepare("SELECT COUNT(*) AS total FROM users").get().total;
  if (count > 0) {
    return;
  }

  const insertUser = db.prepare(
    "INSERT INTO users (id, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)"
  );

  const defaultUsers = [
    { email: "admin@kinetic.local", password: "Admin@123", role: "admin" },
    { email: "analyst@kinetic.local", password: "Analyst@123", role: "analyst" },
    { email: "viewer@kinetic.local", password: "Viewer@123", role: "viewer" },
  ];

  const tx = db.transaction(() => {
    for (const user of defaultUsers) {
      insertUser.run(randomUUID(), user.email, hashSync(user.password, 12), user.role);
    }
  });
  tx();
}

function seedRecords() {
  const count = db.prepare("SELECT COUNT(*) AS total FROM financial_records").get().total;
  if (count > 0) {
    return;
  }

  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!admin) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO financial_records (
      id, amount, type, category, date, notes, ledger_hash, counterparty, status, is_deleted, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);

  const records = [
    [1284000, "income", "Liquid Equity", "2026-03-20", "Quarterly equity settlement", "0x88f2a9", "Vector_Corp_Alpha", "verified"],
    [450000, "expense", "Flash Loan", "2026-03-18", "Suspicious high-speed movement", "0x12a90b", "Anomalous_Relay_04", "flagged"],
    [12500.2, "income", "Governance Fee", "2026-03-16", "Protocol governance fee", "0xbc71e4", "Sentinel_Foundation", "verified"],
    [1040, "expense", "Gas Settlement", "2026-03-12", "Internal node settlement", "0x33bb81", "Internal_Sync_Node", "pending"],
    [4500000, "income", "Asset Transfer", "2026-03-07", "Bridge transfer", "0xfe22dd", "Global_Bridge_V1", "verified"],
  ];

  const tx = db.transaction(() => {
    for (const record of records) {
      insert.run(randomUUID(), ...record, admin.id);
    }
  });
  tx();
}

seedUsers();
seedRecords();

module.exports = db;
