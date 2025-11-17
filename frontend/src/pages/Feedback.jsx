import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api";

// value = what we send to backend
// label = what user sees
const ratingOptions = [
  { value: "Excellent", label: "Very Satisfied", color: "bg-green-500", emoji: "😄" },
  { value: "Good", label: "Satisfied", color: "bg-lime-400", emoji: "🙂" },
  { value: "Neutral", label: "Neutral", color: "bg-yellow-400", emoji: "😐" },
  { value: "Satisfying", label: "Unsatisfied", color: "bg-orange-400", emoji: "🙁" },
  { value: "Unsatisfying", label: "Very Unsatisfied", color: "bg-red-500", emoji: "☹️" },
];

const MAX_COMMENT = 500;

export default function Feedback() {
  const [activeDept, setActiveDept] = useState(null);
  const [loadingDept, setLoadingDept] = useState(true);

  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveDepartment = async () => {
      try {
        const res = await api.get("/api/departments/active");
        const list = res.data || [];
        setActiveDept(list[0] || null);
      } catch (err) {
        console.error(err);
        setError("Could not load active department. Please try again later.");
      } finally {
        setLoadingDept(false);
      }
    };

    fetchActiveDepartment();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!activeDept) {
      setError("No department is currently accepting feedback.");
      return;
    }

    if (!rating) {
      setError("Please select a rating.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/feedback", {
        departmentId: activeDept.id,
        rating,
        comment,
      });

      setMessage("Thank you! Your feedback has been submitted anonymously.");
      setRating("");
      setComment("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while submitting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!rating && !!activeDept && !submitting;

  const selectedLabel =
    ratingOptions.find((r) => r.value === rating)?.label || null;

  return (
    <motion.div
      className="max-w-xl mx-auto mt-8 px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white p-6 rounded-lg shadow border relative transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl">
        {/* AUI green accent bar */}
        <div className="absolute inset-x-0 -top-1 h-1 bg-[#00843D] rounded-t-lg" />

        <h2 className="text-2xl font-semibold text-[#00843D] mb-1">
          Give Feedback
        </h2>
        <p className="text-gray-600 mb-2 text-sm">
          Your feedback is anonymous and will only be used to improve the
          quality of departments and services.
        </p>

        {activeDept && (
          <p className="mb-3 text-2xl text-gray-700">
            You are currently rating:{" "}
            <span className="font-semibold text-[#00843D]">
              {activeDept.name}
            </span>
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 mt-2 mb-4" />

        {loadingDept && (
          <p className="text-gray-500 text-sm mb-3">Loading department...</p>
        )}

        {!loadingDept && !activeDept && (
          <div className="flex items-start gap-2 mb-3 text-sm bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
            <span className="mt-0.5">⚠️</span>
            <p className="text-yellow-800">
              No department is currently accepting feedback. Please check back
              later.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 mb-3 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
            <span className="mt-0.5">⚠️</span>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {message && (
          <div className="flex items-start gap-2 mb-3 text-sm bg-green-50 border border-green-200 rounded px-3 py-2">
            <span className="mt-0.5">✅</span>
            <p className="text-green-800">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* ⭐ Smiley Rating Bar with tooltip */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              How satisfied are you?
            </label>

            <div className="flex justify-between flex-wrap gap-3">
              {ratingOptions.map((opt) => {
                const isSelected = rating === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRating(opt.value)}
                    className="group relative flex flex-col items-center flex-1 min-w-[60px] focus:outline-none"
                  >
                    {/* Tooltip */}
                    <div
                      className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-white text-[10px]
                                 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1
                                 transition-all duration-150 z-10"
                    >
                      {opt.label}
                    </div>

                    {/* Smiley circle */}
                    <div
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl
                                  ${opt.color} text-white border-2 border-white
                                  transition-all duration-200 transform
                                  ${isSelected ? "ring-4 ring-[#00843D] scale-110 shadow-lg" : "shadow"}`}
                    >
                      <span>{opt.emoji}</span>
                    </div>

                    {/* Label under circle */}
                    <span className="mt-2 text-[10px] md:text-[11px] text-gray-600 text-center">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected label text */}
            {selectedLabel && (
              <p className="mt-2 text-xs text-gray-600">
                You selected:{" "}
                <span className="font-semibold text-[#00843D]">
                  {selectedLabel}
                </span>
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Comment (optional)
            </label>
            <textarea
              rows={4}
              maxLength={MAX_COMMENT}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00843D]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write anything you want the department to know..."
            />
            <div className="mt-1 text-xs text-gray-400 text-right">
              {comment.length}/{MAX_COMMENT} characters
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-2 rounded text-sm font-medium text-white transition ${
              !canSubmit
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#00843D] hover:bg-[#006B31] cursor-pointer"
            }`}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
