import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Feedback from "./pages/Feedback";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminHeader from "./components/AdminHeader";
import { setAuthToken } from "./api";

function App() {
  const location = useLocation();

  const isAdminDashboard = location.pathname.startsWith("/admin/dashboard");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) setAuthToken(token);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Conditional header */}
      {isAdminDashboard ? <AdminHeader /> : <Navbar />}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            
            {/* Home page = Feedback */}
            <Route path="/" element={<Feedback />} />
            
            {/* Optional alias */}
            <Route path="/feedback" element={<Feedback />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default App;
