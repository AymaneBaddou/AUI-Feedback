require("dotenv").config();
const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const jwt = require("jsonwebtoken");
const db = require("./db"); // Import the database connection

const app = express();

app.use(cors());
app.use(express.json());

const allowedRatings = ["Very Satisfying", "Satisfying", "Neutral", "Unsatisfying", "Very Unsatisfying"];
const ratingWeights = { "Very Satisfying": 5, "Satisfying": 4, "Neutral": 3, "Unsatisfying": 2, "Very Unsatisfying": 1 };
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// --- MIDDLEWARE ---
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// --- ROUTES ---

app.get("/", (req, res) => res.send("Backend working with PostgreSQL 🐘"));

// 1. Admin Login (Microsoft)
const ALLOWED_ADMINS = ["a.baddou@aui.ma", "i.moukhlis@aui.ma", "a.dafir@aui.ma"];
app.post("/api/admin/microsoft-login", (req, res) => {
  const email = (req.body.email || "").toLowerCase();
  if (!ALLOWED_ADMINS.includes(email)) return res.status(401).json({ message: "Not authorized" });
  
  const token = jwt.sign({ role: "admin", email }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token });
});

// 2. Services
app.get("/api/services", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM services ORDER BY id ASC");
    // Convert 'active' to boolean just in case
    const formatted = rows.map(s => ({ ...s, active: !!s.active, id: Number(s.id) }));
    res.json(formatted);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/services/active", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM services WHERE active = true");
    const formatted = rows.map(s => ({ ...s, active: true, id: Number(s.id) }));
    res.json(formatted);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/services", authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Name required" });

  const id = Date.now(); // Generate ID exactly like your JSON file
  
  try {
    const { rows } = await db.query(
      "INSERT INTO services (id, name, active) VALUES ($1, $2, $3) RETURNING *",
      [id, name.trim(), false]
    );
    res.status(201).json({ ...rows[0], id: Number(rows[0].id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/services/:id", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      "UPDATE services SET name = $1 WHERE id = $2 RETURNING *",
      [req.body.name, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Service not found" });
    res.json({ ...rows[0], id: Number(rows[0].id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/services/:id/active", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      "UPDATE services SET active = $1 WHERE id = $2 RETURNING *",
      [req.body.active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Service not found" });
    res.json({ ...rows[0], id: Number(rows[0].id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/services/active/clear", authMiddleware, async (req, res) => {
  try {
    await db.query("UPDATE services SET active = false");
    res.json({ message: "All services deactivated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/services/:id", authMiddleware, async (req, res) => {
  try {
    // Delete related feedbacks first (Foreign Key constraint)
    await db.query("DELETE FROM feedbacks WHERE service_id = $1", [req.params.id]);
    const { rowCount } = await db.query("DELETE FROM services WHERE id = $1", [req.params.id]);
    
    if (rowCount === 0) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Service deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Feedback
app.post("/api/feedback", async (req, res) => {
  const { serviceId, rating, comment } = req.body;
  
  if (!allowedRatings.includes(rating)) return res.status(400).json({ message: "Invalid rating" });

  const id = Date.now(); // Generate ID manually
  const createdAt = new Date().toISOString(); // Generate Date manually

  try {
    await db.query(
      "INSERT INTO feedbacks (id, service_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
      [id, serviceId, rating, comment, createdAt]
    );
    res.status(201).json({ message: "Feedback saved" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/feedback", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM feedbacks ORDER BY created_at DESC");
    // Map 'service_id' back to 'serviceId' to match frontend expectation
    const formatted = rows.map(f => ({
      id: Number(f.id),
      serviceId: Number(f.service_id),
      rating: f.rating,
      comment: f.comment,
      createdAt: f.created_at
    }));
    res.json(formatted);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Stats & Export
app.get("/api/stats", authMiddleware, async (req, res) => {
  try {
    const services = (await db.query("SELECT * FROM services")).rows;
    const feedbacks = (await db.query("SELECT * FROM feedbacks")).rows;
    
    const stats = services.map(svc => {
      // Loose comparison (==) handles string vs int ID differences safely
      const related = feedbacks.filter(f => f.service_id == svc.id); 
      const count = related.length;
      let totalScore = 0;
      const distribution = { Excellent: 0, Good: 0, Neutral: 0, Satisfying: 0, Unsatisfying: 0 };
      
      related.forEach(f => {
        totalScore += ratingWeights[f.rating] || 0;
        if (distribution[f.rating] !== undefined) distribution[f.rating]++;
      });

      return { 
        id: Number(svc.id), 
        name: svc.name, 
        feedbackCount: count, 
        averageScore: count > 0 ? totalScore / count : null,
        ratingDistribution: distribution 
      };
    });

    res.json({ totalFeedbacks: feedbacks.length, services: stats });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/feedback/export", authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT s.name as "Service Name", f.rating as "Rating Given", 
             f.comment as "Comment", f.created_at as "Submission Date"
      FROM feedbacks f
      JOIN services s ON f.service_id = s.id
      ORDER BY f.created_at DESC
    `;
    const { rows } = await db.query(query);

    const exportData = rows.map(row => ({
      ...row,
      "Rating Value": ratingWeights[row["Rating Given"]] || 0,
      "Submission Date": new Date(row["Submission Date"]).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=feedback_export.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Start Server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => console.log(`🔥 PostgreSQL Backend running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
  } else {
    console.error('❌ Server error:', err);
  }
});