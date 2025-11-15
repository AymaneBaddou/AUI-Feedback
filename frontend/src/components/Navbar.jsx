import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-gray-800">AUI Feedback</h1>

      <div className="space-x-6">
        <Link className="text-gray-600 hover:text-black" to="/">Home</Link>
        <Link className="text-gray-600 hover:text-black" to="/feedback">Feedback</Link>
        <Link className="text-gray-600 hover:text-black" to="/admin/login">Admin</Link>
      </div>
    </nav>
  );
}
