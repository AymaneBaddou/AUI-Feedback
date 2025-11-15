# University Feedback Portal

The University Feedback System is a complete full-stack application that enables students to anonymously rate university departments, while providing administrators with a secure dashboard to view statistics, manage departments, and export feedback into Excel.
It’s lightweight, database-free, and perfect for educational institutions or small organizations that need a simple feedback pipeline.

✨ Features
-🧑‍🎓 Student Side
-📝 Anonymous feedback submission
-🏫 Department selection
-⭐ 5-level rating system
-💬 Optional comments
-⚡ Fast and clean UI

🛠️ Admin Dashboard
-🔐 Secure admin login (JWT)
-📊 Real-time statistics (total + per-department)
-🏷️ Add / Rename / Delete departments
-📥 Export feedback as Excel (.xlsx)
-🚪 Logout system
-🗂️ JSON-file persistence (no database required)

⚙️ Backend Features
Lightweight Express server
File-based storage (departments.json, feedbacks.json)
Clean API architecture
Excel generation via xlsx
Strong input validation
