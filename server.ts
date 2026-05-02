
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from './src/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_me';
const PORT = process.env.PORT || 3000;

// Allowed origins: Vercel frontend + local dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://pharmacy-management-system-sandy.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

async function startServer() {
  const app = express();

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed'));
    },
    credentials: true,
  }));
  app.use(morgan('dev'));
  app.use(express.json());


  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { username: user.username, role: user.role } });
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const totalMedicines = db.prepare('SELECT COUNT(*) as count FROM medicines').get() as any;
    const lowStock = db.prepare('SELECT COUNT(*) as count FROM medicines WHERE quantity < 10').get() as any;
    const todaySales = db.prepare("SELECT SUM(totalAmount) as total FROM sales WHERE date >= date('now')").get() as any;
    const totalRevenue = db.prepare('SELECT SUM(totalAmount) as total FROM sales').get() as any;
    const totalPurchaseValue = db.prepare('SELECT SUM(purchasePrice * quantity) as total FROM medicines').get() as any;
    const totalInvoices = db.prepare('SELECT COUNT(*) as count FROM sales').get() as any;

    res.json({
      totalMedicines: totalMedicines.count,
      lowStockCount: lowStock.count,
      todaySalesRevenue: todaySales.total || 0,
      totalRevenue: totalRevenue.total || 0,
      totalPurchaseValue: totalPurchaseValue.total || 0,
      totalInvoices: totalInvoices.count
    });
  });

  // Medicines
  app.get('/api/medicines', authenticateToken, (req, res) => {
    const { search, category } = req.query;
    let query = 'SELECT * FROM medicines WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR genericName LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY createdAt DESC';
    const medicines = db.prepare(query).all(...params);
    res.json(medicines);
  });

  app.post('/api/medicines', authenticateToken, (req, res) => {
    const { name, genericName, category, manufacturer, purchasePrice, salePrice, quantity, expiryDate, description } = req.body;
    const stmt = db.prepare(`
      INSERT INTO medicines (name, genericName, category, manufacturer, purchasePrice, salePrice, quantity, expiryDate, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, genericName, category, manufacturer, purchasePrice, salePrice, quantity, expiryDate, description);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/medicines/:id', authenticateToken, (req, res) => {
    db.prepare('DELETE FROM medicines WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  });

  // Sales
  app.post('/api/sales', authenticateToken, (req, res) => {
    const { customerName, items, totalAmount } = req.body;
    const invoiceNumber = 'INV-' + Date.now();

    const transaction = db.transaction(() => {
      const saleStmt = db.prepare('INSERT INTO sales (invoiceNumber, customerName, totalAmount) VALUES (?, ?, ?)');
      const saleResult = saleStmt.run(invoiceNumber, customerName, totalAmount);
      const saleId = saleResult.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO sale_items (saleId, medicineId, medicineName, quantity, unitPrice, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare('UPDATE medicines SET quantity = quantity - ? WHERE id = ?');

      for (const item of items) {
        itemStmt.run(saleId, item.id, item.name, item.quantity, item.salePrice, item.quantity * item.salePrice);
        updateStockStmt.run(item.quantity, item.id);
      }

      return { saleId, invoiceNumber };
    });

    const result = transaction();
    res.json(result);
  });

  app.get('/api/sales', authenticateToken, (req, res) => {
    const sales = db.prepare('SELECT * FROM sales ORDER BY date DESC').all();
    res.json(sales);
  });

  app.get('/api/sales/:id', authenticateToken, (req, res) => {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
    const items = db.prepare('SELECT * FROM sale_items WHERE saleId = ?').all(req.params.id);
    res.json({ ...sale as any, items });
  });

  // Analytics
  app.get('/api/analytics', authenticateToken, (req, res) => {
    // Top selling
    const topSelling = db.prepare(`
      SELECT medicineName, SUM(quantity) as totalQty 
      FROM sale_items 
      GROUP BY medicineName 
      ORDER BY totalQty DESC 
      LIMIT 10
    `).all();

    // Daily revenue (last 30 days)
    const dailyRevenue = db.prepare(`
      SELECT date(date) as day, SUM(totalAmount) as revenue
      FROM sales
      WHERE date >= date('now', '-30 days')
      GROUP BY day
      ORDER BY day ASC
    `).all();

    // Category distribution
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM medicines
      GROUP BY category
    `).all();

    res.json({ topSelling, dailyRevenue, categories });
  });

  // --- Vite / Frontend Setup ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
