const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");


const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// paths to our JSON "database"
const dataDir = path.join(__dirname, "data");
const feedbacksFile = path.join(dataDir, "feedbacks.json");
const departmentsFile = path.join(dataDir, "departments.json");

// small helpers to read/write JSON files
function readJson(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw) return [];
    return JSON.parse(raw);
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ---------- ROUTES ----------

// test route
app.get("/", (req, res) => {
    res.send("Backend working");
});

// get all departments
app.get("/api/departments", (req, res) => {
    const departments = readJson(departmentsFile);
    res.json(departments);
});

// add department
app.post("/api/departments", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const departments = readJson(departmentsFile);
    const newDept = {
        id: Date.now(), // simple id
        name,
    };
    departments.push(newDept);
    writeJson(departmentsFile, departments);

    res.status(201).json(newDept);
});

// submit feedback
app.post("/api/feedback", (req, res) => {
    const { departmentId, rating, comment } = req.body;

    if (!departmentId || !rating) {
        return res.status(400).json({ message: "departmentId and rating are required" });
    }

    const feedbacks = readJson(feedbacksFile);

    const newFeedback = {
        id: Date.now(),
        departmentId,          // link to department
        rating,                // "Excellent", "Good", etc.
        comment: comment || "",
        createdAt: new Date().toISOString(),
    };

    feedbacks.push(newFeedback);
    writeJson(feedbacksFile, feedbacks);

    res.status(201).json({ message: "Feedback saved", feedback: newFeedback });
});

// get all feedbacks (admin can use this for stats / Excel later)
app.get("/api/feedback", (req, res) => {
    const feedbacks = readJson(feedbacksFile);
    res.json(feedbacks);
});

// export feedbacks to Excel
app.get("/api/feedback/export", (req, res) => {
    const feedbacks = readJson(feedbacksFile);
    const departments = readJson(departmentsFile);
    // Convert feedbacks to a tabular format
    const rows = feedbacks.map((fb) => {
        const dept = departments.find((d) => d.id === fb.departmentId);
        return {
            "Department Name": dept ? dept.name : "Unknown",
            "Rating": fb.rating,
            "Comment": fb.comment || "",
            "Date": new Date(fb.createdAt).toLocaleString(),
        };
    });

    if(rows.length === 0) {
        rows.push({
            "Department Name": "",
            "Rating": "",
            "Comment": "",
            "Date": "",
        });
    }

    // Create worksheet + workbook
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");

    // Create buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set download headers
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=feedback.xlsx"
    );
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
});

// ---------- START SERVER ----------
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
