import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const db = new Database("tukeran.db");

// Initialize Database
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
    sender_item_ids TEXT, -- JSON array
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
    type TEXT, -- 'public', 'partner', 'premium'
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

// Seed locations if empty
const locationCount = db.prepare("SELECT COUNT(*) as count FROM locations").get() as { count: number };
if (locationCount.count === 0) {
  const insertLoc = db.prepare("INSERT INTO locations (name, address, type, description) VALUES (?, ?, ?, ?)");
  insertLoc.run("Grand Indonesia Mall", "Jl. M.H. Thamrin No.1, Jakarta", "public", "Titik temu ramai dan aman di pusat kota.");
  insertLoc.run("Kopi Kenangan - SCBD", "South Quarter, Jakarta", "partner", "Partner resmi. Dapatkan diskon 10% saat barter di sini.");
  insertLoc.run("SBM Safe Zone - Menteng", "Jl. Teuku Umar No.10, Jakarta", "premium", "Fasilitas premium dengan staff pengecekan barang dan CCTV 24 jam.");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Routes ---

  // Items
  app.get("/api/items", (req, res) => {
    const items = db.prepare(`
      SELECT items.*, users.username as owner_name, users.avatar as owner_avatar 
      FROM items 
      JOIN users ON items.user_id = users.id 
      WHERE items.status = 'available'
      ORDER BY items.created_at DESC
    `).all();
    res.json(items);
  });

  app.get("/api/items/:id", (req, res) => {
    const item = db.prepare(`
      SELECT items.*, users.username as owner_name, users.avatar as owner_avatar, users.rating as owner_rating
      FROM items 
      JOIN users ON items.user_id = users.id 
      WHERE items.id = ?
    `).get(req.params.id);
    res.json(item);
  });

  app.post("/api/items", (req, res) => {
    const { user_id, title, description, category, condition, estimated_value, wishlist, location, image_url } = req.body;
    const info = db.prepare(`
      INSERT INTO items (user_id, title, description, category, condition, estimated_value, wishlist, location, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, title, description, category, condition, estimated_value, wishlist, location, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  // Proposals
  app.post("/api/proposals", (req, res) => {
    const { sender_id, receiver_id, sender_item_ids, receiver_item_id, cash_topup } = req.body;
    const info = db.prepare(`
      INSERT INTO proposals (sender_id, receiver_id, sender_item_ids, receiver_item_id, cash_topup)
      VALUES (?, ?, ?, ?, ?)
    `).run(sender_id, receiver_id, JSON.stringify(sender_item_ids), receiver_item_id, cash_topup);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/proposals/user/:userId", (req, res) => {
    const proposals = db.prepare(`
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
    `).all(req.params.userId, req.params.userId);
    res.json(proposals);
  });

  // Locations
  app.get("/api/locations", (req, res) => {
    const locations = db.prepare("SELECT * FROM locations").all();
    res.json(locations);
  });

  // AI Valuation (Gemini)
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

  // Auth (Mock for demo)
  app.post("/api/auth/login", (req, res) => {
    const { email } = req.body;
    // Simple mock: find or create user
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      const username = email.split('@')[0];
      const info = db.prepare("INSERT INTO users (username, email, avatar) VALUES (?, ?, ?)").run(username, email, `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    }
    res.json(user);
  });

  // Vite integration
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
