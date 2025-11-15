import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@uni.com"); // default for testing
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

      // save token
      localStorage.setItem("adminToken", token);
      setAuthToken(token);

      // go to dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-lg shadow">
    <h2 className="text-2xl font-semibold mb-4">Admin Login</h2>

    {error && <p className="text-red-600 mb-2">{error}</p>}

    <form onSubmit={handleSubmit} className="space-y-4">

      <div>
        <label className="block mb-1 font-medium">Email</label>
        <input
          type="email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Password</label>
        <input
          type="password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  </div>
);
}
