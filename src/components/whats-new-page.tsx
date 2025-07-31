import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Sparkles, Bell, Zap, Instagram } from "lucide-react";
import BottomNav from "./bottom-nav";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const WhatsNewPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-[#F7F7F7]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white p-4 w-full">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-2">What's New</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-20 h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full">
          <div className="space-y-6 w-full">
            {/* Coming Soon Hero Card */}
            <Card className="bg-white border-gray-200">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-500 p-3 rounded-full">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Coming Soon!
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Get ready for something amazing! This is where you'll discover
                  all the latest features we've launched and exciting updates on
                  the horizon.
                </p>
              </CardContent>
            </Card>

            {/* Feature Preview Cards */}
            <div className="grid gap-4">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Latest Features
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Stay updated with the newest additions to Lishka that
                        enhance your fishing experience.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Upcoming Features
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Get a sneak peek at the exciting features we're working
                        on to make your fishing adventures even better.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stay Tuned Message */}
            <Card className="bg-white border-2 border-dashed border-gray-300">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Stay Tuned, Angler! 🎣
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  We're constantly working on new ways to improve your fishing
                  experience. Check back regularly to see what's new and what's
                  coming next!
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  Have a feature idea? Feel free to reach out to us on
                  Instagram!
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.open("https://instagram.com", "_blank")}
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  DM on Instagram
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default WhatsNewPage;
