import { FiUser } from "react-icons/fi"; // admin icon
import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="bg-white shadow-sm px-6 py-3 flex justify-between items-center">

        {/* Left side: Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00843D] text-white rounded-full">
            <FiUser size={20} />
          </div>
          <h1 className="text-xl font-semibold text-[#00843D]">
            Admin Dashboard
          </h1>
        </div>

        {/* Right side: Logout button */}
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
