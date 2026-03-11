import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'tukeran_secret_key_2026';

// Middleware for authentication
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Akses ditolak. Silakan login terlebih dahulu." });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ error: "Sesi tidak valid atau telah berakhir." });
    req.user = user;
    next();
  });
};

// Middleware for admin check
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: "Akses ditolak. Anda bukan admin." });
  }
};

// Lazy initialize Stripe
let stripeClient: any = null;
const getStripe = () => {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn('STRIPE_SECRET_KEY not set. Payment features will be simulated.');
      return null;
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    avatar TEXT,
    role TEXT DEFAULT 'user',
    is_premium INTEGER DEFAULT 0,
    premium_until DATETIME,
    language TEXT DEFAULT 'id',
    theme TEXT DEFAULT 'light',
    badges TEXT DEFAULT '[]', -- JSON array of strings
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_trusted INTEGER DEFAULT 0
  );
`);

// Migration: Add is_trusted column if it doesn't exist
try {
  db.prepare("SELECT is_trusted FROM users LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN is_trusted INTEGER DEFAULT 0");
}

// Migration: Add premium columns if they don't exist
try {
  db.prepare("SELECT is_premium FROM users LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0");
  db.exec("ALTER TABLE users ADD COLUMN premium_until DATETIME");
}

// Migration: Add role column if it doesn't exist
try {
  db.prepare("SELECT role FROM users LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
}

// Migration: Add language and theme columns if they don't exist
try {
  db.prepare("SELECT language FROM users LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'id'");
  db.exec("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'");
}

// Migration: Add badges and last_active columns if they don't exist
try {
  db.prepare("SELECT badges FROM users LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN badges TEXT DEFAULT '[]'");
  db.exec("ALTER TABLE users ADD COLUMN last_active DATETIME DEFAULT CURRENT_TIMESTAMP");
}

// Migration: Add wallet_balance to users if it doesn't exist
try {
  db.prepare("SELECT wallet_balance FROM users LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN wallet_balance INTEGER DEFAULT 0");
}

// Migration: Add created_at to users if it doesn't exist
try {
  db.prepare("SELECT created_at FROM users LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN created_at DATETIME");
  db.exec("UPDATE users SET created_at = CURRENT_TIMESTAMP");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS escrow_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT,
    account_number TEXT,
    account_holder TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS topup_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount INTEGER,
    escrow_account_id INTEGER,
    proof_image_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(escrow_account_id) REFERENCES escrow_accounts(id)
  );
`);

db.exec(`
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
    views_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add views_count column if it doesn't exist
try {
  db.prepare("SELECT views_count FROM items LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE items ADD COLUMN views_count INTEGER DEFAULT 0");
}

// Migration: Add created_at to items if it doesn't exist
try {
  db.prepare("SELECT created_at FROM items LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE items ADD COLUMN created_at DATETIME");
  db.exec("UPDATE items SET created_at = CURRENT_TIMESTAMP");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    item_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(item_id) REFERENCES items(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER,
    reporter_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'resolved', 'closed'
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(proposal_id) REFERENCES proposals(id),
    FOREIGN KEY(reporter_id) REFERENCES users(id)
  );
`);

db.exec(`
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
    shipping_method TEXT, -- 'GoSend', 'Grab', 'JNE', 'COD'
    shipping_address TEXT,
    escrow_status TEXT DEFAULT 'none', -- 'none', 'pending', 'held', 'released', 'refunded'
    escrow_amount INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );
`);

// Migration: Add shipping and escrow columns if they don't exist
try {
  db.prepare("SELECT shipping_method FROM proposals LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE proposals ADD COLUMN shipping_method TEXT");
  db.exec("ALTER TABLE proposals ADD COLUMN shipping_address TEXT");
  db.exec("ALTER TABLE proposals ADD COLUMN escrow_status TEXT DEFAULT 'none'");
  db.exec("ALTER TABLE proposals ADD COLUMN escrow_amount INTEGER DEFAULT 0");
}

// Migration: Add created_at to proposals if it doesn't exist
try {
  db.prepare("SELECT created_at FROM proposals LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE proposals ADD COLUMN created_at DATETIME");
  db.exec("UPDATE proposals SET created_at = CURRENT_TIMESTAMP");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS flash_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    discount_rate REAL,
    start_time DATETIME,
    end_time DATETIME,
    category_target TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    address TEXT,
    type TEXT,
    description TEXT,
    image_url TEXT,
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add lat/lng if they don't exist
try {
  db.prepare("SELECT latitude FROM locations LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE locations ADD COLUMN latitude REAL");
  db.exec("ALTER TABLE locations ADD COLUMN longitude REAL");
}

// Migration: Add created_at to locations if it doesn't exist
try {
  db.prepare("SELECT created_at FROM locations LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE locations ADD COLUMN created_at DATETIME");
  db.exec("UPDATE locations SET created_at = CURRENT_TIMESTAMP");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER,
    user2_id INTEGER,
    item_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id, item_id)
  );
`);

// Migration: Update messages table if it uses old schema
const tableInfo = db.prepare("PRAGMA table_info(messages)").all() as any[];
const hasConversationId = tableInfo.some(col => col.name === 'conversation_id');

if (tableInfo.length > 0 && !hasConversationId) {
  console.log("Migrating messages table: conversation_id missing. Recreating...");
  db.exec("DROP TABLE IF EXISTS messages");
  db.exec(`
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      sender_id INTEGER,
      content TEXT,
      image_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );
  `);
} else if (tableInfo.length === 0) {
  db.exec(`
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      sender_id INTEGER,
      content TEXT,
      image_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );
  `);
}

// Migration: Add image_url and is_read to messages if they don't exist
try {
  db.prepare("SELECT image_url FROM messages LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE messages ADD COLUMN image_url TEXT");
  db.exec("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS community_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    category TEXT, -- 'location', 'hobby'
    location TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    user_id INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id),
    FOREIGN KEY(group_id) REFERENCES community_groups(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS group_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    sender_id INTEGER,
    content TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES community_groups(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS matchmaker_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    suggested_item_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'dismissed', 'accepted'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(suggested_item_id) REFERENCES items(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    proposal_id INTEGER,
    amount INTEGER,
    currency TEXT DEFAULT 'IDR',
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    stripe_payment_intent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(proposal_id) REFERENCES proposals(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- 'proposal', 'message', 'verification', 'review'
    title TEXT,
    content TEXT,
    related_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add created_at to notifications if it doesn't exist
try {
  db.prepare("SELECT created_at FROM notifications LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE notifications ADD COLUMN created_at DATETIME");
  db.exec("UPDATE notifications SET created_at = CURRENT_TIMESTAMP");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER,
    reviewer_id INTEGER,
    reviewee_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(proposal_id) REFERENCES proposals(id),
    FOREIGN KEY(reviewer_id) REFERENCES users(id),
    FOREIGN KEY(reviewee_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS safe_zone_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER,
    user_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(location_id) REFERENCES locations(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS kyc_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    id_image_url TEXT,
    selfie_image_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed locations if empty
const locationCount = db.prepare("SELECT COUNT(*) as count FROM locations").get() as { count: number };
if (locationCount.count === 0) {
  const insertLoc = db.prepare("INSERT INTO locations (name, address, type, description, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)");
  insertLoc.run("Grand Indonesia Mall", "Jl. M.H. Thamrin No.1, Jakarta", "public", "Titik temu ramai dan aman di pusat kota.", -6.1951, 106.8231);
  insertLoc.run("Kopi Kenangan - SCBD", "South Quarter, Jakarta", "partner", "Partner resmi. Dapatkan diskon 10% saat barter di sini.", -6.2241, 106.8098);
  insertLoc.run("SBM Safe Zone - Menteng", "Jl. Teuku Umar No.10, Jakarta", "premium", "Fasilitas premium dengan staff pengecekan barang dan CCTV 24 jam.", -6.1894, 106.8324);
}

// Seed community groups if empty
const groupCount = db.prepare("SELECT COUNT(*) as count FROM community_groups").get() as { count: number };
if (groupCount.count === 0) {
  const insertGroup = db.prepare("INSERT INTO community_groups (name, description, category, location, image_url) VALUES (?, ?, ?, ?, ?)");
  insertGroup.run("Barter Jakarta Selatan", "Grup khusus warga Jaksel untuk tukar barang harian.", "location", "Jakarta Selatan", "https://picsum.photos/seed/jaksel/400/300");
  insertGroup.run("Komunitas Barter Kamera", "Tukar tambah lensa, bodi kamera, dan aksesoris fotografi.", "hobby", null, "https://picsum.photos/seed/camera/400/300");
  insertGroup.run("Hobi Tanaman Hias", "Tukar bibit, pot, dan koleksi tanaman hias kamu.", "hobby", null, "https://picsum.photos/seed/plants/400/300");
}

// Seed admin if not exists
try {
  const adminUser = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@tukeranyuk.com") as any;
  const hashedPassword = await bcrypt.hash("admin123", 10);
  if (!adminUser) {
    db.prepare("INSERT INTO users (username, email, password, avatar, role, verified) VALUES (?, ?, ?, ?, ?, ?)")
      .run("admin", "admin@tukeranyuk.com", hashedPassword, "https://api.dicebear.com/7.x/avataaars/svg?seed=admin", "admin", 1);
  } else if (adminUser.role !== 'admin' || !adminUser.password) {
    db.prepare("UPDATE users SET role = 'admin', verified = 1, password = ? WHERE email = ?").run(hashedPassword, "admin@tukeranyuk.com");
  }
} catch (e) {
  console.log("Admin seeding skipped or failed:", e);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User joined conversation: ${conversationId}`);
    });

    socket.on("send_message", (data) => {
      const { conversation_id, sender_id, content, image_url } = data;
      
      // Save to DB
      const info = db.prepare(`
        INSERT INTO messages (conversation_id, sender_id, content, image_url)
        VALUES (?, ?, ?, ?)
      `).run(conversation_id, sender_id, content, image_url);

      const newMessage = {
        id: info.lastInsertRowid,
        conversation_id,
        sender_id,
        content,
        image_url,
        is_read: 0,
        created_at: new Date().toISOString()
      };

      // Broadcast to room
      io.to(`conversation_${conversation_id}`).emit("new_message", newMessage);
    });

    socket.on("mark_as_read", (data) => {
      const { conversation_id, user_id } = data;
      db.prepare(`
        UPDATE messages 
        SET is_read = 1 
        WHERE conversation_id = ? AND sender_id != ?
      `).run(conversation_id, user_id);
      
      io.to(`conversation_${conversation_id}`).emit("messages_read", { conversation_id, user_id });
    });

    socket.on("typing", (data) => {
      const { conversation_id, user_id, username } = data;
      socket.to(`conversation_${conversation_id}`).emit("user_typing", { conversation_id, user_id, username });
    });

    socket.on("stop_typing", (data) => {
      const { conversation_id, user_id } = data;
      socket.to(`conversation_${conversation_id}`).emit("user_stop_typing", { conversation_id, user_id });
    });

    socket.on("join_group", (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`User joined group: ${groupId}`);
    });

    socket.on("send_group_message", (data) => {
      const { group_id, sender_id, content, image_url } = data;
      const info = db.prepare(`
        INSERT INTO group_messages (group_id, sender_id, content, image_url)
        VALUES (?, ?, ?, ?)
      `).run(group_id, sender_id, content, image_url);

      const newMessage = {
        id: info.lastInsertRowid,
        group_id,
        sender_id,
        content,
        image_url,
        created_at: new Date().toISOString()
      };

      io.to(`group_${group_id}`).emit("new_group_message", newMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // API Routes
  app.get("/api/items", (req, res) => {
    const { category, search, user_id, min_value, max_value, condition, lat, lng, radius } = req.query;
    let query = `
      SELECT i.*, u.username as owner_name, u.avatar as owner_avatar, u.rating as owner_rating, u.is_premium
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.status = 'available'
    `;
    const params: any[] = [];

    if (category) {
      query += " AND i.category = ?";
      params.push(category);
    }

    if (search) {
      query += " AND (i.title LIKE ? OR i.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (user_id) {
      query += " AND i.user_id = ?";
      params.push(user_id);
    }

    if (min_value) {
      query += " AND i.estimated_value >= ?";
      params.push(min_value);
    }

    if (max_value) {
      query += " AND i.estimated_value <= ?";
      params.push(max_value);
    }

    if (condition) {
      query += " AND i.condition = ?";
      params.push(condition);
    }

    // Premium users get priority listing
    query += " ORDER BY u.is_premium DESC, i.created_at DESC";

    let items = db.prepare(query).all(...params) as any[];

    // Geolocation filter (simulated)
    if (lat && lng && radius) {
      // In a real app, we'd use Haversine formula in SQL or a spatial extension
      // For this demo, we'll just return all items but could sort by distance if coordinates were in DB
    }

    res.json(items);
  });

  app.get("/api/items/:id", (req, res) => {
    // Increment views
    db.prepare("UPDATE items SET views_count = views_count + 1 WHERE id = ?").run(req.params.id);
    
    const item = db.prepare(`
      SELECT items.*, users.username as owner_name, users.avatar as owner_avatar, users.rating as owner_rating
      FROM items 
      JOIN users ON items.user_id = users.id 
      WHERE items.id = ?
    `).get(req.params.id);
    res.json(item);
  });

  app.get("/api/items/:id/analytics", (req, res) => {
    const item = db.prepare("SELECT views_count FROM items WHERE id = ?").get(req.params.id) as any;
    const wishlistCount = db.prepare("SELECT COUNT(*) as count FROM wishlists WHERE item_id = ?").get(req.params.id) as any;
    res.json({
      views: item?.views_count || 0,
      wishlists: wishlistCount?.count || 0
    });
  });

  app.post("/api/items", (req, res) => {
    const { user_id, title, description, category, condition, estimated_value, wishlist, location, image_url } = req.body;
    const info = db.prepare(`
      INSERT INTO items (user_id, title, description, category, condition, estimated_value, wishlist, location, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, title, description, category, condition, estimated_value, wishlist, location, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/proposals", (req, res) => {
    const { 
      sender_id, receiver_id, sender_item_ids, receiver_item_id, 
      cash_topup, meeting_point_id, meeting_time,
      shipping_method, shipping_address, escrow_amount
    } = req.body;
    
    const escrow_status = (cash_topup > 0 || escrow_amount > 0) ? 'pending' : 'none';

    const info = db.prepare(`
      INSERT INTO proposals (
        sender_id, receiver_id, sender_item_ids, receiver_item_id, 
        cash_topup, meeting_point_id, meeting_time,
        shipping_method, shipping_address, escrow_status, escrow_amount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sender_id, receiver_id, JSON.stringify(sender_item_ids), receiver_item_id, 
      cash_topup, meeting_point_id, meeting_time,
      shipping_method, shipping_address, escrow_status, escrow_amount || cash_topup
    );
    
    // Notify receiver
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, 'proposal', 'Tawaran Barter Baru', 'Seseorang tertarik menukar barang dengan milikmu!', ?)
    `).run(receiver_id, info.lastInsertRowid);

    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/proposals/:id/escrow", (req, res) => {
    const { status } = req.body; // 'held', 'released', 'refunded'
    db.prepare("UPDATE proposals SET escrow_status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/proposals/:id/status", (req, res) => {
    const { status } = req.body;
    const proposal = db.prepare("SELECT * FROM proposals WHERE id = ?").get(req.params.id) as any;
    
    if (!proposal) return res.status(404).json({ error: "Proposal tidak ditemukan" });

    const oldStatus = proposal.status;
    db.prepare("UPDATE proposals SET status = ? WHERE id = ?").run(status, req.params.id);

    // If accepted, update items status
    if (status === 'accepted') {
      const senderItemIds = JSON.parse(proposal.sender_item_ids);
      db.prepare("UPDATE items SET status = 'traded' WHERE id = ?").run(proposal.receiver_item_id);
      senderItemIds.forEach((id: number) => {
        db.prepare("UPDATE items SET status = 'traded' WHERE id = ?").run(id);
      });
      
      // If escrow was held, release it to receiver
      if (proposal.escrow_status === 'held') {
        db.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(proposal.escrow_amount, proposal.receiver_id);
        db.prepare("UPDATE proposals SET escrow_status = 'released' WHERE id = ?").run(req.params.id);
      }
    }

    // Automatic Refund if rejected/cancelled and escrow was held
    if ((status === 'rejected' || status === 'cancelled') && proposal.escrow_status === 'held') {
      db.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(proposal.escrow_amount, proposal.sender_id);
      db.prepare("UPDATE proposals SET escrow_status = 'refunded' WHERE id = ?").run(req.params.id);
      
      // Notify sender about refund
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content, related_id)
        VALUES (?, 'payment', 'Refund Escrow Berhasil', 'Saldo escrow sebesar Rp${proposal.escrow_amount.toLocaleString()} telah dikembalikan ke dompet kamu.', ?)
      `).run(proposal.sender_id, proposal.id);
    }

    // Notify sender
    const statusText = status === 'accepted' ? 'disetujui' : (status === 'rejected' ? 'ditolak' : 'dibatalkan');
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, 'proposal', 'Update Barter', 'Tawaran barter kamu telah ${statusText}!', ?)
    `).run(proposal.sender_id, proposal.id);

    res.json({ success: true });
  });

  app.get("/api/notifications/:userId", (req, res) => {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.userId);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/proposals/:id/checkout", authenticateToken, (req, res) => {
    const proposalId = req.params.id;
    const userId = (req as any).user.id;

    const proposal = db.prepare("SELECT * FROM proposals WHERE id = ?").get(proposalId) as any;
    if (!proposal) return res.status(404).json({ error: "Proposal tidak ditemukan" });
    if (proposal.sender_id !== userId) return res.status(403).json({ error: "Hanya pengirim tawaran yang bisa membayar escrow" });
    if (proposal.escrow_status !== 'pending') return res.status(400).json({ error: "Status escrow tidak valid untuk pembayaran" });

    const amount = proposal.escrow_amount;
    
    // Use a transaction for atomic balance check and deduction
    const transaction = db.transaction(() => {
      const user = db.prepare("SELECT wallet_balance FROM users WHERE id = ?").get(userId) as any;
      if (user.wallet_balance < amount) {
        throw new Error("Saldo tidak mencukupi");
      }

      // Deduct balance
      db.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").run(amount, userId);
      
      // Update proposal status
      db.prepare("UPDATE proposals SET escrow_status = 'held' WHERE id = ?").run(proposalId);
      
      return { success: true, new_balance: user.wallet_balance - amount };
    });

    try {
      const result = transaction();
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/reviews", (req, res) => {
    const { proposal_id, reviewer_id, reviewee_id, rating, comment } = req.body;
    db.prepare(`
      INSERT INTO reviews (proposal_id, reviewer_id, reviewee_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(proposal_id, reviewer_id, reviewee_id, rating, comment);

    // Update user rating
    const avgRating = db.prepare("SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE reviewee_id = ?").get(reviewee_id) as any;
    
    // Check for Trusted Seller status
    // Criteria: At least 5 successful transactions (accepted proposals) and rating >= 4.5
    const successCount = db.prepare("SELECT COUNT(*) as count FROM proposals WHERE (sender_id = ? OR receiver_id = ?) AND status = 'accepted'").get(reviewee_id, reviewee_id) as any;
    
    const isTrusted = (successCount.count >= 5 && avgRating.avg >= 4.5) ? 1 : 0;

    db.prepare("UPDATE users SET rating = ?, is_trusted = ? WHERE id = ?").run(avgRating.avg, isTrusted, reviewee_id);

    res.json({ success: true });
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

  app.get("/api/locations", (req, res) => {
    const { user_id } = req.query;
    let user: any = null;
    if (user_id) {
      user = db.prepare("SELECT is_premium FROM users WHERE id = ?").get(user_id);
    }

    const locations = db.prepare("SELECT * FROM locations").all() as any[];
    
    // Filter premium locations if user is not premium
    const filteredLocations = locations.filter(loc => {
      if (loc.type === 'premium' && (!user || !user.is_premium)) {
        return false;
      }
      return true;
    });

    res.json(filteredLocations);
  });

  app.get("/api/locations/:id/reviews", (req, res) => {
    const reviews = db.prepare(`
      SELECT szr.*, u.username, u.avatar
      FROM safe_zone_reviews szr
      JOIN users u ON szr.user_id = u.id
      WHERE szr.location_id = ?
      ORDER BY szr.created_at DESC
    `).all(req.params.id);
    res.json(reviews);
  });

  app.post("/api/locations/:id/reviews", (req, res) => {
    const { user_id, rating, comment } = req.body;
    db.prepare(`
      INSERT INTO safe_zone_reviews (location_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, user_id, rating, comment);
    res.json({ success: true });
  });

  // Wishlist Endpoints
  app.get("/api/wishlist/:userId", (req, res) => {
    const items = db.prepare(`
      SELECT i.*, u.username as owner_name
      FROM wishlists w
      JOIN items i ON w.item_id = i.id
      JOIN users u ON i.user_id = u.id
      WHERE w.user_id = ?
    `).all(req.params.userId);
    res.json(items);
  });

  app.post("/api/wishlist", (req, res) => {
    const { user_id, item_id } = req.body;
    try {
      db.prepare("INSERT INTO wishlists (user_id, item_id) VALUES (?, ?)").run(user_id, item_id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Item already in wishlist" });
    }
  });

  app.delete("/api/wishlist", (req, res) => {
    const { user_id, item_id } = req.body;
    db.prepare("DELETE FROM wishlists WHERE user_id = ? AND item_id = ?").run(user_id, item_id);
    res.json({ success: true });
  });

  // Premium Endpoints
  app.post("/api/users/:id/premium", (req, res) => {
    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + 1); // 1 month premium
    db.prepare("UPDATE users SET is_premium = 1, premium_until = ? WHERE id = ?").run(premiumUntil.toISOString(), req.params.id);
    res.json({ success: true, premium_until: premiumUntil.toISOString() });
  });

  // Dispute Endpoints
  app.post("/api/disputes", (req, res) => {
    const { proposal_id, reporter_id, reason } = req.body;
    db.prepare("INSERT INTO disputes (proposal_id, reporter_id, reason) VALUES (?, ?, ?)").run(proposal_id, reporter_id, reason);
    res.json({ success: true });
  });

  app.get("/api/flash-events/active", (req, res) => {
    const now = new Date().toISOString();
    const events = db.prepare(`
      SELECT * FROM flash_events 
      WHERE start_time <= ? AND end_time >= ?
    `).all(now, now);
    res.json(events);
  });

  app.patch("/api/users/:id/preferences", (req, res) => {
    const { language, theme } = req.body;
    if (language) db.prepare("UPDATE users SET language = ? WHERE id = ?").run(language, req.params.id);
    if (theme) db.prepare("UPDATE users SET theme = ? WHERE id = ?").run(theme, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/disputes", (req, res) => {
    const disputes = db.prepare(`
      SELECT d.*, u.username as reporter_name, p.status as proposal_status
      FROM disputes d
      JOIN users u ON d.reporter_id = u.id
      JOIN proposals p ON d.proposal_id = p.id
      ORDER BY d.created_at DESC
    `).all();
    res.json(disputes);
  });

  app.patch("/api/admin/disputes/:id/resolve", (req, res) => {
    db.prepare("UPDATE disputes SET status = 'resolved' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Social Feed: Recent Successful Barters
  app.get("/api/social/recent-trades", (req, res) => {
    const trades = db.prepare(`
      SELECT p.id, p.created_at, i.title as item_title, u1.username as sender, u2.username as receiver
      FROM proposals p
      JOIN items i ON p.receiver_item_id = i.id
      JOIN users u1 ON p.sender_id = u1.id
      JOIN users u2 ON p.receiver_id = u2.id
      WHERE p.status = 'accepted'
      ORDER BY p.created_at DESC
      LIMIT 5
    `).all();
    
    // Anonymize names for privacy
    const anonymizedTrades = trades.map((t: any) => ({
      ...t,
      sender: t.sender[0] + "***",
      receiver: t.receiver[0] + "***"
    }));
    
    res.json(anonymizedTrades);
  });

  app.post("/api/kyc/request", (req, res) => {
    const { user_id, id_image_url, selfie_image_url } = req.body;
    db.prepare(`
      INSERT INTO kyc_requests (user_id, id_image_url, selfie_image_url)
      VALUES (?, ?, ?)
    `).run(user_id, id_image_url, selfie_image_url);
    res.json({ success: true });
  });

  app.get("/api/admin/kyc", authenticateToken, isAdmin, (req, res) => {
    const requests = db.prepare(`
      SELECT k.*, u.username, u.email
      FROM kyc_requests k
      JOIN users u ON k.user_id = u.id
      ORDER BY k.created_at DESC
    `).all();
    res.json(requests);
  });

  app.patch("/api/admin/kyc/:id/status", authenticateToken, isAdmin, (req, res) => {
    const { status, admin_notes } = req.body;
    const request = db.prepare("SELECT * FROM kyc_requests WHERE id = ?").get(req.params.id) as any;
    
    if (!request) return res.status(404).json({ error: "Permintaan tidak ditemukan" });

    db.prepare(`
      UPDATE kyc_requests 
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, admin_notes, req.params.id);

    if (status === 'approved') {
      db.prepare("UPDATE users SET verified = 1 WHERE id = ?").run(request.user_id);
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (?, 'verification', 'Verifikasi Berhasil', 'Akun kamu sekarang telah terverifikasi!')
      `).run(request.user_id);
    } else if (status === 'rejected') {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (?, 'verification', 'Verifikasi Ditolak', 'Maaf, permintaan verifikasi kamu ditolak. Alasan: ${admin_notes}')
      `).run(request.user_id);
    }

    res.json({ success: true });
  });

  app.post("/api/admin/kyc/:id/auto-check", authenticateToken, isAdmin, async (req, res) => {
    const request = db.prepare("SELECT * FROM kyc_requests WHERE id = ?").get(req.params.id) as any;
    if (!request) return res.status(404).json({ error: "Request not found" });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const idImagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: request.id_image_url.split(',')[1],
        },
      };
      const selfiePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: request.selfie_image_url.split(',')[1],
        },
      };

      const prompt = "Analyze these two images: one is a government ID (KTP) and the other is a selfie. Check if the person in the selfie matches the person on the ID. Also check if the ID looks authentic. Return a JSON with 'match_score' (0-100), 'is_authentic' (boolean), and 'reason' (string).";
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: { parts: [idImagePart, selfiePart, { text: prompt }] },
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text);
      res.json(result);
    } catch (e: any) {
      console.error("AI KYC Error:", e);
      res.status(500).json({ error: "Gagal melakukan pengecekan AI", message: e.message });
    }
  });

  // Admin Analytics
  app.get("/api/admin/analytics", (req, res) => {
    // Transaction trends (last 7 days)
    const transactionTrends = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM proposals
      WHERE created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
    `).all();

    // User growth (last 7 days)
    const userGrowth = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
    `).all();

    // Popular categories
    const popularCategories = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM items
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    `).all();

    res.json({
      transactionTrends,
      userGrowth,
      popularCategories
    });
  });

  app.post("/api/admin/locations", (req, res) => {
    const { name, address, type, description, latitude, longitude, image_url } = req.body;
    const info = db.prepare(`
      INSERT INTO locations (name, address, type, description, latitude, longitude, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, address, type, description, latitude, longitude, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/admin/locations/:id", (req, res) => {
    const { name, address, type, description, latitude, longitude, image_url } = req.body;
    db.prepare(`
      UPDATE locations 
      SET name = ?, address = ?, type = ?, description = ?, latitude = ?, longitude = ?, image_url = ?
      WHERE id = ?
    `).run(name, address, type, description, latitude, longitude, image_url, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/locations/:id", (req, res) => {
    db.prepare("DELETE FROM locations WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/reviews", (req, res) => {
    const reviews = db.prepare(`
      SELECT r.*, u.username, l.name as location_name
      FROM safe_zone_reviews r
      JOIN users u ON r.user_id = u.id
      JOIN locations l ON r.location_id = l.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(reviews);
  });

  app.delete("/api/admin/reviews/:id", (req, res) => {
    db.prepare("DELETE FROM safe_zone_reviews WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (!user) {
        return res.status(401).json({ error: "Email atau password salah" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Email atau password salah" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (e) {
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)")
        .run(username, email, hashedPassword, `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`);
      
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid) as any;
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (e) {
      res.status(400).json({ error: "Username atau email sudah digunakan" });
    }
  });

  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users ORDER BY id DESC").all();
    res.json(users);
  });

  app.get("/api/admin/stats", (req, res) => {
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    const itemCount = db.prepare("SELECT COUNT(*) as count FROM items").get() as any;
    const proposalCount = db.prepare("SELECT COUNT(*) as count FROM proposals").get() as any;
    const verifiedCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE verified = 1").get() as any;

    res.json({
      totalUsers: userCount.count,
      totalItems: itemCount.count,
      totalProposals: proposalCount.count,
      verifiedUsers: verifiedCount.count,
      pendingVerifications: 5, // Placeholder
      successfulTrades: 120 // Placeholder
    });
  });

  app.get("/api/admin/activities", (req, res) => {
    // Mock recent activities for now
    const activities = [
      { id: 1, user: 'Budi', action: 'mendaftarkan barang baru', time: '2 menit yang lalu' },
      { id: 2, user: 'Siti', action: 'mengajukan barter', time: '15 menit yang lalu' },
      { id: 3, user: 'Andi', action: 'berhasil melakukan barter', time: '1 jam yang lalu' },
      { id: 4, user: 'Dewi', action: 'mendaftar akun baru', time: '3 jam yang lalu' },
      { id: 5, user: 'Eko', action: 'memperbarui profil', time: '5 jam yang lalu' },
    ];
    res.json(activities);
  });

  // Community Groups
  app.get("/api/community/groups", (req, res) => {
    const groups = db.prepare("SELECT * FROM community_groups").all();
    res.json(groups);
  });

  app.get("/api/community/groups/:id", (req, res) => {
    const group = db.prepare("SELECT * FROM community_groups WHERE id = ?").get(req.params.id);
    res.json(group);
  });

  app.get("/api/community/groups/:id/messages", (req, res) => {
    const messages = db.prepare(`
      SELECT gm.*, u.username as sender_name, u.avatar as sender_avatar
      FROM group_messages gm
      JOIN users u ON gm.sender_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.created_at ASC
    `).all(req.params.id);
    res.json(messages);
  });

  app.post("/api/community/groups/:id/join", (req, res) => {
    const { user_id } = req.body;
    try {
      db.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").run(req.params.id, user_id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Already a member" });
    }
  });

  app.get("/api/community/user/:userId/groups", (req, res) => {
    const groups = db.prepare(`
      SELECT cg.*
      FROM community_groups cg
      JOIN group_members gm ON cg.id = gm.group_id
      WHERE gm.user_id = ?
    `).all(req.params.userId);
    res.json(groups);
  });

  // Gamification & Badges
  app.get("/api/users/:id/badges", (req, res) => {
    const user = db.prepare("SELECT badges FROM users WHERE id = ?").get(req.params.id) as any;
    res.json(JSON.parse(user?.badges || '[]'));
  });

  app.post("/api/users/:id/update-badges", (req, res) => {
    const userId = req.params.id;
    // Simple logic for badges
    const proposalCount = db.prepare("SELECT COUNT(*) as count FROM proposals WHERE sender_id = ? OR receiver_id = ?").get(userId, userId) as any;
    const successCount = db.prepare("SELECT COUNT(*) as count FROM proposals WHERE (sender_id = ? OR receiver_id = ?) AND status = 'accepted'").get(userId, userId) as any;
    
    const badges = [];
    if (proposalCount.count >= 5) badges.push('Fast Responder');
    if (successCount.count >= 3) badges.push('Trusted Trader');
    if (successCount.count >= 10) badges.push('Top Barterer');

    db.prepare("UPDATE users SET badges = ? WHERE id = ?").run(JSON.stringify(badges), userId);
    res.json({ success: true, badges });
  });

  // Notifications
  app.get("/api/notifications/:userId", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.params.userId);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Top-up Requests
  app.post("/api/topups", (req, res) => {
    const { user_id, amount, escrow_account_id, proof_image_url } = req.body;
    try {
      db.prepare(`
        INSERT INTO topup_requests (user_id, amount, escrow_account_id, proof_image_url)
        VALUES (?, ?, ?, ?)
      `).run(user_id, amount, escrow_account_id, proof_image_url);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Gagal mengajukan top-up" });
    }
  });

  app.get("/api/admin/topups", authenticateToken, isAdmin, (req, res) => {
    const requests = db.prepare(`
      SELECT tr.*, u.username, u.email, ea.bank_name, ea.account_number
      FROM topup_requests tr
      JOIN users u ON tr.user_id = u.id
      JOIN escrow_accounts ea ON tr.escrow_account_id = ea.id
      ORDER BY tr.created_at DESC
    `).all();
    res.json(requests);
  });

  app.patch("/api/admin/topups/:id/status", authenticateToken, isAdmin, (req, res) => {
    const { status, admin_notes } = req.body;
    const request = db.prepare("SELECT * FROM topup_requests WHERE id = ?").get(req.params.id) as any;
    
    if (!request) return res.status(404).json({ error: "Request not found" });

    db.prepare("UPDATE topup_requests SET status = ?, admin_notes = ? WHERE id = ?").run(status, admin_notes, req.params.id);

    if (status === 'approved') {
      db.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(request.amount, request.user_id);
      
      // Notify user
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (?, 'payment', 'Top-up Berhasil', ?)
      `).run(request.user_id, `Top-up saldo sebesar Rp ${request.amount.toLocaleString()} telah disetujui.`);
    } else if (status === 'rejected') {
      // Notify user
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (?, 'payment', 'Top-up Ditolak', ?)
      `).run(request.user_id, `Top-up saldo sebesar Rp ${request.amount.toLocaleString()} ditolak. Alasan: ${admin_notes}`);
    }

    res.json({ success: true });
  });

  // Escrow Accounts Management
  app.get("/api/admin/escrow-accounts", authenticateToken, isAdmin, (req, res) => {
    const accounts = db.prepare("SELECT * FROM escrow_accounts ORDER BY created_at DESC").all();
    res.json(accounts);
  });

  app.post("/api/admin/escrow-accounts", authenticateToken, isAdmin, (req, res) => {
    const { bank_name, account_number, account_holder } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO escrow_accounts (bank_name, account_number, account_holder)
        VALUES (?, ?, ?)
      `).run(bank_name, account_number, account_holder);
      const newAccount = db.prepare("SELECT * FROM escrow_accounts WHERE id = ?").get(info.lastInsertRowid);
      res.json(newAccount);
    } catch (e) {
      res.status(500).json({ error: "Gagal menambah rekening escrow" });
    }
  });

  app.put("/api/admin/escrow-accounts/:id", (req, res) => {
    const { bank_name, account_number, account_holder, is_active } = req.body;
    try {
      db.prepare(`
        UPDATE escrow_accounts 
        SET bank_name = ?, account_number = ?, account_holder = ?, is_active = ?
        WHERE id = ?
      `).run(bank_name, account_number, account_holder, is_active ? 1 : 0, req.params.id);
      const updatedAccount = db.prepare("SELECT * FROM escrow_accounts WHERE id = ?").get(req.params.id);
      res.json(updatedAccount);
    } catch (e) {
      res.status(500).json({ error: "Gagal memperbarui rekening escrow" });
    }
  });

  app.delete("/api/admin/escrow-accounts/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM escrow_accounts WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Gagal menghapus rekening escrow" });
    }
  });

  // Matchmaker Suggestions
  app.get("/api/matchmaker/:userId", (req, res) => {
    const suggestions = db.prepare(`
      SELECT ms.*, i.title as item_title, i.image_url as item_image, i.estimated_value
      FROM matchmaker_suggestions ms
      JOIN items i ON ms.suggested_item_id = i.id
      WHERE ms.user_id = ? AND ms.status = 'new'
      ORDER BY ms.created_at DESC
    `).all(req.params.userId);
    res.json(suggestions);
  });

  // Data Export
  app.get("/api/users/:id/export", (req, res) => {
    const userId = req.params.id;
    const history = db.prepare(`
      SELECT p.id, p.created_at, p.status, p.cash_topup, 
             i.title as item_title, u.username as partner_name
      FROM proposals p
      JOIN items i ON p.receiver_item_id = i.id
      JOIN users u ON (p.sender_id = u.id OR p.receiver_id = u.id) AND u.id != ?
      WHERE p.sender_id = ? OR p.receiver_id = ?
      ORDER BY p.created_at DESC
    `).all(userId, userId, userId);

    // Generate CSV
    let csv = "ID,Date,Status,Partner,Item,Cash Topup\n";
    history.forEach((h: any) => {
      csv += `${h.id},${h.created_at},${h.status},${h.partner_name},${h.item_title},${h.cash_topup}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=barter_history_${userId}.csv`);
    res.send(csv);
  });

  // Stripe Payments
  app.post("/api/payments/create-intent", async (req, res) => {
    const { amount, user_id } = req.body;
    const stripe = getStripe();

    if (!stripe) {
      // Simulate success if no key
      const mockIntentId = `pi_mock_${Date.now()}`;
      db.prepare("INSERT INTO payments (user_id, amount, stripe_payment_intent_id) VALUES (?, ?, ?)").run(user_id, amount, mockIntentId);
      return res.json({ clientSecret: 'mock_secret', simulated: true });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe expects cents
        currency: 'idr',
        metadata: { user_id: user_id.toString() }
      });

      db.prepare("INSERT INTO payments (user_id, amount, stripe_payment_intent_id) VALUES (?, ?, ?)").run(user_id, amount, paymentIntent.id);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/payments/confirm", (req, res) => {
    const { payment_intent_id, user_id } = req.body;
    const payment = db.prepare("SELECT * FROM payments WHERE stripe_payment_intent_id = ?").get(payment_intent_id) as any;
    
    if (payment) {
      db.prepare("UPDATE payments SET status = 'completed' WHERE id = ?").run(payment.id);
      db.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(payment.amount, user_id);
      res.json({ success: true, new_balance: (db.prepare("SELECT wallet_balance FROM users WHERE id = ?").get(user_id) as any).wallet_balance });
    } else {
      res.status(404).json({ error: "Payment not found" });
    }
  });

  app.get("/api/conversations/user/:userId", (req, res) => {
    const userId = req.params.userId;
    const conversations = db.prepare(`
      SELECT c.*, 
             u1.username as user1_name, u1.avatar as user1_avatar,
             u2.username as user2_name, u2.avatar as user2_avatar,
             i.title as item_title, i.image_url as item_image
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN items i ON c.item_id = i.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.created_at DESC
    `).all(userId, userId);
    res.json(conversations);
  });

  app.post("/api/conversations", (req, res) => {
    const { user1_id, user2_id, item_id } = req.body;
    try {
      // Check if exists
      let conv = db.prepare(`
        SELECT * FROM conversations 
        WHERE (user1_id = ? AND user2_id = ? AND item_id = ?)
           OR (user1_id = ? AND user2_id = ? AND item_id = ?)
      `).get(user1_id, user2_id, item_id, user2_id, user1_id, item_id);

      if (!conv) {
        const info = db.prepare(`
          INSERT INTO conversations (user1_id, user2_id, item_id)
          VALUES (?, ?, ?)
        `).run(user1_id, user2_id, item_id);
        conv = db.prepare("SELECT * FROM conversations WHERE id = ?").get(info.lastInsertRowid);
      }
      res.json(conv);
    } catch (e) {
      res.status(500).json({ error: "Gagal membuat percakapan" });
    }
  });

  app.get("/api/messages/:conversationId", (req, res) => {
    try {
      const messages = db.prepare(`
        SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
      `).all(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Gagal mengambil pesan" });
    }
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
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
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
