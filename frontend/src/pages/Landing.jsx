import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <motion.div
      className="max-w-3xl mx-auto px-6 py-10 text-center 
             transition-all duration-200 transform hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <h1 className="text-4xl font-bold text-[#00843D] mb-4">
        University Feedback System
      </h1>

      <p className="text-gray-700 text-lg mb-6">
        Help us improve your experience at AUI by sharing honest feedback
        about different departments. All responses are anonymous and will
        only be used to enhance the quality of services.
      </p>

      <div className="flex justify-center gap-4">
        <Link
          to="/feedback"
          className="px-6 py-3 bg-[#00843D] text-white rounded-lg shadow 
                     hover:bg-[#006B31] hover:-translate-y-0.5 
                     transition transform"
        >
          Give Feedback
        </Link>
      </div>
    </motion.div>
  );
}
