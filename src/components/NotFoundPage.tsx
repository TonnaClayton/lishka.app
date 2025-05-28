import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Fish, Home, ArrowLeft } from "lucide-react";
import BottomNav from "./BottomNav";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-2 dark:text-white">
            Page Not Found
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mx-auto w-24 h-24 flex items-center justify-center">
            <Fish className="h-12 w-12 text-gray-500 dark:text-gray-400" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Oops! This fish got away
          </h2>

          <p className="text-gray-600 dark:text-gray-300">
            The page you're looking for seems to have swum off to deeper waters.
          </p>

          <div className="pt-6 space-y-3">
            <Button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Return to Home
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default NotFoundPage;
