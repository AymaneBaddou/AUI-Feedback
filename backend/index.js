require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

// ---------- File database setup ----------

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const feedbacksFile = path.join(dataDir, "feedbacks.json");
const servicesFile = path.join(dataDir, "services.json"); // renamed

function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
  }
}

ensureFile(feedbacksFile, []);
ensureFile(servicesFile, []);

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw ? JSON.parse(raw) : [];
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

const allowedRatings = ["Excellent", "Good", "Neutral", "Satisfying", "Unsatisfying"];

const ratingWeights = {
  Excellent: 5,
  Good: 4,
  Neutral: 3,
  Satisfying: 2,
  Unsatisfying: 1,
};

// ---------- Auth middleware ----------

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ---------- Admin login (email/password, optional) ----------

const HARDCODED_ADMIN = {
  email: process.env.ADMIN_EMAIL || "admin@aui.ma",
  password: process.env.ADMIN_PASSWORD || "password123",
};

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (
    email !== HARDCODED_ADMIN.email ||
    password !== HARDCODED_ADMIN.password
  ) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { role: "admin", email },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token });
});

// ---------- Admin login with Microsoft 365 ----------
// Called from React after MSAL loginPopup succeeds

const ALLOWED_ADMIN_EMAILS = [
  "a.baddou@aui.ma".toLowerCase(),// put your real admin email(s) here
  "i.moukhlis@aui.ma".toLowerCase(),
  "a.dafir@aui.ma".toLowerCase(),
  // add more if needed
];

app.post("/api/admin/microsoft-login", (req, res) => {
  const { email } = req.body;
  const normalized = (email || "").toLowerCase();

  if (!ALLOWED_ADMIN_EMAILS.includes(normalized)) {
    return res.status(401).json({ message: "Not authorized as admin" });
  }

  const token = jwt.sign(
    { role: "admin", email: normalized },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token });
});

// ---------- ROUTES ----------

// Health check
app.get("/", (req, res) => {
  res.send("Backend working with SERVICES API");
});

// ---- Admin Login ----

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ role: "admin", email }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    return res.json({ token });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// ---- SERVICES CRUD ----

// GET all services
app.get("/api/services", (req, res) => {
  res.json(readJson(servicesFile));
});

// GET active service(s)
app.get("/api/services/active", (req, res) => {
  const services = readJson(servicesFile);
  res.json(services.filter((s) => s.active));
});

// CREATE service
app.post("/api/services", authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Name required" });

  const services = readJson(servicesFile);

  const newService = {
    id: Date.now(),
    name: name.trim(),
    active: false,
  };

  services.push(newService);
  writeJson(servicesFile, services);

  res.status(201).json(newService);
});

// UPDATE service
app.put("/api/services/:id", authMiddleware, (req, res) => {
  const { name } = req.body;
  const id = Number(req.params.id);

  if (!name?.trim()) return res.status(400).json({ message: "Name required" });

  const services = readJson(servicesFile);
  const index = services.findIndex((s) => s.id === id);

  if (index === -1)
    return res.status(404).json({ message: "Service not found" });

  services[index].name = name.trim();
  writeJson(servicesFile, services);

  res.json(services[index]);
});

// SET active service
app.put("/api/services/:id/active", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const { active } = req.body;

  let services = readJson(servicesFile);

  const index = services.findIndex((s) => s.id === id);
  if (index === -1)
    return res.status(404).json({ message: "Service not found" });

  services[index].active = !!active; // toggle true/false only this service

  writeJson(servicesFile, services);

  res.json(services[index]);
});

// CLEAR all active services
app.put("/api/services/active/clear", authMiddleware, (req, res) => {
  const services = readJson(servicesFile);
  const updated = services.map((s) => ({ ...s, active: false }));

  writeJson(servicesFile, updated);
  res.json({ message: "All services deactivated" });
});

// DELETE a service
app.delete("/api/services/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);

  let services = readJson(servicesFile);

  if (!services.some((s) => s.id === id)) {
    return res.status(404).json({ message: "Service not found" });
  }

  services = services.filter((s) => s.id !== id);
  writeJson(servicesFile, services);

  res.json({ message: "Service deleted" });
});

// ---- FEEDBACK ----

// Submit feedback
app.post("/api/feedback", (req, res) => {
  const { serviceId, rating, comment } = req.body;

  if (!serviceId || !rating)
    return res.status(400).json({ message: "serviceId and rating required" });

  const services = readJson(servicesFile);

  if (!services.some((s) => s.id === Number(serviceId)))
    return res.status(400).json({ message: "Unknown service" });

  if (!allowedRatings.includes(rating))
    return res.status(400).json({ message: "Invalid rating" });

  const feedbacks = readJson(feedbacksFile);

  const newFeedback = {
    id: Date.now(),
    serviceId: Number(serviceId),
    rating,
    comment: (comment || "").toString().slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  feedbacks.push(newFeedback);
  writeJson(feedbacksFile, feedbacks);

  res.status(201).json({ message: "Feedback saved" });
});

// GET feedback (admin)
app.get("/api/feedback", authMiddleware, (req, res) => {
  res.json(readJson(feedbacksFile));
});

// ---- EXCEL EXPORT ----

app.get("/api/feedback/export", authMiddleware, (req, res) => {
  const feedbacks = readJson(feedbacksFile);
  const services = readJson(servicesFile);

  const rows = feedbacks.map((fb) => {
    const svc = services.find((s) => s.id === fb.serviceId);

    return {
      "Service Name": svc ? svc.name : "Unknown",
      "Rating Given": fb.rating,
      "Rating Value": ratingWeights[fb.rating] || 0,
      "Comment": fb.comment,
      "Submission Date": new Date(fb.createdAt).toLocaleString(),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", "attachment; filename=feedback_export.xlsx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  res.send(buffer);
});

// ---- STATS ----

app.get("/api/stats", authMiddleware, (req, res) => {
  const feedbacks = readJson(feedbacksFile);
  const services = readJson(servicesFile);

  const totalFeedbacks = feedbacks.length;

  const serviceStats = services.map((svc) => {
    const svcFeedbacks = feedbacks.filter((fb) => fb.serviceId === svc.id);

    const count = svcFeedbacks.length;
    let totalScore = 0;

    const distribution = {
      Excellent: 0,
      Good: 0,
      Neutral: 0,
      Satisfying: 0,
      Unsatisfying: 0,
    };

    svcFeedbacks.forEach((fb) => {
      totalScore += ratingWeights[fb.rating];
      distribution[fb.rating]++;
    });

    return {
      id: svc.id,
      name: svc.name,
      feedbackCount: count,
      averageScore: count > 0 ? totalScore / count : null,
      ratingDistribution: distribution,
    };
  });

  res.json({
    totalFeedbacks,
    services: serviceStats,
  });
});

// -------- START SERVER --------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Services API backend running on port ${PORT}`);
});
