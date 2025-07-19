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
import { processImageUpload, ImageMetadata } from "@/lib/image-metadata";
import {
  classifyImage,
  ClassificationResult,
} from "@/lib/image-classification-service";
import { uploadGearImage } from "@/lib/gear-upload-service";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [classifyingImage, setClassifyingImage] = useState(false);
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

    console.log(
      `🔍 [BOTTOMNAV SMART UPLOAD] Photo capture started from bottomnav:`,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileSizeInMB: (file.size / (1024 * 1024)).toFixed(2),
        lastModified: new Date(file.lastModified).toISOString(),
        source: "bottomnav",
        isFromCamera: e.target === cameraInputRef.current,
        isFromGallery: e.target === galleryInputRef.current,
      },
    );

    setUploadingPhoto(true);
    setClassifyingImage(true);

    try {
      // Step 1: Classify the image
      console.log("🤖 [BOTTOMNAV] Classifying image...");
      const classification = await classifyImage(file);

      console.log("🎯 [BOTTOMNAV] Classification result:", classification);
      setClassifyingImage(false);

      // Step 2: Route based on classification
      if (classification.type === "fish") {
        console.log(
          "🐟 [BOTTOMNAV] Detected fish - using photo upload service",
        );

        // Register callbacks for UI feedback
        const callbackId = `bottomnav-fish-${Date.now()}`;
        const { photoUploadService } = await import(
          "@/lib/photo-upload-service"
        );

        photoUploadService.registerCallbacks(callbackId, {
          onStart: () => {
            console.log("🔍 [BOTTOMNAV] Fish upload started");
          },
          onProgress: (message: string) => {
            console.log(`🔍 [BOTTOMNAV] Fish upload progress: ${message}`);
          },
          onSuccess: (result) => {
            console.log("🔍 [BOTTOMNAV] Fish upload successful:", result);

            // Trigger a custom event to notify other components about the new photo
            console.log("🔍 [BOTTOMNAV] Dispatching photoUploaded event:", {
              metadata: result.metadata,
              photoUrl: result.photoUrl || result.url,
              source: "bottomnav",
              type: "fish",
              hasFishInfo: !!result.metadata?.fishInfo,
              fishName: result.metadata?.fishInfo?.name,
            });

            window.dispatchEvent(
              new CustomEvent("photoUploaded", {
                detail: {
                  photoUrl: result.photoUrl || result.url,
                  metadata: result.metadata,
                  source: "bottomnav",
                  type: "fish",
                },
              }),
            );

            // Show success message with fish info if available
            let successMsg = "Fish photo uploaded!";
            const fishInfo = result.metadata?.fishInfo;
            if (
              fishInfo &&
              (fishInfo.name !== "Unknown" ||
                fishInfo.estimatedSize !== "Unknown" ||
                fishInfo.estimatedWeight !== "Unknown")
            ) {
              if (fishInfo.name !== "Unknown") {
                successMsg += ` Identified: ${fishInfo.name}`;
                if (fishInfo.confidence > 0) {
                  successMsg += ` (${Math.round(fishInfo.confidence * 100)}% confident)`;
                }
              } else {
                successMsg += " Fish data detected!";
              }
            }

            alert(successMsg);
          },
          onError: (error: string) => {
            console.error("🔍 [BOTTOMNAV] Fish upload error:", error);
            alert(`Fish upload error: ${error}`);
          },
          onComplete: () => {
            console.log("🔍 [BOTTOMNAV] Fish upload process completed");
            setUploadingPhoto(false);
            photoUploadService.unregisterCallbacks(callbackId);
          },
        });

        // Use the unified PhotoUploadService for fish
        await photoUploadService.uploadPhoto(file, "bottomnav");
      } else if (classification.type === "gear") {
        console.log("🎣 [BOTTOMNAV] Detected gear - using gear upload service");

        // Use gear upload service
        const gearResult = await uploadGearImage(file);

        if (gearResult.success) {
          console.log("✅ [BOTTOMNAV] Gear upload successful:", gearResult);

          // Trigger a custom event to notify other components about the new gear
          window.dispatchEvent(
            new CustomEvent("gearUploaded", {
              detail: {
                metadata: gearResult.metadata,
                source: "bottomnav",
                type: "gear",
              },
            }),
          );

          // Show success message with gear info if available
          let successMsg = "Gear photo uploaded!";
          const gearInfo = gearResult.metadata?.gearInfo;
          if (gearInfo && gearInfo.name !== "Unknown Gear") {
            successMsg += ` Identified: ${gearInfo.name}`;
            if (gearInfo.confidence > 0) {
              successMsg += ` (${Math.round(gearInfo.confidence * 100)}% confident)`;
            }
          }

          alert(successMsg);
        } else {
          console.error("❌ [BOTTOMNAV] Gear upload failed:", gearResult.error);
          alert(`Gear upload error: ${gearResult.error}`);
        }

        setUploadingPhoto(false);
      } else {
        console.log(
          "❓ [BOTTOMNAV] Unknown content - using default photo upload",
        );

        // Fallback to regular photo upload for unknown content
        const callbackId = `bottomnav-unknown-${Date.now()}`;
        const { photoUploadService } = await import(
          "@/lib/photo-upload-service"
        );

        photoUploadService.registerCallbacks(callbackId, {
          onStart: () => {
            console.log("🔍 [BOTTOMNAV] Unknown upload started");
          },
          onProgress: (message: string) => {
            console.log(`🔍 [BOTTOMNAV] Unknown upload progress: ${message}`);
          },
          onSuccess: (result) => {
            console.log("🔍 [BOTTOMNAV] Unknown upload successful:", result);

            // Trigger a custom event
            console.log(
              "🔍 [BOTTOMNAV] Dispatching photoUploaded event (unknown):",
              {
                metadata: result.metadata,
                photoUrl: result.photoUrl || result.url,
                source: "bottomnav",
                type: "unknown",
                hasFishInfo: !!result.metadata?.fishInfo,
                fishName: result.metadata?.fishInfo?.name,
              },
            );

            window.dispatchEvent(
              new CustomEvent("photoUploaded", {
                detail: {
                  photoUrl: result.photoUrl || result.url,
                  metadata: result.metadata,
                  source: "bottomnav",
                  type: "unknown",
                },
              }),
            );

            alert("Photo uploaded successfully!");
          },
          onError: (error: string) => {
            console.error("🔍 [BOTTOMNAV] Unknown upload error:", error);
            alert(`Upload error: ${error}`);
          },
          onComplete: () => {
            console.log("🔍 [BOTTOMNAV] Unknown upload process completed");
            setUploadingPhoto(false);
            photoUploadService.unregisterCallbacks(callbackId);
          },
        });

        await photoUploadService.uploadPhoto(file, "bottomnav");
      }
    } catch (error: any) {
      console.error("❌ [BOTTOMNAV] Smart upload failed:", error);
      alert(error?.message || "Failed to process photo. Please try again.");
      setUploadingPhoto(false);
      setClassifyingImage(false);
    }

    // Reset file input
    e.target.value = "";
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
            disabled={uploadingPhoto || classifyingImage}
            className="flex items-center text-gray-500 hover:text-[#0251FB] dark:text-gray-400 dark:hover:text-blue-400 disabled:opacity-50 relative"
          >
            {classifyingImage ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0251FB] border-t-transparent" />
            ) : (
              <Camera size={24} />
            )}
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
            to="/profile"
            className={`flex items-center ${currentPath === "/profile" ? "text-[#0251FB] dark:text-blue-400" : "text-gray-500 hover:text-[#0251FB] dark:text-gray-400 dark:hover:text-blue-400"}`}
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
        disabled={uploadingPhoto || classifyingImage}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="hidden"
        disabled={uploadingPhoto || classifyingImage}
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
