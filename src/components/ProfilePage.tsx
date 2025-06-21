import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  MapPin,
  Settings,
  LogOut,
  Edit3,
  Save,
  X,
  Fish,
  Calendar,
  Ruler,
  Crop as CropIcon,
  Check,
  Package,
  Plus,
  Upload,
  Trophy,
  MapIcon,
  MoreVertical,
  Trash2,
  Weight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImage, getBlobStorageStatus } from "@/lib/blob-storage";
import { processImageUpload, ImageMetadata } from "@/lib/image-metadata";
import FishInfoOverlay from "./FishInfoOverlay";
import BottomNav from "./BottomNav";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading: authLoading,
    signOut,
    updateProfile,
    uploadAvatar,
  } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging
  console.log("ProfilePage - User:", user);
  console.log("ProfilePage - Profile:", profile);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [activeTab, setActiveTab] = useState("fish-gallery");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<
    (string | ImageMetadata)[]
  >([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [isSingleColumn, setIsSingleColumn] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Load photos from database and localStorage on component mount
  useEffect(() => {
    const loadStoredPhotos = async () => {
      try {
        // First try to load from database (profile.gallery_photos)
        if (profile?.gallery_photos && Array.isArray(profile.gallery_photos)) {
          console.log(
            "[ProfilePage] Loaded photos from database:",
            profile.gallery_photos.length,
          );
          setUploadedPhotos(profile.gallery_photos);
        } else {
          // Fallback to localStorage for migration
          const storedPhotos = localStorage.getItem(`user_photos_${user?.id}`);
          if (storedPhotos) {
            const parsedPhotos = JSON.parse(storedPhotos);
            if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
              console.log(
                "[ProfilePage] Migrating photos from localStorage to database:",
                parsedPhotos.length,
              );
              setUploadedPhotos(parsedPhotos);
              // Migrate to database
              try {
                await updateProfile({ gallery_photos: parsedPhotos });
                console.log(
                  "[ProfilePage] Photos migrated to database successfully",
                );
                // Clear localStorage after successful migration
                localStorage.removeItem(`user_photos_${user?.id}`);
              } catch (migrationError) {
                console.error(
                  "[ProfilePage] Error migrating photos to database:",
                  migrationError,
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("[ProfilePage] Error loading photos:", error);
      } finally {
        setPhotosLoaded(true);
      }
    };

    if (user?.id) {
      loadStoredPhotos();
    } else {
      setPhotosLoaded(true);
    }
  }, [user?.id, profile?.gallery_photos]);

  // Save photos to database whenever uploadedPhotos changes
  useEffect(() => {
    const savePhotosToDatabase = async () => {
      if (user?.id && photosLoaded && uploadedPhotos.length > 0) {
        try {
          // Only update if the photos array has actually changed
          const currentPhotos = profile?.gallery_photos || [];
          const photosChanged =
            JSON.stringify(currentPhotos) !== JSON.stringify(uploadedPhotos);

          if (photosChanged) {
            console.log(
              "[ProfilePage] Saving photos to database:",
              uploadedPhotos.length,
            );
            await updateProfile({ gallery_photos: uploadedPhotos });
            console.log("[ProfilePage] Photos saved to database successfully");
          }
        } catch (error) {
          console.error(
            "[ProfilePage] Error saving photos to database:",
            error,
          );
          // Fallback to localStorage if database save fails
          try {
            localStorage.setItem(
              `user_photos_${user.id}`,
              JSON.stringify(uploadedPhotos),
            );
            console.log(
              "[ProfilePage] Photos saved to localStorage as fallback",
            );
          } catch (localError) {
            console.error(
              "[ProfilePage] Error saving to localStorage fallback:",
              localError,
            );
          }
        }
      }
    };

    savePhotosToDatabase();
  }, [
    uploadedPhotos,
    user?.id,
    photosLoaded,
    profile?.gallery_photos,
    updateProfile,
  ]);

  // Listen for photo upload events from BottomNav
  useEffect(() => {
    const handlePhotoUploaded = (event: CustomEvent) => {
      const { photoUrl, metadata } = event.detail;
      if (photoUrl) {
        // Add to uploaded photos list (newest first)
        setUploadedPhotos((prev) => {
          const newPhoto = metadata ? { ...metadata, url: photoUrl } : photoUrl;
          const newPhotos = [newPhoto, ...prev];
          return newPhotos;
        });
        setSuccess("Photo uploaded successfully!");
        setTimeout(() => setSuccess(null), 3000);
      }
    };

    window.addEventListener(
      "photoUploaded",
      handlePhotoUploaded as EventListener,
    );

    return () => {
      window.removeEventListener(
        "photoUploaded",
        handlePhotoUploaded as EventListener,
      );
    };
  }, [user?.id]);

  // Refs for tab buttons to calculate border position
  const fishGalleryTabRef = useRef<HTMLButtonElement>(null);
  const achievementsTabRef = useRef<HTMLButtonElement>(null);
  const tripsTabRef = useRef<HTMLButtonElement>(null);

  // State for animated border position
  const [borderStyle, setBorderStyle] = useState({ left: 0, width: 0 });

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    fishing_experience: profile?.fishing_experience || "",
    preferred_units: profile?.preferred_units || "metric",
    favorite_fish_species: profile?.favorite_fish_species || [],
  });

  // Update form data when profile changes
  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        fishing_experience: profile.fishing_experience || "",
        preferred_units: profile.preferred_units || "metric",
        favorite_fish_species: profile.favorite_fish_species || [],
      });
    }
  }, [profile]);

  // Update border position when active tab changes
  const updateBorderPosition = React.useCallback(() => {
    let activeTabRef;
    switch (activeTab) {
      case "fish-gallery":
        activeTabRef = fishGalleryTabRef;
        break;
      case "achievements":
        activeTabRef = achievementsTabRef;
        break;
      case "trips":
        activeTabRef = tripsTabRef;
        break;
      default:
        return;
    }

    if (activeTabRef?.current) {
      const tabElement = activeTabRef.current;
      const tabsList = tabElement.parentElement;
      if (tabsList) {
        try {
          const tabsListRect = tabsList.getBoundingClientRect();
          const tabRect = tabElement.getBoundingClientRect();
          const left = tabRect.left - tabsListRect.left;
          const width = tabRect.width;

          // Only update if we have valid dimensions
          if (width > 0 && left >= 0) {
            setBorderStyle({ left, width });
          }
        } catch (error) {
          console.warn("Error calculating border position:", error);
        }
      }
    }
  }, [activeTab]);

  // Update border position when active tab changes
  useEffect(() => {
    // Use requestAnimationFrame for better timing
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updateBorderPosition);
    }, 50); // Slightly longer delay to ensure DOM is ready

    return () => clearTimeout(timeoutId);
  }, [activeTab, updateBorderPosition]);

  // Initial border position setup
  useEffect(() => {
    const initialSetup = () => {
      requestAnimationFrame(() => {
        updateBorderPosition();
      });
    };

    // Set initial position after component mounts
    const timeoutId = setTimeout(initialSetup, 100);
    return () => clearTimeout(timeoutId);
  }, [updateBorderPosition]);

  // Update border position on window resize
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(updateBorderPosition);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateBorderPosition]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Create image URL for cropping
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    e.target.value = "";
  };

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: PixelCrop,
  ): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error("Canvas is empty");
          }
          resolve(blob);
        },
        "image/jpeg",
        0.95,
      );
    });
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) {
      setError("Please select a crop area first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Starting crop and upload process");

      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
      );

      console.log(
        "Image cropped successfully, blob size:",
        croppedImageBlob.size,
      );

      const croppedImageFile = new File([croppedImageBlob], "avatar.jpg", {
        type: "image/jpeg",
      });

      console.log("Uploading avatar file:", {
        name: croppedImageFile.name,
        size: croppedImageFile.size,
        type: croppedImageFile.type,
      });

      // Add timeout wrapper for the upload
      const uploadPromise = uploadAvatar(croppedImageFile);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Upload is taking too long. Please try again."));
        }, 45000); // 45 second timeout
      });

      const { error } = (await Promise.race([
        uploadPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error("Avatar upload failed:", error);
        setError(error.message || "Failed to upload avatar");
      } else {
        console.log("Avatar upload successful");
        setSuccess("Profile picture updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
        setShowCropDialog(false);
        setImageToCrop(null);
        // Reset crop state
        setCrop({
          unit: "%",
          width: 90,
          height: 90,
          x: 5,
          y: 10,
        });
        setCompletedCrop(undefined);
      }
    } catch (err) {
      console.error("Crop and upload error:", err);

      // Handle timeout errors specifically
      if (err instanceof Error && err.message.includes("taking too long")) {
        setError(
          "Upload is taking too long. Please check your connection and try again.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to crop and upload image",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setImageToCrop(null);
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 10,
    });
    setCompletedCrop(undefined);
  };

  const handlePhotoUpload = () => {
    photoInputRef.current?.click();
  };

  const handleImageClick = () => {
    setIsSingleColumn(!isSingleColumn);
  };

  const handleDeletePhoto = async (index: number) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[ProfilePage] Deleting photo at index ${index}`);
      console.log(
        `[ProfilePage] Current photos count: ${uploadedPhotos.length}`,
      );
      console.log(`[ProfilePage] Photo to delete:`, uploadedPhotos[index]);

      // Store original photos for potential revert
      const originalPhotos = [...uploadedPhotos];

      // Remove the photo from the array
      const updatedPhotos = uploadedPhotos.filter((_, i) => i !== index);
      console.log(
        `[ProfilePage] Updated photos count: ${updatedPhotos.length}`,
      );

      // Update local state immediately for better UX
      setUploadedPhotos(updatedPhotos);

      // Update the database
      const { error } = await updateProfile({ gallery_photos: updatedPhotos });

      if (error) {
        console.error(
          "[ProfilePage] Error deleting photo from database:",
          error,
        );
        // Revert the local state if database update fails
        setUploadedPhotos(originalPhotos);
        setError("Failed to delete photo. Please try again.");
      } else {
        console.log("[ProfilePage] Photo deleted successfully from database");
        setSuccess("Photo deleted successfully!");
        setTimeout(() => setSuccess(null), 3000);
      }

      // Close the menu
      setOpenMenuIndex(null);
    } catch (err) {
      console.error("[ProfilePage] Error deleting photo:", err);
      setError("Failed to delete photo. Please try again.");
      // Revert the local state on error
      const originalPhotos = uploadedPhotos.filter((_, i) => i !== index);
      setUploadedPhotos(originalPhotos);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Photo must be less than 10MB");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      e.target.value = "";
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    setSuccess(null);

    // Set overall timeout for the entire upload process
    const uploadTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Upload process timed out. Please try again."));
      }, 60000); // 60 second total timeout
    });

    const uploadProcess = async () => {
      try {
        console.log("[ProfilePage] Starting photo upload:", {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        // Check blob storage configuration
        const storageStatus = getBlobStorageStatus();
        console.log("[ProfilePage] Blob storage status:", storageStatus);

        if (!storageStatus.configured) {
          const errorMessage =
            storageStatus.error || "Blob storage is not properly configured";
          console.error(
            "[ProfilePage] Blob storage not configured:",
            errorMessage,
          );
          throw new Error(errorMessage);
        }

        // Process image metadata (fish identification, location, etc.) with timeout
        console.log("🚀 [PROFILE DEBUG] Starting image metadata processing...");
        const metadataStart = Date.now();

        const metadata = await Promise.race([
          processImageUpload(file),
          new Promise<ImageMetadata>((_, reject) => {
            setTimeout(() => {
              console.error(
                "⏰ [PROFILE DEBUG] Image processing timeout (45s)",
              );
              reject(new Error("Image processing timed out"));
            }, 45000);
          }),
        ]);

        const metadataTime = Date.now() - metadataStart;
        console.log("✅ [PROFILE DEBUG] Image metadata processing completed", {
          processingTime: metadataTime,
          metadata,
          hasFishInfo: !!metadata.fishInfo,
          fishName: metadata.fishInfo?.name,
          confidence: metadata.fishInfo?.confidence,
          hasLocation: !!metadata.location,
        });

        // Upload the photo with timeout
        console.log("[ProfilePage] Uploading photo to blob storage...");
        const photoUrl = await Promise.race([
          uploadImage(file),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error("Photo upload timed out"));
            }, 30000);
          }),
        ]);
        console.log("[ProfilePage] Photo uploaded successfully:", photoUrl);

        // Create complete metadata object with URL
        const completeMetadata: ImageMetadata = {
          ...metadata,
          url: photoUrl,
        };

        // Add to uploaded photos list (newest first)
        setUploadedPhotos((prev) => {
          const newPhotos = [completeMetadata, ...prev];
          return newPhotos;
        });

        // Show success message with fish info if available
        console.log("📢 [PROFILE DEBUG] Setting success message", {
          hasFishInfo: !!metadata.fishInfo,
          fishName: metadata.fishInfo?.name,
          isUnknownFish: metadata.fishInfo?.name === "Unknown",
        });

        if (metadata.fishInfo && metadata.fishInfo.name !== "Unknown") {
          const successMsg = `Photo uploaded! Identified: ${metadata.fishInfo.name} (${Math.round(metadata.fishInfo.confidence * 100)}% confident)`;
          console.log(
            "🎉 [PROFILE DEBUG] Fish identified - showing success with fish info:",
            successMsg,
          );
          setSuccess(successMsg);
        } else {
          const successMsg = "Photo uploaded successfully!";
          console.log(
            "ℹ️ [PROFILE DEBUG] No fish identified - showing generic success:",
            successMsg,
          );
          setSuccess(successMsg);
        }
        setTimeout(() => setSuccess(null), 5000);
      } catch (err) {
        console.error("[ProfilePage] Photo upload error:", err);
        throw err;
      }
    };

    try {
      await Promise.race([uploadProcess(), uploadTimeout]);
    } catch (err) {
      console.error("[ProfilePage] Photo upload failed:", err);

      if (err instanceof Error) {
        if (
          err.message.includes("timed out") ||
          err.message.includes("timeout")
        ) {
          setError(
            "Upload is taking too long. Please check your connection and try again.",
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to upload photo. Please try again.");
      }
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Saving profile with data:", formData);
      const { error } = await updateProfile(formData);
      console.log("Update profile result:", { error });

      if (error) {
        console.error("Profile update error:", error);
        setError(error.message || "Failed to update profile");
      } else {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Profile save error:", err);
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("[ProfilePage] Initiating sign out");
      await signOut();
      // Navigation is now handled by the AuthContext signOut method
      console.log("[ProfilePage] Sign out completed");
    } catch (err) {
      console.error("[ProfilePage] Sign out error:", err);
      setError("Failed to sign out");
      // Force redirect even if signOut fails
      navigate("/login", { replace: true });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const experienceLevels = [
    { value: "beginner", label: "Beginner (0-1 years)" },
    { value: "intermediate", label: "Intermediate (2-5 years)" },
    { value: "advanced", label: "Advanced (5-10 years)" },
    { value: "expert", label: "Expert (10+ years)" },
  ];

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F7F7F7] dark:bg-background">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Loading profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if no user - use useEffect to avoid render loop
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Don't render anything if no user
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen dark:bg-background bg-[#ffffff]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-4 w-full lg:hidden border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2 dark:text-white">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-5 w-5" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      full_name: profile?.full_name || "",
                      username: profile?.username || "",
                      bio: profile.bio || "",
                      location: profile?.location || "",
                      fishing_experience: profile?.fishing_experience || "",
                      preferred_units: profile?.preferred_units || "metric",
                      favorite_fish_species:
                        profile?.favorite_fish_species || [],
                    });
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Save className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full pb-20 lg:pb-4">
        <div className="space-y-6">
          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {/* Profile Header */}
          <Card className="dark:bg-gray-800 bg-[#ffffff] shadow-none border-none">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  <Avatar
                    className="w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name ? (
                        getInitials(profile.full_name)
                      ) : (
                        <User className="w-8 h-8" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                    onClick={handleAvatarClick}
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* Name and Username */}
                {isEditing ? (
                  <div className="w-full space-y-3">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) =>
                          handleInputChange("full_name", e.target.value)
                        }
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) =>
                          handleInputChange("username", e.target.value)
                        }
                        placeholder="Choose a username"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile?.full_name ||
                        user?.full_name ||
                        "Anonymous Angler"}
                    </h2>
                    {profile?.username && (
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        @{profile.username}
                      </p>
                    )}
                  </div>
                )}

                {/* Email */}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mt-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user?.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Gear Management Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-none shadow-none text-gray-800 font-medium py-4 h-auto"
              style={{ backgroundColor: "#025DFB0D" }}
            >
              My gear
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-none shadow-none text-gray-800 font-medium py-4 h-auto flex items-center justify-center gap-2"
              style={{ backgroundColor: "#025DFB0D" }}
            >
              Add gear
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs Section */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-transparent border-none p-0 pb-2 h-auto relative">
              <TabsTrigger
                ref={fishGalleryTabRef}
                value="fish-gallery"
                className="flex items-center justify-center bg-transparent border-none rounded-none px-4 py-3 relative data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
                onClick={() => setActiveTab("fish-gallery")}
              >
                <Fish className="w-6 h-6" />
              </TabsTrigger>
              <TabsTrigger
                ref={achievementsTabRef}
                value="achievements"
                className="flex items-center justify-center bg-transparent border-none rounded-none px-4 py-3 relative data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
                onClick={() => setActiveTab("achievements")}
              >
                <Trophy className="w-6 h-6" />
              </TabsTrigger>
              <TabsTrigger
                ref={tripsTabRef}
                value="trips"
                className="flex items-center justify-center bg-transparent border-none rounded-none px-4 py-3 relative data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
                onClick={() => setActiveTab("trips")}
              >
                <MapIcon className="w-6 h-6" />
              </TabsTrigger>

              {/* Animated sliding border */}
              <motion.div
                className="absolute bottom-0 h-0.5 bg-black rounded-full z-10"
                initial={{ left: 0, width: 0 }}
                animate={{
                  left: borderStyle.left,
                  width: borderStyle.width,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
              />
            </TabsList>

            <TabsContent value="fish-gallery" className="mt-4">
              {/* Dynamic grid layout - 1 or 2 columns based on state */}
              <div
                className={`grid gap-px transition-all duration-300 ${isSingleColumn ? "grid-cols-1" : "grid-cols-2"}`}
              >
                {/* Add Photo button - always first item in grid, smaller in single column */}
                <button
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className={`bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex-col relative transition-colors flex items-center justify-center disabled:opacity-50 ${
                    isSingleColumn ? "h-20 rounded-lg mb-2" : "aspect-square"
                  }`}
                >
                  {uploadingPhoto ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 dark:border-gray-300" />
                  ) : (
                    <>
                      <Plus
                        className={`mb-2 text-gray-600 dark:text-gray-300 ${
                          isSingleColumn ? "w-6 h-6" : "w-8 h-8"
                        }`}
                      />
                      <span
                        className={`text-gray-600 dark:text-gray-300 font-medium ${
                          isSingleColumn ? "text-xs" : "text-xs"
                        }`}
                      >
                        Add Photo
                      </span>
                    </>
                  )}
                </button>

                {/* Show uploaded photos */}
                {uploadedPhotos.map((photo, index) => {
                  // Extract URL properly - handle both string URLs and metadata objects
                  let photoUrl: string;
                  let metadata: ImageMetadata | null = null;

                  if (typeof photo === "string") {
                    // Check if it's a JSON string that needs parsing
                    if (photo.startsWith("{") && photo.includes('"url"')) {
                      try {
                        const parsed = JSON.parse(photo);
                        photoUrl = parsed.url || photo;
                        metadata = parsed;
                        console.log(
                          `[ProfilePage] Parsed metadata for photo ${index}:`,
                          metadata,
                        );
                      } catch (parseError) {
                        console.warn(
                          `[ProfilePage] Failed to parse photo metadata at index ${index}:`,
                          parseError,
                        );
                        photoUrl = photo;
                      }
                    } else {
                      photoUrl = photo;
                    }
                  } else {
                    photoUrl = photo.url || String(photo);
                    metadata = photo as ImageMetadata;
                    console.log(
                      `[ProfilePage] Direct metadata for photo ${index}:`,
                      {
                        hasMetadata: !!metadata,
                        fishInfo: metadata?.fishInfo,
                        location: metadata?.location,
                        url: metadata?.url,
                        timestamp: metadata?.timestamp,
                        fullMetadata: metadata,
                      },
                    );
                  }

                  // Debug logging for overlay conditions
                  const shouldShowOverlay =
                    metadata &&
                    !imageLoadingStates[`${photoUrl}-${index}`] &&
                    !imageErrors[`${photoUrl}-${index}`] &&
                    (metadata?.fishInfo?.name !== "Unknown" ||
                      metadata?.location);
                  console.log(
                    `[ProfilePage] Overlay conditions for photo ${index}:`,
                    {
                      hasMetadata: !!metadata,
                      hasFishInfo: !!metadata?.fishInfo,
                      fishName: metadata?.fishInfo?.name,
                      hasLocation: !!metadata?.location,
                      isLoading: imageLoadingStates[`${photoUrl}-${index}`],
                      hasError: imageErrors[`${photoUrl}-${index}`],
                      shouldShowOverlay,
                      metadataPreview: metadata
                        ? {
                            fishName: metadata.fishInfo?.name,
                            confidence: metadata.fishInfo?.confidence,
                            hasLocation: !!metadata.location,
                            locationAddress: metadata.location?.address,
                          }
                        : null,
                    },
                  );

                  const imageKey = `${photoUrl}-${index}`;
                  const isLoading = imageLoadingStates[imageKey];
                  const hasError = imageErrors[imageKey];

                  return (
                    <div
                      key={index}
                      className={`relative cursor-pointer hover:opacity-90 transition-opacity overflow-hidden bg-gray-100 dark:bg-gray-700 ${
                        isSingleColumn ? "" : "aspect-square"
                      }`}
                    >
                      {/* Main image button */}
                      <button
                        onClick={handleImageClick}
                        className="w-full h-full"
                      >
                        {/* Loading spinner */}
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                          </div>
                        )}

                        {/* Error state */}
                        {hasError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                            <svg
                              className="w-8 h-8 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            <span className="text-xs">Failed to load</span>
                          </div>
                        )}

                        {/* Image */}
                        <img
                          src={photoUrl}
                          alt={`Uploaded photo ${index + 1}`}
                          className={`w-full transition-opacity duration-200 ${
                            isLoading ? "opacity-0" : "opacity-100"
                          } ${hasError ? "hidden" : ""} ${
                            isSingleColumn
                              ? "h-auto object-contain"
                              : "h-full object-cover"
                          }`}
                          onLoadStart={() => {
                            console.log(
                              `[ProfilePage] Image ${index + 1} started loading:`,
                              photoUrl,
                            );
                            setImageLoadingStates((prev) => ({
                              ...prev,
                              [imageKey]: true,
                            }));
                            setImageErrors((prev) => ({
                              ...prev,
                              [imageKey]: false,
                            }));
                          }}
                          onLoad={() => {
                            console.log(
                              `[ProfilePage] Image ${index + 1} loaded successfully:`,
                              photoUrl,
                            );
                            setImageLoadingStates((prev) => ({
                              ...prev,
                              [imageKey]: false,
                            }));
                            setImageErrors((prev) => ({
                              ...prev,
                              [imageKey]: false,
                            }));
                          }}
                          onError={(e) => {
                            console.error(
                              `[ProfilePage] Error loading image ${index + 1}:`,
                              {
                                url: photoUrl,
                                error: e,
                                isHttps: photoUrl.startsWith("https://"),
                                domain: (() => {
                                  try {
                                    return new URL(photoUrl).hostname;
                                  } catch {
                                    return "invalid-url";
                                  }
                                })(),
                                urlLength: photoUrl.length,
                                hasValidExtension:
                                  /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(
                                    photoUrl,
                                  ),
                              },
                            );

                            // Try to get more details about the error
                            fetch(photoUrl, { method: "HEAD" })
                              .then((response) => {
                                console.error(
                                  `[ProfilePage] HTTP status for failed image ${index + 1}:`,
                                  {
                                    status: response.status,
                                    statusText: response.statusText,
                                    url: photoUrl,
                                  },
                                );
                              })
                              .catch((fetchError) => {
                                console.error(
                                  `[ProfilePage] Network error for image ${index + 1}:`,
                                  {
                                    error: fetchError.message,
                                    url: photoUrl,
                                  },
                                );
                              });

                            setImageLoadingStates((prev) => ({
                              ...prev,
                              [imageKey]: false,
                            }));
                            setImageErrors((prev) => ({
                              ...prev,
                              [imageKey]: true,
                            }));

                            // Don't automatically remove images - let user decide
                            // Show error state instead of removing the image
                          }}
                        />

                        {/* Fish Info Overlay - Always show in single column mode with labels */}
                        {isSingleColumn && !isLoading && !hasError && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none">
                            <div className="absolute bottom-0 left-0 right-0 text-white">
                              {/* Fish Information - Always show with labels */}
                              <div className="px-3 pb-3 space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center">
                                    <span className="font-bold text-lg">
                                      {metadata?.fishInfo?.name &&
                                      metadata.fishInfo.name !== "Unknown"
                                        ? metadata.fishInfo.name
                                        : "AI info not available"}
                                    </span>
                                  </div>
                                  {metadata?.fishInfo?.confidence &&
                                    metadata.fishInfo.confidence > 0 && (
                                      <div className="bg-white/25 backdrop-blur-sm text-white border border-white/30 text-xs px-2 py-1 rounded-full">
                                        {Math.round(
                                          metadata.fishInfo.confidence * 100,
                                        )}
                                        % confident
                                      </div>
                                    )}
                                </div>

                                {/* Size, Weight, and Location - All with consistent spacing */}
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Ruler className="w-3 h-3" />
                                    <span className="font-normal">
                                      Size:{" "}
                                      {metadata?.fishInfo?.estimatedSize &&
                                      metadata.fishInfo.estimatedSize !==
                                        "Unknown"
                                        ? metadata.fishInfo.estimatedSize
                                        : "AI info not available"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Weight className="w-3 h-3" />
                                    <span className="font-normal">
                                      Weight:{" "}
                                      {metadata?.fishInfo?.estimatedWeight &&
                                      metadata.fishInfo.estimatedWeight !==
                                        "Unknown"
                                        ? metadata.fishInfo.estimatedWeight
                                        : "AI info not available"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    <span className="font-normal">
                                      Location:{" "}
                                      {metadata?.location
                                        ? metadata.location.address ||
                                          `${metadata.location.latitude.toFixed(4)}, ${metadata.location.longitude.toFixed(4)}`
                                        : "AI info not available"}
                                    </span>
                                  </div>
                                </div>

                                {/* Logo - Aligned left with same spacing as info */}
                                <div className="flex justify-start">
                                  <img
                                    src="/logo-light.svg"
                                    alt="Lishka Logo"
                                    className="w-40 h-12 brightness-0 invert"
                                    onError={(e) => {
                                      // Fallback to text
                                      const parent =
                                        e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.innerHTML =
                                          '<div class="text-lg font-bold text-white">LISHKA</div>';
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </button>

                      {/* 3-dots menu - only show in single column mode */}
                      {isSingleColumn && (
                        <div className="absolute top-2 right-2 z-20">
                          <DropdownMenu
                            open={openMenuIndex === index}
                            onOpenChange={(open) => {
                              setOpenMenuIndex(open ? index : null);
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuIndex(
                                    openMenuIndex === index ? null : index,
                                  );
                                }}
                                className="text-white p-1.5 transition-colors"
                              >
                                <MoreVertical className="w-5 h-5 rotate-90" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(index);
                                }}
                                className="text-red-600 hover:text-red-700 focus:text-red-700"
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Gallery input for selecting existing photos */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={uploadingPhoto}
              />
              {/* Camera input for taking new photos */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </TabsContent>

            <TabsContent value="achievements" className="mt-4">
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Coming Soon!
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Track your fishing milestones and unlock achievements
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trips" className="mt-4">
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapIcon className="w-5 h-5" />
                    Fishing Trips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <MapIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Coming Soon!
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Log and track your fishing adventures
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {/* Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
      {/* Image Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-md w-full mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="w-5 h-5" />
              Crop Your Profile Picture
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {imageToCrop && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageToCrop}
                    style={{ maxHeight: "400px", maxWidth: "100%" }}
                    onLoad={() => {
                      const { width, height } = imgRef.current!;
                      const size = Math.min(width, height) * 0.9;
                      const x = (width - size) / 2;
                      const y = Math.max(0, (height - size) * 0.6);
                      setCrop({
                        unit: "px",
                        width: size,
                        height: size,
                        x,
                        y,
                      });
                    }}
                  />
                </ReactCrop>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCropCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={loading || !completedCrop}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {loading ? "Uploading..." : "Save Avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
