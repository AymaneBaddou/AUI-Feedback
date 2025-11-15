import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDept, setSavingDept] = useState(false);

  const navigate = useNavigate();

  // logout function
  const logout = () => {
    localStorage.removeItem("adminToken");
    setAuthToken(null);
    navigate("/admin/login");
  };

  // load stats + departments on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setError("You must log in as admin to view this page.");
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const [statsRes, deptsRes] = await Promise.all([
          api.get("/api/stats"),
          api.get("/api/departments"),
        ]);

        setStats(statsRes.data);
        setDepartments(deptsRes.data);
      } catch (err) {
        console.error(err);
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // add a new department
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      setSavingDept(true);
      const res = await api.post("/api/departments", {
        name: newDeptName.trim(),
      });
      setDepartments((prev) => [...prev, res.data]);
      setNewDeptName("");
    } catch (err) {
      console.error(err);
      setError("Could not add department.");
    } finally {
      setSavingDept(false);
    }
  };

  // rename department
  const handleRenameDepartment = async (id, newName) => {
    if (!newName.trim()) return;
    try {
      const res = await api.put(`/api/departments/${id}`, {
        name: newName.trim(),
      });
      setDepartments((prev) =>
        prev.map((d) => (d.id === id ? res.data : d))
      );
    } catch (err) {
      console.error(err);
      setError("Could not rename department.");
    }
  };

  // delete department
  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await api.delete(`/api/departments/${id}`);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      setError("Could not delete department.");
    }
  };

  // download Excel export
  const handleDownloadExcel = async () => {
    try {
      const res = await api.get("/api/feedback/export", {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "feedback_export.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Could not download Excel file.");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Admin Dashboard</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Admin Dashboard</h2>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <h2>Admin Dashboard</h2>
        <button
          onClick={logout}
          style={{
            padding: "6px 12px",
            background: "#eee",
            border: "1px solid #ccc",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* STATS */}
      {stats && (
        <section style={{ marginBottom: 25 }}>
          <h3>Overview</h3>
          <p>
            Total feedbacks: <strong>{stats.totalFeedbacks}</strong>
          </p>

          <h4>Per Department</h4>
          <ul>
            {stats.departments.map((d) => (
              <li key={d.id}>
                <strong>{d.name}</strong> – {d.feedbackCount} feedback(s)
                {", avg score: "}
                {d.averageScore ? d.averageScore.toFixed(2) : "N/A"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* DEPARTMENTS MANAGEMENT */}
      <section style={{ marginBottom: 25 }}>
        <h3>Departments</h3>

        <form onSubmit={handleAddDepartment} style={{ marginBottom: 15 }}>
          <input
            type="text"
            placeholder="New department name"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            style={{ padding: 8, width: "60%", marginRight: 8 }}
          />
          <button
            type="submit"
            disabled={savingDept}
            style={{ padding: "8px 16px" }}
          >
            {savingDept ? "Adding..." : "Add Department"}
          </button>
        </form>

        {departments.length === 0 ? (
          <p>No departments yet.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 10,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "left",
                    paddingBottom: 6,
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "left",
                    paddingBottom: 6,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <DeptRow
                  key={dept.id}
                  dept={dept}
                  onRename={handleRenameDepartment}
                  onDelete={handleDeleteDepartment}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* EXCEL EXPORT */}
      <section>
        <h3>Reports</h3>
        <button onClick={handleDownloadExcel} style={{ padding: "8px 16px" }}>
          Download Feedback Excel
        </button>
      </section>
    </div>
  );
}

// Row component for each department (inline editing)
function DeptRow({ dept, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(dept.name);

  const save = () => {
    if (tempName.trim() && tempName !== dept.name) {
      onRename(dept.id, tempName);
    }
    setEditing(false);
  };

  return (
    <tr>
      <td style={{ padding: "6px 0" }}>
        {editing ? (
          <input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            style={{ padding: 4, width: "90%" }}
          />
        ) : (
          dept.name
        )}
      </td>
      <td>
        {editing ? (
          <>
            <button onClick={save} style={{ marginRight: 6 }}>
              Save
            </button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              style={{ marginRight: 6 }}
            >
              Edit
            </button>
            <button onClick={() => onDelete(dept.id)}>Delete</button>
          </>
        )}
      </td>
    </tr>
  );
}
