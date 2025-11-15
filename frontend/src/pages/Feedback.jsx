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

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>Give Feedback</h2>
      <p>Your feedback is anonymous and helps improve the university.</p>

      {loadingDepts && <p>Loading departments...</p>}

      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ color: "green", marginBottom: 10 }}>
          {message}
        </div>
      )}

      {!loadingDepts && departments.length === 0 && (
        <p>No departments available yet.</p>
      )}

      {!loadingDepts && departments.length > 0 && (
        <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
          {/* Department select */}
          <div style={{ marginBottom: 15 }}>
            <label>
              Department:
              <br />
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 5 }}
              >
                <option value="">-- Select a department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Rating */}
          <div style={{ marginBottom: 15 }}>
            <span>Rating:</span>
            <div style={{ marginTop: 5 }}>
              {ratings.map((r) => (
                <label key={r} style={{ display: "block", marginBottom: 4 }}>
                  <input
                    type="radio"
                    name="rating"
                    value={r}
                    checked={rating === r}
                    onChange={() => setRating(r)}
                    style={{ marginRight: 6 }}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 15 }}>
            <label>
              Comment (optional):
              <br />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                style={{ width: "100%", padding: 8, marginTop: 5 }}
                placeholder="Write anything you want the department to know..."
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "8px 16px",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      )}
    </div>
  );
}
