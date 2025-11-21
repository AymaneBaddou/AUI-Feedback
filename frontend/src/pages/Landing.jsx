import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="max-w-3xl text-center 
                   transition-all duration-200 transform hover:-translate-y-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <h1 className="text-5xl font-bold text-[#00843D] mb-4">
          University Feedback System
        </h1>

        <p className="text-gray-700 text-2xl` mb-6">
          Help us improve your experience at AUI by sharing honest feedback
          about different departments. All responses are anonymous and will
          only be used to enhance the quality of services.
        </p>

        <div className="flex justify-center mt-10">
  <Link
    to="/feedback"
    className="px-14 py-5 bg-[#00843D] text-white text-2xl font-semibold 
               rounded-xl shadow-xl hover:bg-[#006B31] 
               hover:-translate-y-1 active:scale-95 
               transition transform duration-200 ease-out"
    >
      Give Feedback
    </Link>
</div>
      </motion.div>
    </div>
  );
}
