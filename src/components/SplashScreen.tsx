import React from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

interface SplashScreenProps {
  onContinue?: () => void;
}

const SplashScreen = ({ onContinue = () => {} }: SplashScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0251FB] dark:bg-primary p-4">
      <motion.div
        className="flex flex-col items-center justify-center gap-8 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-48 h-48 flex items-center justify-center">
          <Link to="/">
            <img
              src="/logo-dark.svg"
              alt="Fishing AI Logo"
              className="w-full h-auto"
            />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full"
        >
          <Button
            onClick={onContinue}
            className="w-full py-6 rounded-full bg-white dark:bg-card text-[#0251FB] dark:text-primary hover:bg-gray-100 dark:hover:bg-secondary font-medium text-lg"
          >
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
