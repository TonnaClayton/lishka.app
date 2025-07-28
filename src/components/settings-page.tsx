import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Ruler, LogOut, Trash2 } from "lucide-react";

import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { log } from "@/lib/logging";

import BottomNav from "./bottom-nav";
import { useAuth } from "@/contexts/auth-context";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, deleteAccount } = useAuth();
  const [useImperialUnits, setUseImperialUnits] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    log(`Changing units to: ${checked ? "imperial" : "metric"}`);
    setUseImperialUnits(checked);
    localStorage.setItem("useImperialUnits", checked.toString());

    // Dispatch a custom event to notify other components about the units change
    window.dispatchEvent(new Event("unitsChanged"));
  };

  const handleSignOut = async () => {
    try {
      log("[SettingsPage] Initiating sign out");
      await signOut();
      log("[SettingsPage] Sign out completed");
    } catch (err) {
      console.error("[SettingsPage] Sign out error:", err);
      // Force redirect even if signOut fails
      navigate("/login", { replace: true });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      log("[SettingsPage] Initiating account deletion");
      const { error } = await deleteAccount();

      if (error) {
        console.error("[SettingsPage] Account deletion error:", error);
        alert("Failed to delete account. Please try again or contact support.");
      }
    } catch (err) {
      console.error("[SettingsPage] Account deletion error:", err);
      alert("Failed to delete account. Please try again or contact support.");
    } finally {
      setIsDeleting(false);
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

          {/* Account Section */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="bg-white rounded-lg shadow p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-left text-black hover:bg-gray-50 hover:text-black"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </Button>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-lg shadow-lg p-8 z-50">
                  <AlertDialogHeader>
                    <div className="flex justify-center mb-4">
                      <img
                        src="/logo.svg"
                        alt="Lishka Logo"
                        className="h-8 w-auto"
                      />
                    </div>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete your account? This action
                      cannot be undone and you will lose:
                      <br />
                      <br />
                      • All your profile information
                      <br />
                      • Your fishing gear collection
                      <br />
                      • Your photo gallery
                      <br />
                      • All saved preferences and settings
                      <br />
                      • Your fishing history and data
                      <br />
                      <br />
                      This action is permanent and cannot be reversed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-3">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
