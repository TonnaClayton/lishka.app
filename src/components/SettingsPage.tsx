import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Ruler,
  Fish,
  MapPin,
  Anchor,
} from "lucide-react";

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
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import ThemeToggle from "./ThemeToggle";
import BottomNav from "./BottomNav";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [useImperialUnits, setUseImperialUnits] = useState<boolean>(false);
  const [showDebugUI, setShowDebugUI] = useState<boolean>(false);
  const [showToxicFishDebug, setShowToxicFishDebug] = useState<boolean>(false);
  const [showLocationDebug, setShowLocationDebug] = useState<boolean>(false);
  const [showOffshoreFishingDebug, setShowOffshoreFishingDebug] =
    useState<boolean>(false);
  const [showOpenAIDataDebug, setShowOpenAIDataDebug] =
    useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<{
    connected: boolean;
    model: string;
  }>({ connected: false, model: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: number } | null>(
    null,
  );

  // Get stored language and units preferences from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    } else {
      // Default to Spanish if no language is set
      setSelectedLanguage("es");
      localStorage.setItem("preferredLanguage", "es");
    }

    // Get units preference (default to metric/false if not set)
    const unitsPreference = localStorage.getItem("useImperialUnits");
    if (unitsPreference !== null) {
      setUseImperialUnits(unitsPreference === "true");
    } else {
      // Default to metric units (cm and grams)
      localStorage.setItem("useImperialUnits", "false");
    }

    // Get debug UI preference (default to false if not set)
    const debugUIPreference = localStorage.getItem("showDebugUI");
    if (debugUIPreference !== null) {
      setShowDebugUI(debugUIPreference === "true");
    } else {
      // Default to hide debug UI
      localStorage.setItem("showDebugUI", "false");
    }

    // Get toxic fish debug preference
    const toxicFishDebugPreference = localStorage.getItem("showToxicFishDebug");
    if (toxicFishDebugPreference !== null) {
      setShowToxicFishDebug(toxicFishDebugPreference === "true");
    } else {
      localStorage.setItem("showToxicFishDebug", "false");
    }

    // Get location debug preference
    const locationDebugPreference = localStorage.getItem("showLocationDebug");
    if (locationDebugPreference !== null) {
      setShowLocationDebug(locationDebugPreference === "true");
    } else {
      localStorage.setItem("showLocationDebug", "false");
    }

    // Get offshore fishing debug preference
    const offshoreFishingDebugPreference = localStorage.getItem(
      "showOffshoreFishingDebug",
    );
    if (offshoreFishingDebugPreference !== null) {
      setShowOffshoreFishingDebug(offshoreFishingDebugPreference === "true");
    } else {
      localStorage.setItem("showOffshoreFishingDebug", "false");
    }

    // Get OpenAI data debug preference
    const openAIDataDebugPreference = localStorage.getItem(
      "showOpenAIDataDebug",
    );
    if (openAIDataDebugPreference !== null) {
      setShowOpenAIDataDebug(openAIDataDebugPreference === "true");
    } else {
      localStorage.setItem("showOpenAIDataDebug", "false");
    }
  }, []);

  const handleLanguageChange = (value: string) => {
    console.log(`Changing language to: ${value}`);
    setSelectedLanguage(value);
    localStorage.setItem("preferredLanguage", value);

    // Dispatch a custom event to notify other components about the language change
    window.dispatchEvent(new Event("languageChanged"));

    // Force immediate refresh by reloading the page
    // This ensures all components pick up the new language setting
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const handleUnitsChange = (checked: boolean) => {
    console.log(`Changing units to: ${checked ? "imperial" : "metric"}`);
    setUseImperialUnits(checked);
    localStorage.setItem("useImperialUnits", checked.toString());

    // Dispatch a custom event to notify other components about the units change
    window.dispatchEvent(new Event("unitsChanged"));
  };

  const handleDebugUIChange = (checked: boolean) => {
    console.log(`Changing debug UI to: ${checked ? "enabled" : "disabled"}`);
    setShowDebugUI(checked);
    localStorage.setItem("showDebugUI", checked.toString());

    // Dispatch a custom event to notify other components about the debug UI change
    window.dispatchEvent(new Event("debugUIChanged"));
  };

  const handleToxicFishDebugChange = (checked: boolean) => {
    console.log(
      `Changing toxic fish debug to: ${checked ? "enabled" : "disabled"}`,
    );
    setShowToxicFishDebug(checked);
    localStorage.setItem("showToxicFishDebug", checked.toString());
    window.dispatchEvent(new Event("toxicFishDebugChanged"));
  };

  const handleLocationDebugChange = (checked: boolean) => {
    console.log(
      `Changing location debug to: ${checked ? "enabled" : "disabled"}`,
    );
    setShowLocationDebug(checked);
    localStorage.setItem("showLocationDebug", checked.toString());
    window.dispatchEvent(new Event("locationDebugChanged"));
  };

  const handleOffshoreFishingDebugChange = (checked: boolean) => {
    console.log(
      `Changing offshore fishing debug to: ${checked ? "enabled" : "disabled"}`,
    );
    setShowOffshoreFishingDebug(checked);
    localStorage.setItem("showOffshoreFishingDebug", checked.toString());
    window.dispatchEvent(new Event("offshoreFishingDebugChanged"));
  };

  const handleOpenAIDataDebugChange = (checked: boolean) => {
    console.log(
      `Changing OpenAI data debug to: ${checked ? "enabled" : "disabled"}`,
    );
    setShowOpenAIDataDebug(checked);
    localStorage.setItem("showOpenAIDataDebug", checked.toString());
    window.dispatchEvent(new Event("openAIDataDebugChanged"));
  };

  // Function to clear all fish data cache
  const clearFishDataCache = () => {
    console.log("Clearing all fish data cache");
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("fish_data_") ||
          key.startsWith("fish_details_") ||
          key.startsWith("fish_local_name_") ||
          key.startsWith("fishing_tips_") ||
          key.includes("image_cache_") ||
          key.includes("_image") ||
          key.includes("api_response_cache_"))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      console.log("Removing cached data for key:", key);
      localStorage.removeItem(key);
    });

    // Show message
    alert(
      `Cache cleared! ${keysToRemove.length} items removed. The app will now reload.`,
    );
    window.location.reload();

    return keysToRemove.length; // Return number of cache entries cleared
  };

  // Function to check OpenAI API status
  const checkOpenAIStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      // Import OpenAI toggle
      const { OPENAI_ENABLED, OPENAI_DISABLED_MESSAGE } = await import(
        "@/lib/openai-toggle"
      );

      // Check if OpenAI is disabled
      if (!OPENAI_ENABLED) {
        throw {
          message: OPENAI_DISABLED_MESSAGE,
          code: 503,
        };
      }

      // Check if API key is available
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw {
          message:
            "OpenAI API key is missing. Please add it in project settings.",
          code: 401,
        };
      }

      // Make a simple request to OpenAI API
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
            "OpenAI-Beta": "assistants=v1",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content:
                  "Hello, this is a test message to check if the API is working.",
              },
            ],
            max_tokens: 10,
          }),
        },
      );

      if (!response.ok) {
        throw {
          message: `OpenAI API error: ${response.status}`,
          code: response.status,
        };
      }

      const data = await response.json();
      setApiStatus({
        connected: true,
        model: data.model || "gpt-3.5-turbo",
      });
      setError(null);
      alert("OpenAI API is working correctly!");
    } catch (err) {
      console.error("Error checking OpenAI API:", err);
      setApiStatus({
        connected: false,
        model: "",
      });
      setError({
        message: err.message || "Failed to connect to OpenAI API",
        code: err.code || 500,
      });
      alert(`OpenAI API Error: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white p-4 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2">Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full pb-20 lg:pb-4">
        <div className="space-y-6 w-full">
          {/* Language Settings */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Language</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">App Language</span>
                </div>
                <Select
                  value={selectedLanguage}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Units Settings */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Measurements</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Ruler className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">
                    Select your preferred measurement system
                  </span>
                </div>
                <div className="flex w-[180px] h-10 bg-gray-100 rounded-full p-1 relative overflow-hidden">
                  <div
                    className="absolute rounded-full bg-black z-0 top-1 h-[calc(100%-8px)] transition-all duration-300 ease-in-out"
                    style={{
                      width: "calc(50% - 8px)",
                      left: useImperialUnits ? "4px" : "calc(50% + 4px)",
                    }}
                  />
                  <button
                    className={`flex-1 rounded-full flex items-center justify-center text-sm font-medium z-10 relative transition-colors duration-300 ${useImperialUnits ? "text-white" : "text-gray-500"}`}
                    onClick={() => handleUnitsChange(true)}
                  >
                    in/oz
                  </button>
                  <button
                    className={`flex-1 rounded-full flex items-center justify-center text-sm font-medium z-10 relative transition-colors duration-300 ${!useImperialUnits ? "text-white" : "text-gray-500"}`}
                    onClick={() => handleUnitsChange(false)}
                  >
                    cm/gr
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Debug UI Settings */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Developer Options</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-gray-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Show Debug Information
                      </span>
                      <span className="text-xs text-gray-500">
                        Display technical details in fish pages
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={showDebugUI}
                    onCheckedChange={handleDebugUIChange}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Fish className="h-5 w-5 mr-2 text-gray-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Show Toxic Fish Debug Info
                      </span>
                      <span className="text-xs text-gray-500">
                        Display toxic fish data details
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={showToxicFishDebug}
                    onCheckedChange={handleToxicFishDebugChange}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-gray-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Show Location Coordinates
                      </span>
                      <span className="text-xs text-gray-500">
                        Display user and fishing spot coordinates
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={showLocationDebug}
                    onCheckedChange={handleLocationDebugChange}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Anchor className="h-5 w-5 mr-2 text-gray-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Show Offshore Fishing Debug
                      </span>
                      <span className="text-xs text-gray-500">
                        Display raw API data for offshore fishing locations
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={showOffshoreFishingDebug}
                    onCheckedChange={handleOffshoreFishingDebugChange}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-gray-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Show OpenAI Data Debug
                      </span>
                      <span className="text-xs text-gray-500">
                        Display data being sent to OpenAI for analysis
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={showOpenAIDataDebug}
                    onCheckedChange={handleOpenAIDataDebugChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* API and Cache Section */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">API & Cache Settings</h2>
            <div className="bg-white rounded-lg shadow p-4">
              {/* API Status */}
              {apiStatus.connected && (
                <Alert variant="success" className="mb-4">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertTitle>Connected to OpenAI</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="text-gray-700">
                        Using model: {apiStatus.model}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error {error.code}</AlertTitle>
                  <AlertDescription className="text-gray-700">
                    {error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Check API connection and manage cache settings.
                </p>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={checkOpenAIStatus}
                    disabled={loading}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    {loading ? "Checking API..." : "Check OpenAI API Status"}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-red-500"
                    onClick={clearFishDataCache}
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    Clear Fish Data Cache
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold dark:text-white">About</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Lishka Fishing App v1.0.0</p>
              <p className="text-xs text-gray-500 mt-2">
                Powered by OpenAI and Fishbase
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
      <div className="hidden lg:block lg:h-16"></div>
    </div>
  );
};

export default SettingsPage;
