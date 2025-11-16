import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const linkBase =
    "text-sm font-medium transition hover:text-[#00843D]";
  const active =
    "text-[#00843D] border-b-2 border-[#00843D] pb-1";
  const inactive = "text-gray-600";

  return (
    <nav className="bg-white shadow-sm px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-[#00843D] tracking-wide">
        AUI Feedback
      </h1>

      <div className="space-x-6 flex items-center">
        <Link
          to="/"
          className={`${linkBase} ${
            location.pathname === "/" ? active : inactive
          }`}
        >
          Home
        </Link>
        <Link
          to="/feedback"
          className={`${linkBase} ${
            location.pathname === "/feedback" ? active : inactive
          }`}
        >
          Feedback
        </Link>
        <Link
          to="/admin/login"
          className={`${linkBase} ${
            location.pathname.startsWith("/admin") ? active : inactive
          }`}
        >
          Admin
        </Link>
      </div>
    </nav>
  );
}
