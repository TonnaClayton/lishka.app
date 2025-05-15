import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Cloud,
  Menu,
  User,
  LogOut,
  Settings,
  HelpCircle,
} from "lucide-react";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 z-50">
      <div className="flex justify-around items-center">
        <Link
          to="/"
          className={`flex items-center ${currentPath === "/" ? "text-[#0251FB] dark:text-blue-400" : "text-gray-500 hover:text-[#0251FB] dark:text-gray-400 dark:hover:text-blue-400"}`}
        >
          <Home size={24} />
        </Link>
        <Link
          to="/search"
          className={`flex items-center ${currentPath === "/search" ? "text-[#0251FB] dark:text-blue-400" : "text-gray-500 hover:text-[#0251FB] dark:text-gray-400 dark:hover:text-blue-400"}`}
        >
          <Search size={24} />
        </Link>
        <Link
          to="/weather"
          className={`flex items-center ${currentPath === "/weather" ? "text-[#0251FB] dark:text-blue-400" : "text-gray-500 hover:text-[#0251FB] dark:text-gray-400 dark:hover:text-blue-400"}`}
        >
          <Cloud size={24} />
        </Link>
        <Link
          to="/menu"
          className={`flex items-center ${currentPath === "/menu" ? "text-[#0251FB] dark:text-blue-400" : "text-gray-500 hover:text-[#0251FB] dark:text-gray-400 dark:hover:text-blue-400"}`}
        >
          <Menu size={24} />
        </Link>
      </div>
    </nav>
  );
};

export const SideNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="hidden lg:flex flex-col h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 fixed left-0 top-0 z-50">
      <div className="flex items-center mb-8 px-2">
        <div className="flex items-center gap-2">
          <Link to="/">
            <img
              src="/logo-dark.svg"
              alt="Fishing AI Logo"
              className="h-8 shrink-0 grow-0 hidden dark:block"
            />
            <img
              src="/logo-light.svg"
              alt="Fishing AI Logo"
              className="h-8 shrink-0 grow-0 dark:hidden"
            />
          </Link>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <Link
          to="/"
          className={`flex items-center px-4 py-3 rounded-lg ${currentPath === "/" ? "bg-blue-50 text-[#0251FB] dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
        >
          <Home className="mr-3" size={20} />
          <span>Home</span>
        </Link>
        <Link
          to="/search"
          className={`flex items-center px-4 py-3 rounded-lg ${currentPath === "/search" ? "bg-blue-50 text-[#0251FB] dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
        >
          <Search className="mr-3" size={20} />
          <span>Search</span>
        </Link>
        <Link
          to="/weather"
          className={`flex items-center px-4 py-3 rounded-lg ${currentPath === "/weather" ? "bg-blue-50 text-[#0251FB] dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
        >
          <Cloud className="mr-3" size={20} />
          <span>Weather</span>
        </Link>
        {/* Menu tab hidden on desktop */}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 space-y-1">
        <Link
          to="/settings"
          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Settings className="mr-3" size={20} />
          <span>Settings</span>
        </Link>
        <Link
          to="/help"
          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <HelpCircle className="mr-3" size={20} />
          <span>Help</span>
        </Link>
        <div className="flex items-center px-4 py-3 mt-auto">
          <div className="flex items-center">
            <img
              src="https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746801732510-image.png"
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="ml-3">
              <p className="text-sm font-medium dark:text-white">User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                View profile
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
