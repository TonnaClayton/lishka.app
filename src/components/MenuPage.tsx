import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, ChevronLeft, Home, Search, Cloud, Menu } from "lucide-react";
import BottomNav from "./BottomNav";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

interface MenuPageProps {
  onLanguageChange?: (languageCode: string) => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ onLanguageChange = () => {} }) => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  // Get stored language preference and night mode from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    } else {
      // Default to Spanish if no language is set
      setSelectedLanguage("es");
      localStorage.setItem("preferredLanguage", "es");
    }
  }, []);

  const handleLanguageChange = (value: string) => {
    console.log(`Changing language to: ${value}`);
    setSelectedLanguage(value);
    localStorage.setItem("preferredLanguage", value);
    onLanguageChange(value);

    // Dispatch a custom event to notify other components about the language change
    window.dispatchEvent(new Event("languageChanged"));

    // Force immediate refresh by reloading the page
    // This ensures all components pick up the new language setting
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-card p-4 w-full">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-2 dark:text-white">Menu</h1>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="space-y-6">
          {/* Navigation Links */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold dark:text-white">
              Navigation
            </h2>
            <div className="bg-white dark:bg-card rounded-lg shadow p-4 space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start text-left dark:text-gray-200 dark:hover:text-white"
                onClick={() => navigate("/")}
              >
                <Home className="mr-2 h-5 w-5" />
                Home
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left dark:text-gray-200 dark:hover:text-white"
                onClick={() => navigate("/search")}
              >
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left dark:text-gray-200 dark:hover:text-white"
                onClick={() => navigate("/weather")}
              >
                <Cloud className="mr-2 h-5 w-5" />
                Weather
              </Button>
            </div>
          </div>

          <Separator />

          {/* App Settings */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold dark:text-white">
              App Settings
            </h2>
            <div className="bg-white dark:bg-card rounded-lg shadow p-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Configure your fishing preferences here.
                </p>
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold dark:text-white">About</h2>
            <div className="bg-white dark:bg-card rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Lishka Fishing App v1.0.0
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Powered by OpenAI and Fishbase
              </p>
            </div>
          </div>
        </div>
      </main>
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MenuPage;
