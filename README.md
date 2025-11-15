# University Feedback Portal

**The University Feedback Portal**  is a complete full-stack application that enables students to anonymously rate university departments, while providing administrators with a secure dashboard to view statistics, manage departments, and export feedback into Excel.
It’s lightweight, database-free, and perfect for educational institutions or small organizations that need a simple feedback pipeline.

---

## 💡 Features

- 🧑‍🎓 Student Side
- 🏫 Department selection
- 📝 Anonymous feedback submission
- ⭐ 5-level rating system
- 💬 Optional comments
- ⚡ Fast and clean UI

---

## 🛠️ Admin Dashboard
- 🔐 Secure admin login (JWT)
- 📊 Real-time statistics (total + per-department)
- 🏷️ Add / Rename / Delete departments
- 📥 Export feedback as Excel (.xlsx)
- 🚪 Logout system
- 🗂️ JSON-file persistence (no database required)

---
## 🧠 Tech Stack
**Frontend**
| Tech                | Purpose       |
| ------------------- | ------------- |
| ⚛️ React (Vite)     | SPA interface |
| 🌐 React Router DOM | Routing       |
| 🔗 Axios            | API calls     |
| 🎨 Custom CSS       | Styling       |

**Backend**
| Tech            | Purpose      |
| --------------- | ------------ |
| 🟩 Node.js      | Runtime      |
| 🌐 Express.js   | REST API     |
| 🔐 jsonwebtoken | Auth         |
| 📁 JSON Files   | Data storage |
| 📊 xlsx         | Excel export |
---