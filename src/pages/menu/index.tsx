import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Instagram } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MenuPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-[#F7F7F7]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white p-4 w-full">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Menu</h1>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 p-4 mx-auto pb-20 h-full w-full pl-4 pr-4">
        <div className="space-y-4 w-full">
          {/* Plan Section */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4">
              Plan
            </h2>
            <div className="bg-white rounded-lg">
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-4 h-auto hover:bg-transparent rounded-lg"
                onClick={() => navigate("/account-status")}
              >
                <span className="font-medium">Current Plan</span>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-600"
                >
                  Beta
                </Badge>
              </Button>
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4">
              Support
            </h2>
            <div className="bg-white rounded-lg divide-y divide-[#E8E8E9]">
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-4 h-auto hover:bg-transparent rounded-t-lg rounded-b-none"
                onClick={() => navigate("/faq")}
              >
                <span className="font-medium">FAQs</span>
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-4 h-auto hover:bg-transparent rounded-none rounded-b-lg"
                onClick={() =>
                  window.open("https://www.instagram.com/lishka.app/", "_blank")
                }
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Contact Us</span>
                </div>
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Legal Section */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4">
              Legal
            </h2>
            <div className="bg-white rounded-lg divide-y divide-[#E8E8E9]">
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-4 h-auto hover:bg-transparent rounded-t-lg rounded-b-none"
                onClick={() => window.open("/terms", "_blank")}
              >
                <span className="font-medium">Terms</span>
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-4 h-auto hover:bg-transparent rounded-none rounded-b-lg"
                onClick={() => window.open("/privacy-policy", "_blank")}
              >
                <span className="font-medium">Privacy Policy</span>
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>

          {/* App Details Section */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4">
              App Details
            </h2>
            <div className="bg-white rounded-lg divide-y divide-[#E8E8E9]">
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-4 h-auto hover:bg-transparent rounded-t-lg rounded-b-none"
                onClick={() => navigate("/settings")}
              >
                <span className="font-medium">Settings</span>
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-4 h-auto hover:bg-transparent rounded-none"
                onClick={() => navigate("/gear-database-debug")}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">App Version</span>
                  <span className="text-gray-500">1.0.0</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-4 h-auto hover:bg-transparent rounded-none rounded-b-lg"
                onClick={() => navigate("/whats-new")}
              >
                <span className="font-medium">What's New</span>
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
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

export default MenuPage;
