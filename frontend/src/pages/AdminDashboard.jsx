import { useEffect, useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [departments, setDepartments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [renameDeptId, setRenameDeptId] = useState(null);
  const [renameDeptName, setRenameDeptName] = useState("");

  useEffect(() => {
    fetchStats();
    fetchDepartments();
    fetchFeedbacks();
  }, []);

  async function fetchStats() {
    const res = await axios.get("/api/stats");
    setStats(res.data);
  }

  async function fetchDepartments() {
    const res = await axios.get("/api/departments");
    setDepartments(res.data);
  }

  async function fetchFeedbacks() {
    const res = await axios.get("/api/feedback");
    setFeedbacks(res.data);
  }

  async function addDepartment(e) {
    e.preventDefault();
    if (!newDept.trim()) return;

    await axios.post("/api/departments", { name: newDept });
    setNewDept("");
    fetchDepartments();
  }

  async function renameDepartment(e) {
    e.preventDefault();
    await axios.put(`/api/departments/${renameDeptId}`, {
      name: renameDeptName,
    });

    setRenameDeptId(null);
    setRenameDeptName("");
    fetchDepartments();
  }

  async function deleteDepartment(id) {
    await axios.delete(`/api/departments/${id}`);
    fetchDepartments();
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/admin/login");
  }

  async function downloadExcel() {
    const res = await axios.get("/api/feedback/export", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedbacks.xlsx";
    a.click();
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#00843D]">
          Admin Dashboard
        </h2>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <section className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-[#00843D]">
          Overview
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-green-200 p-4 rounded shadow text-center">
            <p className="text-lg font-semibold text-gray-700">
              Total Feedbacks
            </p>
            <p className="text-3xl font-bold text-[#00843D]">
              {stats.totalFeedbacks || 0}
            </p>
          </div>

          <div className="bg-white border border-green-200 p-4 rounded shadow text-center">
            <p className="text-lg font-semibold text-gray-700">
              Departments
            </p>
            <p className="text-3xl font-bold text-[#00843D]">
              {departments.length}
            </p>
          </div>

          <div className="bg-white border border-green-200 p-4 rounded shadow text-center">
            <p className="text-lg font-semibold text-gray-700">
              Last Submission
            </p>
            <p className="text-gray-600 break-all">
              {stats.lastSubmission || "None"}
            </p>
          </div>
        </div>
      </section>

      {/* Add Department */}
      <section className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-[#00843D]">
          Add Department
        </h3>

        <form onSubmit={addDepartment} className="flex gap-3">
          <input
            type="text"
            className="border p-2 rounded flex-1 outline-[#00843D]"
            placeholder="Department name"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
          />

          <button className="px-4 py-2 bg-[#00843D] text-white rounded hover:bg-[#006B31]">
            Add
          </button>
        </form>
      </section>

      {/* Department List */}
      <section className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-[#00843D]">
          Departments
        </h3>

        <table className="w-full border border-gray-200 rounded overflow-hidden">
          <thead className="bg-green-100 border-b border-gray-300">
            <tr>
              <th className="p-3 text-left text-gray-700">Name</th>
              <th className="p-3 text-left text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {departments.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3">
                  {renameDeptId === d.id ? (
                    <input
                      type="text"
                      className="border p-1 rounded w-full outline-[#00843D]"
                      value={renameDeptName}
                      onChange={(e) => setRenameDeptName(e.target.value)}
                    />
                  ) : (
                    <span className="text-gray-800">{d.name}</span>
                  )}
                </td>

                <td className="p-3 flex gap-3">
                  {renameDeptId === d.id ? (
                    <>
                      <button
                        onClick={renameDepartment}
                        className="px-3 py-1 bg-[#00843D] text-white rounded hover:bg-[#006B31]"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => setRenameDeptId(null)}
                        className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setRenameDeptId(d.id);
                          setRenameDeptName(d.name);
                        }}
                        className="px-3 py-1 bg-[#00843D] text-white rounded hover:bg-[#006B31]"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteDepartment(d.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Feedbacks */}
      <section className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-[#00843D]">
            Feedbacks
          </h3>

          <button
            onClick={downloadExcel}
            className="px-4 py-2 bg-[#00843D] text-white rounded hover:bg-[#006B31]"
          >
            Download Excel
          </button>
        </div>

        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {feedbacks.map((f) => (
            <li key={f.id} className="border p-3 rounded bg-white shadow-sm">
              <p>
                <strong className="text-[#00843D]">Department:</strong> {f.departmentName}
              </p>
              <p>
                <strong className="text-[#00843D]">Rating:</strong> {f.rating}
              </p>
              <p>
                <strong className="text-[#00843D]">Comment:</strong> {f.comment || "No comment"}
              </p>
              <p className="text-gray-500 text-sm">
                <strong className="text-[#00843D]">Date:</strong> {f.date}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
