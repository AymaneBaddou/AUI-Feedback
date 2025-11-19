import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import api, { setAuthToken } from "../api";
import { loginRequest } from "../authConfig";

const ALLOWED_ADMIN_EMAILS = [
  "your-admin-email@aui.ma", // put your real AUI Office 365 email here
  // add more admin emails if needed
];

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { instance } = useMsal();

  const handleMicrosoftLogin = async () => {
    setError(null);
    try {
      setLoading(true);

      // 1) Microsoft popup login
      const loginResponse = await instance.loginPopup(loginRequest);
      const account = loginResponse.account;

      const email =
        account?.username || account?.idTokenClaims?.preferred_username;

      console.log("Microsoft account:", account);

      // 2) Check if this email is allowed to be admin
      if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
        setError(
          `The account ${email} is not allowed to access the admin dashboard.`
        );
        setLoading(false);
        return;
      }

      // 3) Ask your backend for your own JWT token for this admin
      const res = await api.post("/api/admin/microsoft-login", { email });
      const { token } = res.data;

      // 4) Store token like before
      localStorage.setItem("adminToken", token);
      setAuthToken(token);

      // 5) Go to dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Microsoft login failed. Please try again.");
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
      <div className="bg-white p-6 shadow rounded-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl">
        <h2 className="text-2xl font-semibold text-[#00843D] mb-2">
          Admin Login
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Sign in with your university Office 365 account. Only authorized staff
          can access the dashboard.
        </p>

        {error && (
          <p className="text-red-600 mb-3 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleMicrosoftLogin}
          disabled={loading}
          className={`w-full py-2 rounded text-sm font-medium text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#00843D] hover:bg-[#006B31] cursor-pointer"
          }`}
        >
          {loading ? "Connecting to Microsoft..." : "Sign in with Microsoft"}
        </button>
      </div>
    </motion.div>
  );
}
