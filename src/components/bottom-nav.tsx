import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Cloud,
  Settings,
  HelpCircle,
  ChevronLeft,
  User,
  LogOut,
  Camera,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { log } from "@/lib/logging";
import { ROUTES } from "@/lib/routing";
import { cn } from "@/lib/utils";
import { useStream } from "@/hooks/use-stream";
import PhotoUploadBar, {
  UploadPhotoStreamData,
} from "@/pages/profile/photo-upload-bar";
import { useClassifyPhoto } from "@/hooks/queries";
import GearItemUploadBar from "@/pages/profile/gear-item-upload-bar";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [classifyingImage, setClassifyingImage] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { refreshProfile } = useAuth();

  const classifyPhotoMutation = useClassifyPhoto();

  const [uploadPhotoStreamData, setUploadPhotoStreamData] =
    useState<UploadPhotoStreamData | null>(null);

  const [uploadGearItemStreamData, setUploadGearItemStreamData] =
    useState<UploadPhotoStreamData | null>(null);

  const uploadPhotoStream = useStream({
    path: "user/gallery-photos/stream",
    onData: (chunk) => {
      console.log("[STREAM] Received chunk:", chunk);

      const data = JSON.parse(chunk);
      setUploadPhotoStreamData(data);
    },
    onError: (error) => {
      console.error("[STREAM] Error uploading photo:", error);
    },
    onComplete: () => {
      console.log("[STREAM] Photo uploaded successfully!");

      refreshProfile();

      setTimeout(() => {
        setUploadPhotoStreamData(null);
      }, 3000);
    },
  });

  const uploadGearItemStream = useStream({
    path: "user/gear-items/stream",
    onData: (chunk) => {
      console.log("[STREAM] Received chunk:", chunk);

      const data = JSON.parse(chunk);
      setUploadGearItemStreamData(data);
    },
    onError: (error) => {
      console.error("[STREAM] Error uploading photo:", error);
    },
    onComplete: () => {
      console.log("[STREAM] Photo uploaded successfully!");

      refreshProfile();

      setTimeout(() => {
        setUploadGearItemStreamData(null);
      }, 3000);
    },
  });

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
    if (uploadPhotoStream.isStreaming || uploadGearItemStream.isStreaming) {
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setClassifyingImage(true);
      const classification = await classifyPhotoMutation.mutateAsync(file);

      setClassifyingImage(false);

      if (classification.type === "gear") {
        const formData = new FormData();
        formData.append("file", file);

        uploadGearItemStream.startStream({
          options: {
            method: "POST",
            body: formData,
          },
          isFormData: true,
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);

        uploadPhotoStream.startStream({
          options: {
            method: "POST",
            body: formData,
          },
          isFormData: true,
        });
      }
    } catch (error: any) {
      console.error("❌ [BOTTOMNAV] Smart upload failed:", error);
      alert(error?.message || "Failed to process photo. Please try again.");
      setClassifyingImage(false);
    }

    // Reset file input
    e.target.value = "";
  };

  return (
    <>
      <PhotoUploadBar
        uploadPhotoStreamData={uploadPhotoStreamData}
        className="z-[60] top-[58px] absolute md:hidden"
      />
      <GearItemUploadBar
        className="z-[60] top-[58px] absolute md:hidden"
        uploadGearItemStreamData={uploadGearItemStreamData}
      />
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-50 w-full shadow-md">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className={cn(
              `flex items-center`,
              currentPath === "/"
                ? "text-lishka-blue "
                : "text-[#191B1F] hover:text-lishka-blue",
            )}
          >
            <Home size={24} />
          </Link>
          <Link
            to="/search"
            className={cn(
              `flex items-center`,
              currentPath === "/search"
                ? "text-lishka-blue "
                : "text-[#191B1F] hover:text-lishka-blue",
            )}
          >
            <Search size={24} />
          </Link>
          {/* Camera button */}
          <button
            onClick={handleCameraClick}
            disabled={
              uploadPhotoStream.isStreaming ||
              uploadGearItemStream.isStreaming ||
              classifyingImage
            }
            className="flex items-center text-[#191B1F] hover:text-lishka-blue disabled:opacity-50 relative"
          >
            {classifyingImage ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-lishka-blue border-t-transparent" />
            ) : (
              <Camera size={24} />
            )}
          </button>
          {/* Weather page only available on mobile */}
          {isMobile && (
            <Link
              to="/weather"
              className={cn(
                `flex items-center`,
                currentPath === "/weather"
                  ? "text-lishka-blue "
                  : "text-[#191B1F] hover:text-lishka-blue",
              )}
            >
              <Cloud size={24} />
            </Link>
          )}
          <Link
            to="/profile"
            className={cn(
              `flex items-center`,
              currentPath === "/profile"
                ? "text-lishka-blue "
                : "text-[#191B1F] hover:text-lishka-blue",
            )}
          >
            <User size={24} />
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
        disabled={
          uploadPhotoStream.isStreaming ||
          uploadGearItemStream.isStreaming ||
          classifyingImage
        }
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="hidden"
        disabled={
          uploadPhotoStream.isStreaming ||
          uploadGearItemStream.isStreaming ||
          classifyingImage
        }
      />
    </>
  );
};

export const SideNav: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle cases where component is rendered outside proper context (like in storyboards)
  let currentPath = "/";
  let user = null;
  let profile = null;
  let loading = false;
  let signOut = null;
  let hasAuthContext = false;
  let hasRouterContext = false;
  const location = useLocation();

  try {
    currentPath = location.pathname;
    hasRouterContext = true;
  } catch {
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
  } catch {
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
                className={cn(
                  `flex items-center py-3 rounded-lg`,
                  isCollapsed ? "justify-center" : "px-4",
                  currentPath === "/"
                    ? "bg-[#E6EFFF] text-lishka-blue  "
                    : "text-[#191B1F] hover:bg-gray-100 ",
                )}
              >
                <Home className={isCollapsed ? "" : "mr-3"} size={20} />
                {!isCollapsed && <span>Home</span>}
              </Link>
              <Link
                to="/search"
                className={cn(
                  `flex items-center py-3 rounded-lg`,
                  isCollapsed ? "justify-center" : "px-4",
                  currentPath.includes("/search")
                    ? "bg-[#E6EFFF] text-lishka-blue "
                    : "text-[#191B1F] hover:bg-gray-100 ",
                )}
              >
                <Search className={isCollapsed ? "" : "mr-3"} size={20} />
                {!isCollapsed && <span>Search</span>}
              </Link>
            </>
          ) : (
            <>
              <div
                className={cn(
                  `flex items-center py-3 rounded-lg text-[#191B1F] hover:bg-gray-100 `,
                  isCollapsed ? "justify-center" : "px-4",
                )}
              >
                <Home className={isCollapsed ? "" : "mr-3"} size={20} />
                {!isCollapsed && <span>Home</span>}
              </div>
              <div
                className={cn(
                  `flex items-center py-3 rounded-lg text-[#191B1F] hover:bg-gray-100 `,
                  isCollapsed ? "justify-center" : "px-4",
                )}
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
              className={cn(
                `flex items-center py-3 rounded-lg`,
                isCollapsed ? "justify-center" : "px-4",
                currentPath === "/settings"
                  ? "bg-[#E6EFFF] text-lishka-blue  "
                  : "text-[#191B1F] hover:bg-gray-100 ",
              )}
            >
              <Settings className={isCollapsed ? "" : "mr-3"} size={20} />
              {!isCollapsed && <span>Settings</span>}
            </Link>
          ) : (
            <div
              className={cn(
                `flex items-center py-3 rounded-lg`,
                isCollapsed ? "justify-center" : "px-4",
                currentPath === "/settings"
                  ? "bg-[#E6EFFF] text-lishka-blue  "
                  : "text-[#191B1F] hover:bg-gray-100 ",
              )}
            >
              <Settings className={isCollapsed ? "" : "mr-3"} size={20} />
              {!isCollapsed && <span>Settings</span>}
            </div>
          )}
          <div
            className={cn(
              `flex items-center py-3 rounded-lg`,
              isCollapsed ? "justify-center" : "px-4",
              currentPath === "/help"
                ? "bg-[#E6EFFF] text-lishka-blue  "
                : "text-[#191B1F] hover:bg-gray-100 ",
            )}
          >
            <HelpCircle className={isCollapsed ? "" : "mr-3"} size={20} />
            {!isCollapsed && <span>Help</span>}
          </div>
          {hasAuthContext && (
            <button
              onClick={async () => {
                try {
                  log("[SideNav] Initiating sign out");
                  if (signOut) {
                    await signOut();
                  } else {
                    // Fallback: clear everything and redirect
                    log("[SideNav] No signOut function, using fallback");
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = ROUTES.LOGIN;
                  }
                  log("[SideNav] Sign out completed");
                } catch (err) {
                  console.error("[SideNav] Sign out error:", err);
                  // Fallback on error: clear everything and redirect
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = ROUTES.LOGIN;
                }
              }}
              className={cn(
                `flex items-center py-3 rounded-lg text-[#191B1F] hover:bg-gray-100 `,
                isCollapsed ? "justify-center" : "px-4",
              )}
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
