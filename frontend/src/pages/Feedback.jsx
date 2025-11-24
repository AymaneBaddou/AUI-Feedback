import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api";

// 🌍 TRANSLATION DICTIONARY (updated to use “service” instead of “department”)
const translations = {
  en: {
    giveFeedback: "Give Feedback",
    description:
      "Your feedback is anonymous and will only be used to improve the quality of our services.",
    ratingYouAreGiving: "You are currently rating:",
    howSatisfied: "How satisfied are you?",
    verySatisfied: "Very Satisfied",
    satisfied: "Satisfied",
    neutral: "Neutral",
    unsatisfied: "Unsatisfied",
    veryUnsatisfied: "Very Unsatisfied",
    commentOptional: "Comment (optional)",
    placeholder: "Write anything you want the service to know...",
    submit: "Submit Feedback",
    submitting: "Submitting...",
    thankYou: "Thank You!",
    thankYouSub: "Your feedback has been submitted anonymously.",
    submitAnother: "Submit Another Response",
    loading: "Loading service...",
    noService: "No service is currently accepting feedback. Please check back later.",
    selectRating: "Please select a rating.",
    noActiveService: "No service is currently accepting feedback.",
    youSelected: "You selected:",
  },

  ar: {
    giveFeedback: "إرسال الملاحظات",
    description:
      "ملاحظاتك مجهولة الهوية وستُستخدم فقط لتحسين جودة خدماتنا.",
    ratingYouAreGiving: "أنت تقوم حالياً بتقييم:",
    howSatisfied: "ما مدى رضاك؟",
    verySatisfied: "راضٍ جداً",
    satisfied: "راضٍ",
    neutral: "محايد",
    unsatisfied: "غير راضٍ",
    veryUnsatisfied: "غير راضٍ جداً",
    commentOptional: "تعليق (اختياري)",
    placeholder: "اكتب أي شيء تود أن يعرفه القسم...",
    submit: "إرسال الملاحظات",
    submitting: "جارٍ الإرسال...",
    thankYou: "شكراً لك!",
    thankYouSub: "تم إرسال ملاحظاتك بنجاح وبشكل مجهول الهوية.",
    submitAnother: "إرسال ملاحظة أخرى",
    loading: "جاري تحميل الخدمة...",
    noService: "لا توجد خدمة تستقبل الملاحظات حالياً. يرجى المحاولة لاحقاً.",
    selectRating: "يرجى اختيار تقييم.",
    noActiveService: "لا توجد خدمة تستقبل الملاحظات حالياً.",
    youSelected: "لقد اخترت:",
  }
};

// Rating options
const ratingOptions = [
  { value: "Excellent", label: "Very Satisfied", color: "bg-green-500", emoji: "😄" },
  { value: "Good", label: "Satisfied", color: "bg-lime-400", emoji: "🙂" },
  { value: "Neutral", label: "Neutral", color: "bg-yellow-400", emoji: "😐" },
  { value: "Satisfying", label: "Unsatisfied", color: "bg-orange-400", emoji: "🙁" },
  { value: "Unsatisfying", label: "Very Unsatisfied", color: "bg-red-500", emoji: "☹" },
];

const MAX_COMMENT = 500;

export default function Feedback() {
  const [activeService, setActiveService] = useState(null);
  const [loadingService, setLoadingService] = useState(true);

  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [lang, setLang] = useState("en");
  const t = translations[lang];

  useEffect(() => {
    const fetchActiveService = async () => {
      try {
        // UPDATED to new backend route
        const res = await api.get("/api/services/active");

        const list = res.data || [];
        setActiveService(list[0] || null);
      } catch {
        setError(t.noActiveService);
      } finally {
        setLoadingService(false);
      }
    };

    fetchActiveService();
  }, [lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!activeService) return setError(t.noActiveService);
    if (!rating) return setError(t.selectRating);

    try {
      setSubmitting(true);

      await api.post("/api/feedback", {
        serviceId: activeService.id, // FINAL correct field
        rating,
        comment,
      });

      setMessage("submitted");
      setRating("");
      setComment("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ⭐ Thank-you page
  if (message) {
    return (
      <motion.div
        className="max-w-2xl mx-auto min-h-screen flex items-center justify-center px-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white p-20 rounded-lg shadow border">
          <h2 className="text-3xl font-bold text-[#00843D] mb-4">
            {t.thankYou}
          </h2>

          <p className="text-lg text-gray-700">{t.thankYouSub}</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-[#00843D] text-white rounded hover:bg-[#006B31]"
          >
            {t.submitAnother}
          </button>
        </div>
      </motion.div>
    );
  }

  const dir = lang === "ar" ? "rtl" : "ltr";

  // Get translated label for selected rating
  const selectedLabel = (() => {
    const option = ratingOptions.find((r) => r.value === rating);
    if (!option) return null;

    const translatedKey = Object.keys(translations.en).find(
      (key) => translations.en[key] === option.label
    );

    return translatedKey ? t[translatedKey] : option.label;
  })();

  return (
    <motion.div
      className="w-full max-w-7xl mx-auto pt-16 pb-10 px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="bg-white p-6 md:p-10 rounded-xl shadow-lg border relative"
        dir={dir}
      >
        {/* Language Switch */}
        <div className={`absolute top-4 ${lang === "ar" ? "left-4" : "right-4"} flex space-x-2`}>
          <button
            onClick={() => setLang("en")}
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              lang === "en" ? "bg-[#00843D] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            English
          </button>

          <button
            onClick={() => setLang("ar")}
            className={`text-xs px-2 py-1 rounded-full ${
              lang === "ar" ? "bg-[#00843D] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            العربية
          </button>
        </div>

        {/* Green bar */}
        <div className="absolute inset-x-0 -top-1 h-1 bg-[#00843D]" />

        {/* Title */}
        <h2 className="text-3xl font-semibold text-[#00843D] mb-2">
          {t.giveFeedback}
        </h2>

        <p className="text-gray-600 mb-3 text-sm md:text-base">
          {t.description}
        </p>

        {activeService && (
          <p className="mb-3 text-xl md:text-2xl text-gray-700">
            {t.ratingYouAreGiving}{" "}
            <span className="font-semibold text-[#00843D]">
              {activeService.name}
            </span>
          </p>
        )}

        <div className="border-t border-gray-200 mt-2 mb-4" />

        {loadingService && <p className="text-gray-500">{t.loading}</p>}

        {!loadingService && !activeService && (
          <p className="text-yellow-700 mb-3">{t.noService}</p>
        )}

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
            {error}
          </div>
        )}

        {/* Rating */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <label className="block text-sm font-medium text-gray-700">
            {t.howSatisfied}
          </label>

          <div className="flex justify-between flex-wrap gap-3">
            {ratingOptions.map((opt) => {
              const isSelected = rating === opt.value;

              const translatedKey = Object.keys(translations.en).find(
                (key) => translations.en[key] === opt.label
              );

              const displayLabel = translatedKey ? t[translatedKey] : opt.label;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRating(opt.value)}
                  className="group relative flex flex-col items-center flex-1 min-w-[60px]"
                >
                  {/* Hover label */}
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-white text-[10px]
                               opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all"
                  >
                    {displayLabel}
                  </div>

                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl
                    ${opt.color} text-white transition ${
                      isSelected ? "ring-4 ring-[#00843D] scale-110 shadow-lg" : "shadow"
                    }`}
                  >
                    {opt.emoji}
                  </div>

                  <span className="mt-2 text-[10px] text-gray-600">
                    {displayLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedLabel && (
            <p className="mt-2 text-xs text-gray-600">
              {t.youSelected}{" "}
              <span className="font-semibold text-[#00843D]">{selectedLabel}</span>
            </p>
          )}

          {/* Comment */}
          <label className="block text-sm font-medium text-gray-700">
            {t.commentOptional}
          </label>

          <textarea
            rows={4}
            maxLength={MAX_COMMENT}
            placeholder={t.placeholder}
            className="w-full border rounded px-3 py-2 text-sm"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <p className="text-xs text-gray-400 text-right">
            {comment.length}/{MAX_COMMENT}
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded text-sm text-white bg-[#00843D] hover:bg-[#006B31]"
          >
            {submitting ? t.submitting : t.submit}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
