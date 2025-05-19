import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Cloud,
  Menu,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-50 w-full shadow-md">
      <div className="flex justify-around items-center h-16">
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update CSS variable when sidebar state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "4rem" : "16rem",
    );
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-10 w-full">
        <BottomNav />
      </div>

      {/* Desktop Side Nav */}
      <div
        className={`hidden lg:flex lg:flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed left-0 top-0 z-50 ${isCollapsed ? "w-16 px-2 py-4 cursor-pointer" : "w-64 p-4"}`}
        onClick={isCollapsed ? toggleSidebar : undefined}
      >
        <div
          className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} h-16`}
        >
          <div
            className={`flex items-center gap-2 ${isCollapsed ? "justify-center w-full" : ""}`}
          >
            <Link to="/">
              {isCollapsed ? (
                <img
                  src="https://ghep9tkuzzpsmczw.public.blob.vercel-storage.com/brand-assets/lishka-logo-icon.svg"
                  alt="Lishka Logo"
                  className="h-8 shrink-0 grow-0"
                />
              ) : (
                <div className="animate-fadeIn">
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
                </div>
              )}
            </Link>
          </div>
          {!isCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1 mt-4">
          <Link
            to="/"
            className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} ${currentPath === "/" ? "bg-blue-50 text-[#0251FB] dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
          >
            <Home className={isCollapsed ? "" : "mr-3"} size={20} />
            {!isCollapsed && <span>Home</span>}
          </Link>
          <Link
            to="/search"
            className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} ${currentPath === "/search" ? "bg-blue-50 text-[#0251FB] dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
          >
            <Search className={isCollapsed ? "" : "mr-3"} size={20} />
            {!isCollapsed && <span>Search</span>}
          </Link>
          <Link
            to="/weather"
            className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} ${currentPath === "/weather" ? "bg-blue-50 text-[#0251FB] dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
          >
            <Cloud className={isCollapsed ? "" : "mr-3"} size={20} />
            {!isCollapsed && <span>Weather</span>}
          </Link>
          {/* Menu tab hidden on desktop */}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-auto flex flex-col gap-1 pt-4">
          <Link
            to="/settings"
            className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
          >
            <Settings className={isCollapsed ? "" : "mr-3"} size={20} />
            {!isCollapsed && <span>Settings</span>}
          </Link>
          <Link
            to="/help"
            className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
          >
            <HelpCircle className={isCollapsed ? "" : "mr-3"} size={20} />
            {!isCollapsed && <span>Help</span>}
          </Link>
          <div
            className={`flex items-center mt-auto ${isCollapsed ? "justify-center py-3" : "px-4 py-3"}`}
          >
            {!isCollapsed ? (
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
            ) : (
              <img
                src="https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746801732510-image.png"
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomNav;
