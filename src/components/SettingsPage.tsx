import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Ruler } from "lucide-react";

import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

import BottomNav from "./BottomNav";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [useImperialUnits, setUseImperialUnits] = useState<boolean>(false);

  // Get units preference from localStorage
  useEffect(() => {
    // Get units preference (default to metric/false if not set)
    const unitsPreference = localStorage.getItem("useImperialUnits");
    if (unitsPreference !== null) {
      setUseImperialUnits(unitsPreference === "true");
    } else {
      // Default to metric units (cm and grams)
      localStorage.setItem("useImperialUnits", "false");
    }
  }, []);

  const handleUnitsChange = (checked: boolean) => {
    console.log(`Changing units to: ${checked ? "imperial" : "metric"}`);
    setUseImperialUnits(checked);
    localStorage.setItem("useImperialUnits", checked.toString());

    // Dispatch a custom event to notify other components about the units change
    window.dispatchEvent(new Event("unitsChanged"));
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full pb-20 lg:pb-4">
        <div className="space-y-6 w-full">
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
