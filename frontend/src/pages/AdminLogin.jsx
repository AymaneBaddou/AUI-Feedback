import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@uni.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/admin/login", { email, password });
      const { token } = res.data;

      localStorage.setItem("adminToken", token);
      setAuthToken(token);

      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-md mx-auto mt-10 px-4"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-md mx-auto mt-10 px-4">
        <div className="bg-white p-6 shadow rounded-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-2xl font-semibold text-[#00843D] mb-2">
            Admin Login
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Only authorized staff members are allowed to access the dashboard.
          </p>

          {error && (
            <p className="text-red-600 mb-3 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00843D]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00843D]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className={`w-full py-2 rounded text-sm font-medium text-white transition ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#00843D] hover:bg-[#006B31] cursor-pointer"
                }`}
              type="submit"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}