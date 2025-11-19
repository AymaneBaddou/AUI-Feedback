// Example using Express + JWT
const jwt = require("jsonwebtoken");

const ALLOWED_ADMIN_EMAILS = [
  "your-admin-email@aui.ma", // same as in frontend
  // add more if needed
];

app.post("/api/admin/microsoft-login", (req, res) => {
  const { email } = req.body;

  if (!email || !ALLOWED_ADMIN_EMAILS.includes(email)) {
    return res.status(401).json({ message: "Not authorized as admin" });
  }

  // Create your usual admin JWT
  const token = jwt.sign(
    { email, role: "admin" },
    process.env.JWT_SECRET || "dev-secret-key",
    { expiresIn: "8h" }
  );

  res.json({ token });
});
