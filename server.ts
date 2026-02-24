import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { Pool } from "pg";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Database abstraction
interface DB {
  prepare: (sql: string) => {
    all: (...args: any[]) => any[];
    get: (...args: any[]) => any;
    run: (...args: any[]) => { lastInsertRowid: number | bigint };
  };
  exec: (sql: string) => void;
  query: (sql: string, params?: any[]) => Promise<any>;
}

let db: any;
let isPostgres = false;

if (process.env.POSTGRES_URL) {
  isPostgres = true;
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  db = {
    query: async (text: string, params?: any[]) => {
      const res = await pool.query(text, params);
      return res;
    }
  };

  // Initialize Postgres Tables
  const initPostgres = async () => {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE,
          email TEXT UNIQUE,
          password TEXT,
          rating REAL DEFAULT 5.0,
          verified INTEGER DEFAULT 0,
          avatar TEXT
        );

        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          title TEXT,
          description TEXT,
          category TEXT,
          condition TEXT,
          estimated_value INTEGER,
          wishlist TEXT,
          location TEXT,
          image_url TEXT,
          status TEXT DEFAULT 'available',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS proposals (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER REFERENCES users(id),
          receiver_id INTEGER REFERENCES users(id),
          sender_item_ids TEXT,
          receiver_item_id INTEGER REFERENCES items(id),
          cash_topup INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          meeting_point_id INTEGER,
          meeting_time TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS locations (
          id SERIAL PRIMARY KEY,
          name TEXT,
          address TEXT,
          type TEXT,
          description TEXT,
          image_url TEXT
        );
      `);

      const locCheck = await db.query("SELECT COUNT(*) FROM locations");
      if (parseInt(locCheck.rows[0].count) === 0) {
        await db.query(`
          INSERT INTO locations (name, address, type, description) VALUES 
          ('Grand Indonesia Mall', 'Jl. M.H. Thamrin No.1, Jakarta', 'public', 'Titik temu ramai dan aman di pusat kota.'),
          ('Kopi Kenangan - SCBD', 'South Quarter, Jakarta', 'partner', 'Partner resmi. Dapatkan diskon 10% saat barter di sini.'),
          ('SBM Safe Zone - Menteng', 'Jl. Teuku Umar No.10, Jakarta', 'premium', 'Fasilitas premium dengan staff pengecekan barang dan CCTV 24 jam.')
        `);
      }
      console.log("Postgres tables initialized");
    } catch (err) {
      console.error("Error initializing Postgres:", err);
    }
  };
  initPostgres();
  console.log("Using Postgres (Supabase)");
} else {
  const sqlite = new Database("tukeran.db");
  db = {
    prepare: (sql: string) => {
      const stmt = sqlite.prepare(sql);
      return {
        all: (...args: any[]) => stmt.all(...args),
        get: (...args: any[]) => stmt.get(...args),
        run: (...args: any[]) => stmt.run(...args)
      };
    },
    exec: (sql: string) => sqlite.exec(sql),
    query: async (sql: string, params?: any[]) => {
      // Basic wrapper for compatibility
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        return { rows: sqlite.prepare(sql).all(...(params || [])) };
      } else {
        const res = sqlite.prepare(sql).run(...(params || []));
        return { rows: [], rowCount: res.changes, lastInsertId: res.lastInsertRowid };
      }
    }
  };
  
  // Initialize SQLite
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      rating REAL DEFAULT 5.0,
      verified INTEGER DEFAULT 0,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      category TEXT,
      condition TEXT,
      estimated_value INTEGER,
      wishlist TEXT,
      location TEXT,
      image_url TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      sender_item_ids TEXT,
      receiver_item_id INTEGER,
      cash_topup INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      meeting_point_id INTEGER,
      meeting_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sender_id) REFERENCES users(id),
      FOREIGN KEY(receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      address TEXT,
      type TEXT,
      description TEXT,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id INTEGER,
      sender_id INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(proposal_id) REFERENCES proposals(id)
    );
  `);

  const locationCount = db.prepare("SELECT COUNT(*) as count FROM locations").get() as { count: number };
  if (locationCount.count === 0) {
    const insertLoc = db.prepare("INSERT INTO locations (name, address, type, description) VALUES (?, ?, ?, ?)");
    insertLoc.run("Grand Indonesia Mall", "Jl. M.H. Thamrin No.1, Jakarta", "public", "Titik temu ramai dan aman di pusat kota.");
    insertLoc.run("Kopi Kenangan - SCBD", "South Quarter, Jakarta", "partner", "Partner resmi. Dapatkan diskon 10% saat barter di sini.");
    insertLoc.run("SBM Safe Zone - Menteng", "Jl. Teuku Umar No.10, Jakarta", "premium", "Fasilitas premium dengan staff pengecekan barang dan CCTV 24 jam.");
  }
  console.log("Using SQLite");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Helper to handle both DB types
  const queryAll = async (sql: string, params?: any[]) => {
    if (isPostgres) {
      const res = await db.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
      return res.rows;
    } else {
      return db.prepare(sql).all(...(params || []));
    }
  };

  const queryOne = async (sql: string, params?: any[]) => {
    if (isPostgres) {
      const res = await db.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
      return res.rows[0];
    } else {
      return db.prepare(sql).get(...(params || []));
    }
  };

  const runQuery = async (sql: string, params?: any[]) => {
    if (isPostgres) {
      const res = await db.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
      return { lastInsertId: res.rows[0]?.id };
    } else {
      const res = db.prepare(sql).run(...(params || []));
      return { lastInsertId: res.lastInsertRowid };
    }
  };

  // --- API Routes ---

  app.get("/api/items", async (req, res) => {
    const items = await queryAll(`
      SELECT items.*, users.username as owner_name, users.avatar as owner_avatar 
      FROM items 
      JOIN users ON items.user_id = users.id 
      WHERE items.status = 'available'
      ORDER BY items.created_at DESC
    `);
    res.json(items);
  });

  app.get("/api/items/:id", async (req, res) => {
    const item = await queryOne(`
      SELECT items.*, users.username as owner_name, users.avatar as owner_avatar, users.rating as owner_rating
      FROM items 
      JOIN users ON items.user_id = users.id 
      WHERE items.id = ?
    `, [req.params.id]);
    res.json(item);
  });

  app.post("/api/items", async (req, res) => {
    const { user_id, title, description, category, condition, estimated_value, wishlist, location, image_url } = req.body;
    const sql = isPostgres 
      ? `INSERT INTO items (user_id, title, description, category, condition, estimated_value, wishlist, location, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
      : `INSERT INTO items (user_id, title, description, category, condition, estimated_value, wishlist, location, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await runQuery(sql, [user_id, title, description, category, condition, estimated_value, wishlist, location, image_url]);
    res.json({ id: result.lastInsertId });
  });

  app.post("/api/proposals", async (req, res) => {
    const { sender_id, receiver_id, sender_item_ids, receiver_item_id, cash_topup } = req.body;
    const sql = isPostgres
      ? `INSERT INTO proposals (sender_id, receiver_id, sender_item_ids, receiver_item_id, cash_topup) VALUES (?, ?, ?, ?, ?) RETURNING id`
      : `INSERT INTO proposals (sender_id, receiver_id, sender_item_ids, receiver_item_id, cash_topup) VALUES (?, ?, ?, ?, ?)`;
    
    const result = await runQuery(sql, [sender_id, receiver_id, JSON.stringify(sender_item_ids), receiver_item_id, cash_topup]);
    res.json({ id: result.lastInsertId });
  });

  app.get("/api/proposals/user/:userId", async (req, res) => {
    const proposals = await queryAll(`
      SELECT p.*, 
             u1.username as sender_name, 
             u2.username as receiver_name,
             i.title as receiver_item_title
      FROM proposals p
      JOIN users u1 ON p.sender_id = u1.id
      JOIN users u2 ON p.receiver_id = u2.id
      JOIN items i ON p.receiver_item_id = i.id
      WHERE p.sender_id = ? OR p.receiver_id = ?
      ORDER BY p.created_at DESC
    `, [req.params.userId, req.params.userId]);
    res.json(proposals);
  });

  app.get("/api/locations", async (req, res) => {
    const locations = await queryAll("SELECT * FROM locations");
    res.json(locations);
  });

  app.post("/api/ai/valuation", async (req, res) => {
    const { item_name, condition, description } = req.body;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Berikan estimasi harga pasar (dalam Rupiah) untuk barang berikut di pasar barang bekas Indonesia:
        Nama Barang: ${item_name}
        Kondisi: ${condition}
        Deskripsi: ${description}
        
        Berikan jawaban dalam format JSON: { "min_price": number, "max_price": number, "reasoning": "string" }`,
        config: { responseMimeType: "application/json" }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("AI Valuation Error:", error);
      res.status(500).json({ error: "Gagal mendapatkan estimasi AI" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email } = req.body;
    let user = await queryOne("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      const username = email.split('@')[0];
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
      const sql = isPostgres
        ? `INSERT INTO users (username, email, avatar) VALUES (?, ?, ?) RETURNING id`
        : `INSERT INTO users (username, email, avatar) VALUES (?, ?, ?)`;
      
      const result = await runQuery(sql, [username, email, avatar]);
      user = await queryOne("SELECT * FROM users WHERE id = ?", [result.lastInsertId]);
    }
    res.json(user);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

