import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "10px 20px", borderBottom: "1px solid #ddd" }}>
      <Link to="/" style={{ marginRight: 16 }}>Home</Link>
      <Link to="/feedback" style={{ marginRight: 16 }}>Give Feedback</Link>
      <Link to="/admin/login">Admin</Link>
    </nav>
  );
}
