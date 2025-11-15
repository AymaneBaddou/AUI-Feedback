# University Feedback Portal

A complete feedback platform allowing students to anonymously rate university departments, while providing administrators with a secure dashboard to view statistics, manage departments, and export feedback as Excel files.

Built with a Node.js + Express backend and a React + Vite frontend, using file-based storage

🚀 Features
⭐ Student Interface (Public)

Select a department

Rate it (Excellent → Unsatisfying)

Optional comment field

Anonymous submission

Clean, simple UI

⭐ Admin Dashboard (Protected)

Secure Admin Login (JWT authentication)

View total feedback statistics

See per-department averages and rating breakdowns

Add new departments

Edit department names

Delete departments

Export all feedback as an Excel (.xlsx) file

Logout button (clears token + redirects)

⭐ Backend (Node + Express)

File-based storage (JSON), no external database

Clean API with authentication middleware

Full CRUD for departments

Feedback endpoint with validation

Stats endpoint returning:

total feedback count

average rating per department

🛠️ Tech Stack
Frontend:

React (Vite)

Axios

React Router DOM

Backend:

Node.js

Express.js

JWT for authentication

File-based JSON storage

xlsx for Excel export
rating distribution

Excel export using xlsx
