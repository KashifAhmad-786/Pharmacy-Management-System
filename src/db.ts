
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data.db');
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    genericName TEXT,
    category TEXT,
    manufacturer TEXT,
    purchasePrice REAL,
    salePrice REAL,
    quantity INTEGER DEFAULT 0,
    expiryDate TEXT,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceNumber TEXT UNIQUE,
    customerName TEXT,
    totalAmount REAL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    saleId INTEGER,
    medicineId INTEGER,
    medicineName TEXT,
    quantity INTEGER,
    unitPrice REAL,
    total REAL,
    FOREIGN KEY(saleId) REFERENCES sales(id)
  );
`);

// Seed Admin
const seedAdmin = () => {
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!admin) {
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
    console.log('Admin user seeded');
  }
};

seedAdmin();

export default db;
