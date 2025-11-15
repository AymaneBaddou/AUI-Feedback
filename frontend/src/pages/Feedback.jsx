import { useEffect, useState } from "react";
import api from "../api";

const ratings = [
  "Excellent",
  "Good",
  "Neutral",
  "Satisfying",
  "Unsatisfying",
];

export default function Feedback() {
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // load departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/api/departments");
        setDepartments(res.data);
      } catch (err) {
        console.error(err);
        setError("Could not load departments. Please try again later.");
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!departmentId || !rating) {
      setError("Please select a department and a rating.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/feedback", {
        departmentId: Number(departmentId),
        rating,
        comment,
      });

      setMessage("Thank you! Your feedback has been submitted anonymously.");
      setDepartmentId("");
      setRating("");
      setComment("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while submitting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return(
  <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow mt-6">
    <h2 className="text-2xl font-semibold mb-4">Give Feedback</h2>

    {error && <p className="text-red-600 mb-3">{error}</p>}
    {message && <p className="text-green-600 mb-3">{message}</p>}

    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Department Dropdown */}
      <div>
        <label className="block mb-1 font-medium">Department</label>
        <select
          className="w-full border p-2 rounded"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">Choose a department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Rating */}
      <div>
        <label className="block mb-1 font-medium">Rating</label>
        <div className="space-y-2">
          {ratings.map((r) => (
            <label key={r} className="flex items-center gap-2">
              <input
                type="radio"
                name="rating"
                value={r}
                checked={rating === r}
                onChange={() => setRating(r)}
              />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block mb-1 font-medium">Comment (optional)</label>
        <textarea
          className="w-full border p-2 rounded"
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></textarea>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Submit Feedback
      </button>
    </form>
  </div>
);

}
