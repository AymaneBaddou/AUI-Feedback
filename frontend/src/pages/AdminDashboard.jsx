import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api, { setAuthToken } from "../api";
import { useNavigate } from "react-router-dom";

// 📊 Recharts
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area,
  PieChart, Pie, Cell
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [feedbackTrend, setFeedbackTrend] = useState([]);

  const [services, setServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingService, setSavingService] = useState(false);

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("adminToken");
    setAuthToken(null);
    navigate("/admin/login");
  };

  // 📌 Load data
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setError("You must log in as admin to view this page.");
      setLoading(false);
      return;
    }
    setAuthToken(token);

    const fetchAll = async () => {
      try {
        const [statsRes, servicesRes, feedbackRes] = await Promise.all([
          api.get("/api/stats"),
          api.get("/api/services"),
          api.get("/api/feedback")
        ]);

        setStats(statsRes.data);
        setServices(servicesRes.data);

        // Build feedback trend graph
        const grouped = {};
        feedbackRes.data.forEach((fb) => {
          const date = fb.createdAt.split("T")[0];
          grouped[date] = (grouped[date] || 0) + 1;
        });

        const formatted = Object.entries(grouped).map(([date, count]) => ({
          date,
          count,
        }));

        setFeedbackTrend(formatted);
      } catch (err) {
        console.error(err);
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Service handlers
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    try {
      setSavingService(true);
      const res = await api.post("/api/services", {
        name: newServiceName.trim(),
      });
      setServices((prev) => [...prev, res.data]);
      setNewServiceName("");
    } catch (err) {
      console.error(err);
      setError("Could not add service.");
    } finally {
      setSavingService(false);
    }
  };

  const handleRenameService = async (id, newName) => {
    if (!newName.trim()) return;
    try {
      const res = await api.put(`/api/services/${id}`, { name: newName.trim() });
      setServices((prev) =>
        prev.map((s) => (s.id === id ? res.data : s))
      );
    } catch (err) {
      console.error(err);
      setError("Could not rename service.");
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await api.delete(`/api/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      setError("Could not delete service.");
    }
  };

  const handleSetActive = async (id, isActive) => {
    try {
      await api.put(`/api/services/${id}/active`, { active: !isActive });

      // Update UI immediately
      if (isActive) {
        setServices((prev) =>
          prev.map((s) => ({ ...s, active: false }))
        );
      } else {
        setServices((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, active: true } : s
          )
        );
      }
    } catch (err) {
      console.error(err);
      setError("Could not update active service.");
    }
  };

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

  const currentActive = services.find((s) => s.active);

  if (loading) {
    return (
      <div className="w-full px-10 py-10">
        <Header logout={logout} />
        <p className="mt-4 text-gray-600 text-sm">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full px-10 py-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {error && (
        <div className="flex items-start gap-2 mb-4 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
          <span className="mt-0.5">⚠️</span>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* ---------------- OVERVIEW ---------------- */}
      {stats && (
        <section className="w-full bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
          <div className="h-1 w-full bg-[#00843D] rounded-t-lg -mt-6 mb-4"></div>

          <h3 className="text-xl font-semibold text-[#00843D] mb-4">Overview</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <StatCard label="Total Feedbacks" value={stats.totalFeedbacks} />
            <StatCard label="Services" value={stats.services.length} />
            <StatCard
              label="Services with Feedback"
              value={stats.services.filter((s) => s.feedbackCount > 0).length}
            />
          </div>

          <h4 className="mt-1 mb-2 font-semibold text-sm text-gray-700">Per Service</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {stats.services.map((s) => (
              <li key={s.id}>
                <span className="font-medium">{s.name}</span> – {s.feedbackCount} feedback(s), avg score:{" "}
                {s.averageScore ? s.averageScore.toFixed(2) : "N/A"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------- ANALYTICS ---------------- */}
      {stats && (
        <section className="w-full bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
          <div className="h-1 w-full bg-[#00843D] rounded-t-lg -mt-6 mb-4"></div>

          <h3 className="text-xl font-semibold text-[#00843D] mb-4">Analytics</h3>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

            {/* AVERAGE SCORE */}
            <div className="bg-gray-50 p-6 rounded-lg border h-[360px]">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Average Score per Service</h4>
              <AverageScoreChart data={stats.services} />
            </div>

            {/* FEEDBACK TREND */}
            <div className="bg-gray-50 p-6 rounded-lg border h-[360px]">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Feedback Trend (per Date)</h4>
              <FeedbackTrendChart data={feedbackTrend} />
            </div>
          </div>

          {currentActive && (
            <div className="mt-10 bg-gray-50 p-6 rounded-lg border max-w-lg mx-auto h-[360px]">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                Rating Distribution — {currentActive.name}
              </h4>
              <RatingPieChart service={currentActive} stats={stats} />
            </div>
          )}
        </section>
      )}

      {/* ---------------- SERVICES SECTION ---------------- */}
      <section className="w-full bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
        <div className="h-1 w-full bg-[#00843D] rounded-t-lg -mt-6 mb-4"></div>

        <h3 className="text-xl font-semibold text-[#00843D] mb-4">Services</h3>

        <form
          onSubmit={handleAddService}
          className="flex flex-col sm:flex-row gap-3 mb-4"
        >
          <input
            type="text"
            placeholder="New service name"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00843D]"
          />
          <button
            type="submit"
            disabled={savingService}
            className={`px-4 py-2 rounded text-sm font-medium text-white transition ${
              savingService
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#00843D] hover:bg-[#006B31]"
            }`}
          >
            {savingService ? "Adding..." : "Add Service"}
          </button>
        </form>

        <div className="overflow-x-auto w-full">
          <table className="min-w-full border border-gray-200 rounded text-sm">
            <thead className="bg-green-100 border-b border-gray-300">
              <tr>
                <th className="p-3 text-left text-gray-700">Name</th>
                <th className="p-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  onRename={handleRenameService}
                  onDelete={handleDeleteService}
                  onSetActive={handleSetActive}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------- REPORTS ---------------- */}
      <section className="w-full bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
        <div className="h-1 w-full bg-[#00843D] rounded-t-lg -mt-6 mb-4"></div>

        <h3 className="text-xl font-semibold text-[#00843D] mb-3">Reports</h3>
        <p className="text-sm text-gray-600 mb-3">
          Download all feedback as an Excel file for detailed review.
        </p>

        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2 bg-[#00843D] text-white rounded text-sm hover:bg-[#006B31]"
        >
          Download Excel
        </button>
      </section>
    </motion.div>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function Header({ logout }) {
  return (
    <div className="w-full bg-white rounded-lg shadow border border-gray-200 mb-8 px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#00843D] text-white flex items-center justify-center text-xl">
          👤
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-600">Manage services & review feedback</p>
        </div>
      </div>

      <button
        onClick={logout}
        className="px-4 py-2 text-xs font-medium rounded border border-red-500 text-red-600 hover:bg-red-50"
      >
        Logout
      </button>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-green-200 p-5 rounded-lg shadow text-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-3xl font-bold text-[#00843D]">{value}</p>
    </div>
  );
}

function ServiceRow({ service, onRename, onDelete, onSetActive }) {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(service.name);

  const save = () => {
    if (tempName.trim() && tempName !== service.name) {
      onRename(service.id, tempName);
    }
    setEditing(false);
  };

  return (
    <tr className="border-t">
      <td className="p-3">
        <div className="flex items-center gap-2">
          {editing ? (
            <input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:border-[#00843D]"
            />
          ) : (
            <span className="text-gray-800">{service.name}</span>
          )}

          {service.active && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-[#00843D] border border-green-200">
              Active
            </span>
          )}
        </div>
      </td>

      <td className="p-3 whitespace-nowrap space-x-2">
        {editing ? (
          <>
            <button
              onClick={save}
              className="px-3 py-1 bg-[#00843D] text-white rounded text-xs hover:bg-[#006B31]"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 bg-[#00843D] text-white rounded text-xs hover:bg-[#006B31]"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(service.id)}
              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={() => onSetActive(service.id, service.active)}
              className={`px-3 py-1 rounded text-xs border ${
                service.active
                  ? "bg-green-100 text-[#00843D] border-green-300 hover:bg-green-200"
                  : "bg-white text-[#00843D] border-[#00843D] hover:bg-green-50"
              }`}
            >
              {service.active ? "Deactivate" : "Set Active"}
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

/* ---------------- CHARTS ---------------- */

function AverageScoreChart({ data }) {
  const chartData = data.map((s) => ({
    name: s.name,
    average: s.averageScore ? Number(s.averageScore.toFixed(2)) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis domain={[0, 5]} />
        <Tooltip />
        <Bar dataKey="average" fill="#00843D" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function FeedbackTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="90%">
      <AreaChart data={data}>
        <XAxis dataKey="date" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Area type="monotone" dataKey="count" stroke="#00843D" fill="#12a15030" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RatingPieChart({ service, stats }) {
  const svc = stats.services.find((s) => s.id === service.id);

  if (!svc || !svc.ratingDistribution) return null;

  const dist = svc.ratingDistribution;

  const data = Object.keys(dist).map((key) => ({
    name: key,
    value: dist[key],
  }));

  const COLORS = ["#00843D", "#4CAF50", "#9CCC65", "#FBC02D", "#E53935"];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <PieChart>
        <Pie
          data={data}
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
