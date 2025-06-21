import React, { useState, useEffect, useRef } from "react";
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
  User,
  LogOut,
  Camera,
  Image,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadImage, getBlobStorageStatus } from "@/lib/blob-storage";
import { processImageUpload } from "@/lib/image-metadata";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCameraClick = () => {
    // Open camera directly
    cameraInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Photo must be less than 10MB");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      e.target.value = "";
      return;
    }

    setUploadingPhoto(true);

    try {
      console.log("[BottomNav] Starting photo upload:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Check blob storage configuration
      const storageStatus = getBlobStorageStatus();
      console.log("[BottomNav] Blob storage status:", storageStatus);

      if (!storageStatus.configured) {
        const errorMessage =
          storageStatus.error || "Blob storage is not properly configured";
        console.error("[BottomNav] Blob storage not configured:", errorMessage);
        alert(errorMessage);
        return;
      }

      // Process image metadata (fish identification, location, etc.)
      console.log("[BottomNav] Processing image metadata...");
      const metadata = await processImageUpload(file);
      console.log("[BottomNav] Image metadata processed:", metadata);

      // Upload the photo
      console.log("[BottomNav] Uploading photo to blob storage...");
      const photoUrl = await uploadImage(file);
      console.log("[BottomNav] Photo uploaded successfully:", photoUrl);

      // Dispatch event with the uploaded photo URL and metadata for other components to listen
      window.dispatchEvent(
        new CustomEvent("photoUploaded", {
          detail: {
            photoUrl,
            metadata: {
              ...metadata,
              url: photoUrl,
            },
          },
        }),
      );

      // Show success message with fish info if available
      if (metadata.fishInfo && metadata.fishInfo.name !== "Unknown") {
        alert(`Photo uploaded! Identified: ${metadata.fishInfo.name}`);
      } else {
        alert("Photo uploaded successfully!");
      }
    } catch (err) {
      console.error("[BottomNav] Photo upload error:", err);

      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Failed to upload photo. Please try again.");
      }
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      e.target.value = "";
    }
  };

  return (
    <>
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
          {/* Camera button */}
          <button
            onClick={handleCameraClick}
            disabled={uploadingPhoto}
            className="flex items-center text-gray-500 hover:text-[#0251FB] dark:text-gray-400 dark:hover:text-blue-400 disabled:opacity-50"
          >
            <Camera size={24} />
          </button>
          {/* Weather page only available on mobile */}
          {isMobile && (
            <Link
              to="/weather"
              className={`flex items-center ${currentPath === "/weather" ? "text-[#0251FB] dark:text-blue-400" : "text-gray-500 hover:text-[#0251FB] dark:text-gray-400 dark:hover:text-blue-400"}`}
            >
              <Cloud size={24} />
            </Link>
          )}
          <Link
            to="/menu"
            className={`flex items-center ${currentPath === "/menu" ? "text-[#0251FB] dark:text-blue-400" : "text-gray-500 hover:text-[#0251FB] dark:text-gray-400 dark:hover:text-blue-400"}`}
          >
            <Menu size={24} />
          </Link>
        </div>
      </nav>

      {/* Hidden file inputs for camera and gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="hidden"
        disabled={uploadingPhoto}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="hidden"
        disabled={uploadingPhoto}
      />
    </>
  );
};

export const SideNav: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle cases where component is rendered outside proper context (like in storyboards)
  let location = null;
  let currentPath = "/";
  let user = null;
  let profile = null;
  let loading = false;
  let signOut = null;
  let hasAuthContext = false;
  let hasRouterContext = false;

  try {
    location = useLocation();
    currentPath = location.pathname;
    hasRouterContext = true;
  } catch (error) {
    // Component is rendered outside Router context
    console.warn("SideNav rendered outside Router context");
    hasRouterContext = false;
  }

  try {
    const authContext = useAuth();
    user = authContext.user;
    profile = authContext.profile;
    loading = authContext.loading;
    signOut = authContext.signOut;
    hasAuthContext = true;
  } catch (error) {
    // Component is rendered outside AuthProvider, use default values
    console.warn("SideNav rendered outside AuthProvider context");
    hasAuthContext = false;
  }

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
          {hasRouterContext ? (
            <>
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
            </>
          ) : (
            <>
              <div
                className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
              >
                <Home className={isCollapsed ? "" : "mr-3"} size={20} />
                {!isCollapsed && <span>Home</span>}
              </div>
              <div
                className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
              >
                <Search className={isCollapsed ? "" : "mr-3"} size={20} />
                {!isCollapsed && <span>Search</span>}
              </div>
            </>
          )}
          {/* Weather page removed from desktop sidebar navigation */}
          {/* Menu tab hidden on desktop */}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-auto flex flex-col gap-1 pt-4">
          {hasRouterContext ? (
            <Link
              to="/settings"
              className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
            >
              <Settings className={isCollapsed ? "" : "mr-3"} size={20} />
              {!isCollapsed && <span>Settings</span>}
            </Link>
          ) : (
            <div
              className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
            >
              <Settings className={isCollapsed ? "" : "mr-3"} size={20} />
              {!isCollapsed && <span>Settings</span>}
            </div>
          )}
          <div
            className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
          >
            <HelpCircle className={isCollapsed ? "" : "mr-3"} size={20} />
            {!isCollapsed && <span>Help</span>}
          </div>
          {hasAuthContext && (
            <button
              onClick={async () => {
                try {
                  console.log("[SideNav] Initiating sign out");
                  if (signOut) {
                    await signOut();
                  } else {
                    // Fallback: clear everything and redirect
                    console.log(
                      "[SideNav] No signOut function, using fallback",
                    );
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = "/login";
                  }
                  console.log("[SideNav] Sign out completed");
                } catch (err) {
                  console.error("[SideNav] Sign out error:", err);
                  // Fallback on error: clear everything and redirect
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = "/login";
                }
              }}
              className={`flex items-center py-3 rounded-lg ${isCollapsed ? "justify-center" : "px-4"} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
            >
              <LogOut className={isCollapsed ? "" : "mr-3"} size={20} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          )}
          {hasAuthContext &&
            (loading ? (
              <div
                className={`flex items-center mt-auto rounded-lg ${isCollapsed ? "justify-center py-3" : "px-4 py-3"}`}
              >
                {!isCollapsed ? (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="ml-3">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                )}
              </div>
            ) : user ? (
              hasRouterContext ? (
                <Link
                  to="/profile"
                  className={`flex items-center mt-auto hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${isCollapsed ? "justify-center py-3" : "px-4 py-3"}`}
                >
                  {!isCollapsed ? (
                    <div className="flex items-center">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {profile?.full_name ? (
                            getInitials(profile.full_name)
                          ) : user?.full_name ? (
                            getInitials(user.full_name)
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-medium dark:text-white">
                          {profile?.full_name ||
                            user?.full_name ||
                            "Anonymous Angler"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          View profile
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {profile?.full_name ? (
                          getInitials(profile.full_name)
                        ) : user?.full_name ? (
                          getInitials(user.full_name)
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </Link>
              ) : (
                <div
                  className={`flex items-center mt-auto rounded-lg ${isCollapsed ? "justify-center py-3" : "px-4 py-3"}`}
                >
                  {!isCollapsed ? (
                    <div className="flex items-center">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {profile?.full_name ? (
                            getInitials(profile.full_name)
                          ) : user?.full_name ? (
                            getInitials(user.full_name)
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-medium dark:text-white">
                          {profile?.full_name ||
                            user?.full_name ||
                            "Anonymous Angler"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          View profile
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {profile?.full_name ? (
                          getInitials(profile.full_name)
                        ) : user?.full_name ? (
                          getInitials(user.full_name)
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            ) : (
              <div
                className={`flex items-center mt-auto rounded-lg ${isCollapsed ? "justify-center py-3" : "px-4 py-3"} text-gray-500`}
              >
                {!isCollapsed ? (
                  <div className="flex items-center">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="text-sm font-medium dark:text-white">
                        Not logged in
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Please sign in
                      </p>
                    </div>
                  </div>
                ) : (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default BottomNav;
