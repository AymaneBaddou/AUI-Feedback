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

// ---------- File “database” setup ----------
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const feedbacksFile = path.join(dataDir, "feedbacks.json");
const departmentsFile = path.join(dataDir, "departments.json");

function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
  }
}

ensureFile(feedbacksFile, []);
ensureFile(departmentsFile, []);

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw ? JSON.parse(raw) : [];
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ratings allowed in the app
const allowedRatings = [
  "Excellent",
  "Good",
  "Neutral",
  "Satisfying",
  "Unsatisfying",
];

const ratingWeights = {
  Excellent: 5,
  Good: 4,
  Neutral: 3,
  Satisfying: 2,
  Unsatisfying: 1,
};

// ---------- Auth middleware ----------
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ---------- ROUTES ----------

// health check
app.get("/", (req, res) => {
  res.send("Backend working (file-based, no DB)");
});

// ---- Admin login ----
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required" });
  }

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { role: "admin", email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

// ---- Departments ----

// public: list departments (for admin dashboard, stats, etc.)
app.get("/api/departments", (req, res) => {
  const departments = readJson(departmentsFile);
  res.json(departments);
});

// public: get active department(s)
app.get("/api/departments/active", (req, res) => {
  const departments = readJson(departmentsFile);
  const active = departments.filter((d) => d.active);
  res.json(active);
});

// admin: create department
app.post("/api/departments", authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  const departments = readJson(departmentsFile);
  const newDept = {
    id: Date.now(),
    name: name.trim(),
    active: false, // NEW FIELD
  };
  departments.push(newDept);
  writeJson(departmentsFile, departments);

  res.status(201).json(newDept);
});

// admin: update department
app.put("/api/departments/:id", authMiddleware, (req, res) => {
  const { name } = req.body;
  const id = Number(req.params.id);

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  const departments = readJson(departmentsFile);
  const index = departments.findIndex((d) => d.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Department not found" });
  }

  departments[index].name = name.trim();
  writeJson(departmentsFile, departments);

  res.json(departments[index]);
});

// admin: set active department (only one active at a time)
app.put("/api/departments/:id/active", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const departments = readJson(departmentsFile);

  let found = false;

  const updated = departments.map((d) => {
    if (d.id === id) {
      found = true;
      return { ...d, active: true };
    }
    // make all other departments inactive
    return { ...d, active: false };
  });

  if (!found) {
    return res.status(404).json({ message: "Department not found" });
  }

  writeJson(departmentsFile, updated);
  const activeDept = updated.find((d) => d.id === id);
  res.json(activeDept);
});

// ✅ NEW: admin: clear active department (make all inactive)
app.put("/api/departments/active/clear", authMiddleware, (req, res) => {
  const departments = readJson(departmentsFile);
  const updated = departments.map((d) => ({ ...d, active: false }));
  writeJson(departmentsFile, updated);
  res.json({ message: "All departments deactivated" });
});

// admin: delete department
app.delete("/api/departments/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);

  let departments = readJson(departmentsFile);
  const exists = departments.some((d) => d.id === id);

  if (!exists) {
    return res.status(404).json({ message: "Department not found" });
  }

  departments = departments.filter((d) => d.id !== id);
  writeJson(departmentsFile, departments);

  // we keep past feedback; in Excel it will show "Unknown"
  res.json({ message: "Department deleted" });
});

// ---- Feedback ----

// public: submit feedback
app.post("/api/feedback", (req, res) => {
  const { departmentId, rating, comment } = req.body;

  if (!departmentId || !rating) {
    return res
      .status(400)
      .json({ message: "departmentId and rating are required" });
  }

  if (!allowedRatings.includes(rating)) {
    return res.status(400).json({ message: "Invalid rating value" });
  }

  const departments = readJson(departmentsFile);
  const deptExists = departments.some(
    (d) => d.id === Number(departmentId)
  );
  if (!deptExists) {
    return res.status(400).json({ message: "Unknown department" });
  }

  const feedbacks = readJson(feedbacksFile);

  const newFeedback = {
    id: Date.now(),
    departmentId: Number(departmentId),
    rating,
    comment: comment?.toString().slice(0, 500) || "",
    createdAt: new Date().toISOString(),
  };

  feedbacks.push(newFeedback);
  writeJson(feedbacksFile, feedbacks);

  res.status(201).json({ message: "Feedback saved" });
});

// admin: list all feedback
app.get("/api/feedback", authMiddleware, (req, res) => {
  const feedbacks = readJson(feedbacksFile);
  res.json(feedbacks);
});

// ---- Excel export (admin) ----
app.get("/api/feedback/export", authMiddleware, (req, res) => {
  const feedbacks = readJson(feedbacksFile);
  const departments = readJson(departmentsFile);

  const rows = feedbacks.map((fb) => {
    const dept = departments.find((d) => d.id === fb.departmentId);
    return {
      "Department Name": dept ? dept.name : "Unknown",
      "Rating Given": fb.rating,
      "Comment (if any)": fb.comment || "",
      "Submission Date": new Date(fb.createdAt).toLocaleString(),
    };
  });

  if (rows.length === 0) {
    rows.push({
      "Department Name": "",
      "Rating Given": "",
      "Comment (if any)": "",
      "Submission Date": "",
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 50 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=feedback_export.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.send(buffer);
});

// ---- Stats (admin) ----
app.get("/api/stats", authMiddleware, (req, res) => {
  const feedbacks = readJson(feedbacksFile);
  const departments = readJson(departmentsFile);

  const totalFeedbacks = feedbacks.length;

  const departmentsStats = departments.map((dept) => {
    const deptFeedbacks = feedbacks.filter(
      (fb) => fb.departmentId === dept.id
    );
    const count = deptFeedbacks.length;

    let totalScore = 0;
    const distribution = {};
    allowedRatings.forEach((r) => (distribution[r] = 0));

    deptFeedbacks.forEach((fb) => {
      totalScore += ratingWeights[fb.rating] || 0;
      distribution[fb.rating] = (distribution[fb.rating] || 0) + 1;
    });

    const averageScore = count > 0 ? totalScore / count : null;

    return {
      id: dept.id,
      name: dept.name,
      feedbackCount: count,
      averageScore,
      ratingDistribution: distribution,
    };
  });

  res.json({
    totalFeedbacks,
    departments: departmentsStats,
  });
});

// ---------- START SERVER ----------
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
