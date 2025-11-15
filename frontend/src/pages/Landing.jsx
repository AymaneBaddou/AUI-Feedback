import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="max-w-3xl mx-auto p-10 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        University Feedback System
      </h1>

      <p className="text-gray-600 text-lg mb-8">
        Share honest feedback to help us improve university services and departments.
        All responses are anonymous.
      </p>

      <Link
        to="/feedback"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        Give Feedback
      </Link>
    </div>
  );
}
