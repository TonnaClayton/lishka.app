import { motion } from "framer-motion";

const AboutPage = () => {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 bg-white dark:bg-gray-900">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <img
            src="/logo.svg"
            alt="Lishka Logo"
            className="h-24 w-auto dark:hidden"
          />
          <img
            src="/logo-dark.svg"
            alt="Lishka Logo"
            className="h-24 w-auto hidden dark:block"
          />
        </motion.div>

        {/* Tagline */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100"
        >
          Your AI Fishing Companion
        </motion.h1>

        {/* Continue cat - assuming this is a continuation description */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-gray-600 dark:text-gray-300 mb-8"
        >
          Lishka continues to be your trusted companion for all your fishing
          adventures, providing personalized recommendations based on your
          location, weather conditions, and seasonal patterns.
        </motion.p>
      </div>

      {/* Powered by section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="w-full text-center py-4 text-sm text-gray-500 dark:text-gray-400"
      >
        Powered by OpenAI & TinyPNG
      </motion.div>
    </div>
  );
};

export default AboutPage;
