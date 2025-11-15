import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ padding: 20 }}>
      <h1>University Feedback Portal</h1>
      <p>Your feedback is anonymous and helps improve departments.</p>
      <Link to="/feedback">Start Giving Feedback</Link>
    </div>
  );
}
