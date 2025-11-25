/* MOBILE-OPTIMIZED FULL FEEDBACK.JSX */
/* — Updated based on the file you uploaded — */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

// 🌍 TRANSLATION DICTIONARY
const translations = {
  en: {
    giveFeedback: "Give Feedback",
    description:
      "Your feedback is anonymous and will only be used to improve the quality of our services.",
    chooseService: "Choose a service to rate",
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
    loading: "Loading services...",
    noService: "No service is currently accepting feedback.",
    selectRating: "Please select a rating.",
    noActiveService: "No service is currently accepting feedback.",
    youSelected: "You selected:",
    back: "Back",
  },

  ar: {
    giveFeedback: "إرسال الملاحظات",
    description:
      "ملاحظاتك مجهولة الهوية وستُستخدم فقط لتحسين جودة خدماتنا.",
    chooseService: "اختر خدمة لتقييمها",
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
    thankYouSub: "تم إرسال ملاحظاتك بنجاح وبشكل مجهول الهوية",
    submitAnother: "إرسال ملاحظة أخرى",
    loading: "جاري تحميل الخدمات...",
    noService: "لا توجد خدمة تستقبل الملاحظات حالياً.",
    selectRating: "يرجى اختيار تقييم.",
    noActiveService: "لا توجد خدمة تستقبل الملاحظات حالياً.",
    youSelected: "لقد اخترت:",
    back: "رجوع",
  },
};

// ⭐ Rating options
const ratingOptions = [
  { value: "Excellent", label: "Very Satisfied", color: "bg-green-500", emoji: "😄" },
  { value: "Good", label: "Satisfied", color: "bg-lime-400", emoji: "🙂" },
  { value: "Neutral", label: "Neutral", color: "bg-yellow-400", emoji: "😐" },
  { value: "Satisfying", label: "Unsatisfied", color: "bg-orange-400", emoji: "🙁" },
  { value: "Unsatisfying", label: "Very Unsatisfied", color: "bg-red-500", emoji: "☹" },
];

const MAX_COMMENT = 500;

export default function Feedback() {
  const [activeServices, setActiveServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [lang, setLang] = useState("en");
  const t = translations[lang];

  // Fade animation
  const fade = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.25 },
  };

  // Fetch Active Services
  useEffect(() => {
    let mounted = true;

    const fetchServices = async () => {
      try {
        const res = await api.get("/api/services/active");
        if (!mounted) return;

        const list = res.data || [];
        setActiveServices(list);

        // Auto-select if only one
        if (list.length === 1) {
          if (!selectedService || selectedService.id !== list[0].id) {
            setSelectedService(list[0]);
            setRating("");
            setComment("");
          }
        }

        // Reset if service disappears
        if (selectedService && !list.some(s => s.id === selectedService.id)) {
          setSelectedService(null);
          setRating("");
          setComment("");
        }

      } catch {
        setError(t.noActiveService);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    const interval = setInterval(fetchServices, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [lang, selectedService]);

  useEffect(() => {
    setRating("");
    setComment("");
  }, [selectedService]);


  // Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedService) return setError(t.noActiveService);
    if (!rating) return setError(t.selectRating);

    try {
      setSubmitting(true);

      await api.post("/api/feedback", {
        serviceId: selectedService.id,
        rating,
        comment,
      });

      setMessage("submitted");
      setRating("");
      setComment("");
      setSelectedService(null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ⭐ THANK YOU SCREEN
  if (message) {
    return (
      <AnimatePresence>
        <motion.div {...fade}
          className="max-w-2xl mx-auto min-h-screen flex items-center justify-center px-4"
        >
          <div className="bg-white p-10 md:p-16 rounded-2xl shadow-xl border text-center relative overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
              className="mx-auto w-24 h-24 rounded-full bg-[#00843D]/10 text-[#00843D] flex items-center justify-center text-5xl mb-6"
            >
              ✓
            </motion.div>

            <h2 className="text-4xl font-bold text-[#00843D] mb-3">
              {t.thankYou}
            </h2>

            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              {t.thankYouSub}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[#00843D] text-white text-sm font-medium rounded-lg hover:bg-[#006B31] transition shadow-md"
            >
              {t.submitAnother}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ⭐ MAIN SCREEN
  const dir = lang === "ar" ? "rtl" : "ltr";

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
      className="w-full max-w-7xl mx-auto pt-14 pb-10 px-3 sm:px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="bg-white p-4 sm:p-6 md:p-10 rounded-xl shadow-lg border relative" dir={dir}>

        {/* 🌍 Language Switch */}
        <div className={`absolute top-3 ${lang === "ar" ? "left-4" : "right-4"} flex space-x-2`}>
          <button
            onClick={() => setLang("en")}
            className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium ${
              lang === "en" ? "bg-[#00843D] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            English
          </button>

          <button
            onClick={() => setLang("ar")}
            className={`text-[10px] sm:text-xs px-3 py-1.5 rounded-full ${
              lang === "ar" ? "bg-[#00843D] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            العربية
          </button>
        </div>

        {/* 🔙 Back Button */}
        {activeServices.length > 1 && selectedService && (
          <motion.button
            {...fade}
            onClick={() => setSelectedService(null)}
            className={`absolute top-3 ${
              lang === "ar" ? "right-4" : "left-4"
            } inline-flex items-center gap-2 
            px-3 py-1.5 rounded-full
            bg-white text-[#00843D] border border-[#00843D]/30
            shadow-sm hover:shadow-md hover:bg-[#00843D]/10 
            transition-all text-xs sm:text-sm`}
          >
            <span className="text-sm sm:text-base">←</span>
            {t.back}
          </motion.button>
        )}

        {/* Green Line */}
        <div className="absolute inset-x-0 -top-1 h-1 bg-[#00843D]" />

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#00843D] mt-10 mb-1">
          {t.giveFeedback}
        </h2>

        <p className="text-gray-600 mb-6 text-xs sm:text-sm md:text-base">
          {t.description}
        </p>

        {/* Pages Switch */}
        <AnimatePresence mode="wait">

          {/* ⭐ SERVICE SELECTION */}
          {!loading && activeServices.length > 1 && !selectedService && (
            <motion.div key="service-select" {...fade}>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">
                {t.chooseService}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className="p-4 sm:p-6 bg-gray-50 border rounded-xl shadow hover:shadow-md transition text-left hover:bg-gray-100"
                  >
                    <p className="text-lg font-semibold text-[#00843D]">{service.name}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ⭐ RATING */}
          {selectedService && (
            <motion.div key="form" {...fade} className="mt-4 sm:mt-6">

              <p className="text-lg sm:text-2xl text-gray-700 mb-2">
                {t.ratingYouAreGiving}{" "}
                <span className="font-semibold text-[#00843D]">{selectedService.name}</span>
              </p>

              <div className="border-t border-gray-200 mt-2 mb-4" />

              {error && (
                <div className="text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  {t.howSatisfied}
                </label>

                {/* ⭐ RESPONSIVE EMOJI GRID */}
                <div className="flex justify-center sm:justify-between flex-wrap gap-4 sm:gap-3">
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
                        className="group relative flex flex-col items-center flex-1 min-w-[55px]"
                      >
                        <div
                          className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black text-white text-[9px]
                            opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all"
                        >
                          {displayLabel}
                        </div>

                        <motion.div
                          className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl sm:text-2xl
                            ${opt.color} text-white transition 
                            ${isSelected ? "ring-4 ring-[#00843D] scale-110 shadow-lg" : "shadow"}`}
                          whileTap={{ scale: 0.9 }}
                        >
                          {opt.emoji}
                        </motion.div>

                        <span className="mt-1 text-[9px] sm:text-[10px] text-gray-600">
                          {displayLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedLabel && (
                  <p className="mt-1 text-xs text-gray-600">
                    {t.youSelected}{" "}
                    <span className="font-semibold text-[#00843D]">{selectedLabel}</span>
                  </p>
                )}

                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  {t.commentOptional}
                </label>

                <textarea
                  rows={4}
                  maxLength={MAX_COMMENT}
                  placeholder={t.placeholder}
                  className="w-full border rounded px-3 py-2 text-sm sm:text-base"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                <p className="text-[10px] sm:text-xs text-gray-400 text-right">
                  {comment.length}/{MAX_COMMENT}
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 sm:py-2 rounded text-sm sm:text-base text-white transition 
                    ${submitting ? "bg-gray-400" : "bg-[#00843D] hover:bg-[#006B31]"}`}
                >
                  {submitting ? t.submitting : t.submit}
                </button>
              </form>
            </motion.div>
          )}

          {loading && activeServices.length === 0 && (
            <motion.p key="loading" {...fade} className="text-gray-500 text-center">
              {t.loading}
            </motion.p>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}

