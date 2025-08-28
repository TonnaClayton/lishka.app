import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import { ImageMetadata } from "@/lib/image-metadata";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import {
  useUpdateProfile,
  useUploadAvatar,
  useUploadPhoto,
  useDeletePhoto,
  useUploadGear,
  useUsernameValidation,
} from "@/hooks/queries";
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Edit3,
  Save,
  X,
  Plus,
  MapIcon,
  Trophy,
  Fish,
  CropIcon,
  Check,
  Menu,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { log } from "@/lib/logging";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import BottomNav from "../../components/bottom-nav";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FishImageCard from "./fish-image-card";
import { ROUTES } from "@/lib/routing";

// Zod schema for profile form validation
const profileSchema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must be less than 50 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-z0-9._]+$/,
      "Username can only contain lowercase letters, numbers, dots (.) and underscores (_)",
    )
    .refine((val) => !val.includes("..") && !val.includes("__"), {
      message: "Username cannot have consecutive dots or underscores",
    }),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  countryCode?: string;
}

// Fix Leaflet icon issue with proper CDN URLs
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// Map Click Handler Component for Edit Dialog
const MapClickHandler = ({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
}) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      // Attempt to get location name via reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        );
        const data = await response.json();

        // Extract city/town and country from address details
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.hamlet ||
          "";
        const country = data.address?.country || "";

        // Format as "city, country"
        const name = [city, country].filter(Boolean).join(", ");

        // Check if location is on sea or water
        const isSeaLocation =
          !city || // No city means likely on water
          data.address?.sea ||
          data.address?.ocean ||
          data.address?.water ||
          data.address?.bay;

        let locationName;
        if (isSeaLocation) {
          // For sea locations, display only coordinates
          const formattedLat = lat.toFixed(6);
          const formattedLng = lng.toFixed(6);
          locationName = `${formattedLat}, ${formattedLng}`;
        } else {
          locationName = name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }

        onLocationSelect(lat, lng, locationName);
      } catch (error) {
        console.error("Error getting location name:", error);
        // Display coordinates as fallback
        const formattedLat = lat.toFixed(6);
        const formattedLng = lng.toFixed(6);
        const locationName = `${formattedLat}, ${formattedLng}`;
        onLocationSelect(lat, lng, locationName);
      }
    },
  });
  return null;
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  // React Query hooks - always call them, let React Query handle the enabled state

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();
  const uploadGear = useUploadGear();
  const usernameValidation = useUsernameValidation();

  // Local state
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
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("fish-gallery");
  const [isSingleColumn, setIsSingleColumn] = useState(() => {
    // Initialize based on screen size - mobile should default to single column
    if (typeof window !== "undefined") {
      const isMobileScreen = window.innerWidth < 768;
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      log("[ProfilePage] Initial column detection:", {
        isMobileScreen,
        isMobileDevice,
        windowWidth: window.innerWidth,
        defaultToSingle: isMobileScreen || isMobileDevice,
      });
      return isMobileScreen || isMobileDevice;
    }
    return false;
  });

  const [borderStyle, setBorderStyle] = useState({ left: 0, width: 0 });
  const [loading, setLoading] = useState(false);

  const [showEditAIDialog, setShowEditAIDialog] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(
    null,
  );
  const [editingMetadata, setEditingMetadata] = useState<ImageMetadata | null>(
    null,
  );
  const [tempLocationData, setTempLocationData] = useState<LocationData | null>(
    null,
  );

  // React Hook Form setup
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      username: "",
      bio: "",
    },
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
      });
    }
  }, [profile, form]);

  // File refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const gearInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const fishGalleryTabRef = useRef<HTMLButtonElement>(null);
  const achievementsTabRef = useRef<HTMLButtonElement>(null);
  const tripsTabRef = useRef<HTMLButtonElement>(null);

  // Form submission handler
  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Check username uniqueness if username has changed
      if (data.username && data.username !== profile?.username) {
        const result = await usernameValidation.mutateAsync(data.username);
        if (result.exists) {
          form.setError("username", {
            type: "manual",
            message: "This username is already taken",
          });
          return;
        }
      }

      await updateProfile.mutateAsync(data);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    try {
      await uploadAvatar.mutateAsync(file);
      setSuccess("Profile picture updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      e.target.value = "";
    }
  };

  // Handle photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError(`Photo must be less than 15MB`);
      e.target.value = "";
      return;
    }

    try {
      setLoading(true);
      const metadata = await uploadPhoto.mutateAsync(file);

      if (metadata.fishInfo && metadata.fishInfo.name !== "Unknown") {
        const successMsg = `Photo uploaded! Identified: ${metadata.fishInfo.name} (${Math.round(metadata.fishInfo.confidence * 100)}% confident)`;
        setSuccess(successMsg);
      } else {
        setSuccess("Photo uploaded successfully!");
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async (index: number) => {
    try {
      await deletePhoto.mutateAsync(index);
    } catch (err) {
      console.error("[ProfilePage] Error deleting photo:", err);
      setError("Failed to delete photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle gear upload
  const handleGearUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { metadata } = await uploadGear.mutateAsync(file);

      if (metadata.gearInfo && metadata.gearInfo.name !== "Unknown Gear") {
        const successMsg = `Gear uploaded! Identified: ${metadata.gearInfo.name} (${Math.round((metadata.gearInfo.confidence || 0) * 100)}% confident)`;
        setSuccess(successMsg);
      } else {
        setSuccess("Gear uploaded successfully!");
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload gear");
    } finally {
      e.target.value = "";
    }
  };

  // Handle profile save
  const handleSave = () => {
    form.handleSubmit(onSubmit)();
  };

  const handlePhotoUpload = () => {
    log("[ProfilePage] Add photo button clicked - mobile optimized");
    log("[ProfilePage] photoInputRef.current:", photoInputRef.current);
    log("[ProfilePage] User agent:", navigator.userAgent);
    log(
      "[ProfilePage] Is mobile:",
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ),
    );

    if (photoInputRef.current) {
      try {
        // For mobile devices, use a more direct approach
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          );

        if (isMobile) {
          log("[ProfilePage] Mobile device detected - using direct click");
          // Reset the input value first to ensure change event fires
          photoInputRef.current.value = "";
          // Use setTimeout to ensure the click happens after any event bubbling
          setTimeout(() => {
            if (photoInputRef.current) {
              photoInputRef.current.click();
              log("[ProfilePage] Mobile file input clicked");
            }
          }, 10);
        } else {
          log("[ProfilePage] Desktop device - using standard click");
          photoInputRef.current.click();
        }

        log("[ProfilePage] File input click triggered successfully");
      } catch (error) {
        console.error("[ProfilePage] Error clicking file input:", error);
      }
    } else {
      console.error("[ProfilePage] photoInputRef.current is null");
    }
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
      log("Starting crop and upload process");

      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
      );

      log("Image cropped successfully, blob size:", croppedImageBlob.size);

      const croppedImageFile = new File([croppedImageBlob], "avatar.jpg", {
        type: "image/jpeg",
      });

      log("Uploading avatar file:", {
        name: croppedImageFile.name,
        size: croppedImageFile.size,
        type: croppedImageFile.type,
      });

      // Add timeout wrapper for the upload
      const uploadPromise = uploadAvatar.mutateAsync(croppedImageFile);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Upload is taking too long. Please try again."));
        }, 45000); // 45 second timeout
      });

      await Promise.race([uploadPromise, timeoutPromise]);

      log("Avatar upload successful");
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

  const handleSaveEditedAIInfo = async () => {
    if (editingPhotoIndex === null || !editingMetadata) return;

    try {
      setLoading(true);
      setError(null);

      // Update the photo in the array
      const updatedPhotos = [...(profile?.gallery_photos as any)];
      updatedPhotos[editingPhotoIndex] = editingMetadata;

      // Update the database
      await updateProfile.mutateAsync({ gallery_photos: updatedPhotos });

      log("[ProfilePage] AI info updated successfully");
      setSuccess("AI info updated successfully!");
      setTimeout(() => setSuccess(null), 3000);

      // Close dialog and reset state
      setShowEditAIDialog(false);
      setEditingPhotoIndex(null);
      setEditingMetadata(null);
      setTempLocationData(null);
    } catch (err) {
      console.error("[ProfilePage] Error saving edited AI info:", err);
      setError("Failed to update AI info. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handlePhotoUploaded = (event: CustomEvent) => {
      log("🔍 [PROFILE PAGE] Photo upload event received:", event.detail);
      const { photoUrl, metadata } = event.detail;

      log("🔍 [PROFILE PAGE] Event detail breakdown:", {
        hasPhotoUrl: !!photoUrl,
        photoUrl,
        hasMetadata: !!metadata,
        metadata,
        metadataType: typeof metadata,
        metadataKeys: metadata ? Object.keys(metadata) : null,
        hasFishInfo: !!metadata?.fishInfo,
        fishInfo: metadata?.fishInfo,
      });

      if (photoUrl) {
        // Add to uploaded photos list (newest first)

        const prev = [...(profile?.gallery_photos as any)];

        const newPhoto = metadata
          ? { ...metadata, url: photoUrl, cacheBuster: Date.now() }
          : photoUrl;
        log("🔍 [PROFILE PAGE] Adding new photo to list:", {
          newPhoto,
          hasMetadata: !!metadata,
          hasFishInfo: !!metadata?.fishInfo,
          fishName: metadata?.fishInfo?.name,
          previousPhotosCount: prev.length,
        });
        const newPhotos = [newPhoto, ...prev];

        updateProfile.mutateAsync({ gallery_photos: newPhotos }).then(() => {
          setSuccess("Photo uploaded successfully!");
          setTimeout(() => setSuccess(null), 3000);
        });
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

  const handleEditAIInfo = (index: number) => {
    const photo = (profile?.gallery_photos as any)[index];
    let metadata: ImageMetadata | null = null;

    // Simplified extraction - all photos should be ImageMetadata objects now
    if (typeof photo === "string") {
      console.warn(
        `[ProfilePage] Legacy string photo in edit function:`,
        photo,
      );
      const photoString = photo as string;
      if (photoString.startsWith("{") && photoString.includes('"url"')) {
        try {
          const parsed = JSON.parse(photoString);
          metadata = parsed;
        } catch {
          // Create default metadata structure for legacy data
          metadata = {
            url: photo,
            timestamp: new Date().toISOString(),
            fishInfo: {
              name: "Unknown",
              confidence: 0,
              estimatedSize: "Unknown",
              estimatedWeight: "Unknown",
            },
            location: null,
          };
        }
      } else {
        // Create default metadata structure for plain URLs
        metadata = {
          url: photo,
          timestamp: new Date().toISOString(),
          fishInfo: {
            name: "Unknown",
            confidence: 0,
            estimatedSize: "Unknown",
            estimatedWeight: "Unknown",
          },
          location: null,
        };
      }
    } else {
      metadata = photo as ImageMetadata;
    }

    setEditingPhotoIndex(index);
    setEditingMetadata(metadata);
    setShowEditAIDialog(true);
  };

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

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageClick = () => {
    const newColumnState = !isSingleColumn;
    setIsSingleColumn(newColumnState);
  };

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
    const timeoutId = setTimeout(initialSetup, 2000);
    return () => clearTimeout(timeoutId);
  }, [updateBorderPosition]);

  // Update border position on window resize and handle mobile layout
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(updateBorderPosition);

      // Auto-adjust column layout for mobile screens
      const isMobileScreen = window.innerWidth < 768;
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      log("[ProfilePage] Window resize detected:", {
        windowWidth: window.innerWidth,
        isMobileScreen,
        isMobileDevice,
        currentIsSingleColumn: isSingleColumn,
      });

      // Force single column on mobile screens
      if (isMobileScreen && !isSingleColumn) {
        log("[ProfilePage] Forcing single column for mobile screen");
        setIsSingleColumn(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateBorderPosition, isSingleColumn]);

  // Redirect to login if no user
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Early returns after all hooks
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

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-full dark:bg-background bg-[#ffffff]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 p-4 w-full border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2 dark:text-white">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/menu")}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset({
                      full_name: profile?.full_name || "",
                      username: profile?.username || "",
                      bio: profile?.bio || "",
                    });
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                >
                  <Save className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 w-full overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
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
                      onClick={() => fileInputRef.current?.click()}
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
                    {isEditing && (
                      <div
                        className="absolute -bottom-2 -right-2 bg-lishka-blue rounded-full p-2 cursor-pointer hover:bg-lishka-blue transition-colors shadow-lg"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    )}
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
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="w-full space-y-3"
                      >
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your full name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Choose a username"
                                  {...field}
                                  onChange={(e) => {
                                    const newUsername =
                                      e.target.value.toLowerCase();
                                    field.onChange(newUsername);
                                    // Check username uniqueness after a delay
                                    if (
                                      newUsername &&
                                      newUsername !== profile?.username
                                    ) {
                                      setTimeout(() => {
                                        if (
                                          form.getValues("username") ===
                                          newUsername
                                        ) {
                                          usernameValidation
                                            .mutateAsync(newUsername)
                                            .then((result) => {
                                              if (result.exists) {
                                                form.setError("username", {
                                                  type: "manual",
                                                  message:
                                                    "This username is already taken",
                                                });
                                              }
                                            });
                                        }
                                      }, 500);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Tell us about yourself"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
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
                      {profile?.bio && (
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                          {profile.bio}
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
                className={cn(
                  "flex-1 border-none shadow-none text-[#191B1F] bg-[#025DFB0D] font-medium py-4 h-10 flex items-center justify-center gap-2 rounded-[8px]",
                )}
                style={{ backgroundColor: "#0251FB0D" }}
                onClick={() => navigate("/my-gear")}
              >
                My gear
                {profile?.gear_items &&
                  Array.isArray(profile.gear_items) &&
                  profile.gear_items.length > 0 && (
                    <Badge
                      className={cn(
                        "bg-lishka-blue hover:bg-lishka-blue text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-sm font-medium",
                      )}
                    >
                      {profile.gear_items.length}
                    </Badge>
                  )}
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 border-none shadow-none text-[#191B1F] bg-[#025DFB0D] font-medium py-4 h-10 flex items-center justify-center gap-2 rounded-[8px]",
                )}
                style={{ backgroundColor: "#0251FB0D" }}
                onClick={() => {
                  // Trigger file input for gear upload
                  const gearInput = document.createElement("input");
                  gearInput.type = "file";
                  gearInput.accept = "image/*";
                  gearInput.onchange = (e) => handleGearUpload(e as any);
                  gearInput.click();
                }}
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
                  className={cn(
                    "flex items-center justify-center bg-transparent border-none rounded-none px-4 py-3 relative data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors",
                  )}
                  onClick={() => setActiveTab("fish-gallery")}
                >
                  <Fish className="w-6 h-6" />
                </TabsTrigger>
                <TabsTrigger
                  ref={achievementsTabRef}
                  value="achievements"
                  className={cn(
                    "flex items-center justify-center bg-transparent border-none rounded-none px-4 py-3 relative data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors",
                  )}
                  onClick={() => setActiveTab("achievements")}
                >
                  <Trophy className="w-6 h-6" />
                </TabsTrigger>
                <TabsTrigger
                  ref={tripsTabRef}
                  value="trips"
                  className={cn(
                    "flex items-center justify-center bg-transparent border-none rounded-none px-4 py-3 relative data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors",
                  )}
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
                  className={cn(
                    "grid gap-px transition-all duration-300",
                    isSingleColumn ? "grid-cols-1" : "grid-cols-2",
                  )}
                >
                  {/* Add Photo button - always first item in grid, smaller in single column */}
                  <button
                    onClick={handlePhotoUpload}
                    disabled={uploadPhoto.isPending}
                    className={cn(
                      "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex-col relative transition-colors flex items-center justify-center disabled:opacity-50 touch-manipulation",
                      isSingleColumn ? "h-20 rounded-lg mb-2" : "aspect-square",
                    )}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}
                  >
                    {uploadPhoto.isPending ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 dark:border-gray-300" />
                    ) : (
                      <>
                        <Plus
                          className={cn(
                            "mb-2 text-gray-600 dark:text-gray-300",
                            isSingleColumn ? "w-6 h-6" : "w-8 h-8",
                          )}
                        />
                        <span
                          className={cn(
                            "text-gray-600 dark:text-gray-300 font-medium",
                            isSingleColumn ? "text-xs" : "text-xs",
                          )}
                        >
                          Add Photo
                        </span>
                      </>
                    )}
                  </button>

                  {/* Show uploaded photos */}
                  {profile?.gallery_photos.map((photo: any, index) => {
                    return (
                      <FishImageCard
                        key={index}
                        handleImageClick={handleImageClick}
                        isSingleColumn={isSingleColumn}
                        loading={loading}
                        handleDeletePhoto={() => handleDeletePhoto(index)}
                        handleEditAIInfo={() => handleEditAIInfo(index)}
                        setSuccess={setSuccess}
                        setError={setError}
                        photo={photo}
                      />
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
                  disabled={uploadPhoto.isPending}
                  key="photo-input"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                />
                {/* Camera input for taking new photos */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={uploadPhoto.isPending}
                  key="camera-input"
                />
              </TabsContent>

              <TabsContent value="achievements" className="mt-4">
                <Card className="bg-white dark:bg-gray-800 border-[#191B1F1A]">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-base">
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center text-center py-12">
                      <Trophy className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        Coming Soon!
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Track your fishing milestones and unlock achievements
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trips" className="mt-4">
                <Card className="bg-white dark:bg-gray-800 border-[#191B1F1A]">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-base">
                      Fishing Trips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center text-center py-12">
                      <MapIcon className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        Coming Soon!
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Log and track your fishing adventures
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            {/* <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadPhoto.isPending}
              >
                {uploadPhoto.isPending ? "Uploading..." : "Add Photo"}
                <Plus className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => gearInputRef.current?.click()}
                disabled={uploadGear.isPending}
              >
                {uploadGear.isPending ? "Uploading..." : "Add Gear"}
                <Plus className="w-4 h-4 ml-2" />
              </Button>
            </div> */}

            {/* Hidden inputs */}

            <input
              ref={gearInputRef}
              type="file"
              accept="image/*"
              onChange={handleGearUpload}
              className="hidden"
              disabled={uploadGear.isPending}
            />
          </div>
        </div>
        <div className="h-20 md:hidden"></div>
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

      {/* Edit AI Info Dialog */}
      <Dialog open={showEditAIDialog} onOpenChange={setShowEditAIDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95%] mx-auto rounded-lg max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Fish className="w-5 h-5" />
              Edit Fish Information
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {editingMetadata && (
              <>
                <div>
                  <Label
                    htmlFor="fish-name"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Fish Name
                  </Label>
                  <Input
                    id="fish-name"
                    value={editingMetadata.fishInfo?.name || ""}
                    onChange={(e) => {
                      setEditingMetadata((prev) =>
                        prev
                          ? {
                              ...prev,
                              fishInfo: {
                                ...prev.fishInfo,
                                name: e.target.value,
                                confidence: prev.fishInfo?.confidence || 0,
                                estimatedSize:
                                  prev.fishInfo?.estimatedSize || "Unknown",
                                estimatedWeight:
                                  prev.fishInfo?.estimatedWeight || "Unknown",
                              },
                            }
                          : null,
                      );
                    }}
                    placeholder="Enter fish name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="fish-size"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Estimated Size
                  </Label>
                  <Input
                    id="fish-size"
                    value={editingMetadata.fishInfo?.estimatedSize || ""}
                    onChange={(e) => {
                      setEditingMetadata((prev) =>
                        prev
                          ? {
                              ...prev,
                              fishInfo: {
                                ...prev.fishInfo,
                                name: prev.fishInfo?.name || "Unknown",
                                confidence: prev.fishInfo?.confidence || 0,
                                estimatedSize: e.target.value,
                                estimatedWeight:
                                  prev.fishInfo?.estimatedWeight || "Unknown",
                              },
                            }
                          : null,
                      );
                    }}
                    placeholder="e.g., 40-50 cm"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="fish-weight"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Estimated Weight
                  </Label>
                  <Input
                    id="fish-weight"
                    value={editingMetadata.fishInfo?.estimatedWeight || ""}
                    onChange={(e) => {
                      setEditingMetadata((prev) =>
                        prev
                          ? {
                              ...prev,
                              fishInfo: {
                                ...prev.fishInfo,
                                name: prev.fishInfo?.name || "Unknown",
                                confidence: prev.fishInfo?.confidence || 0,
                                estimatedSize:
                                  prev.fishInfo?.estimatedSize || "Unknown",
                                estimatedWeight: e.target.value,
                              },
                            }
                          : null,
                      );
                    }}
                    placeholder="e.g., 2-3 kg"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </Label>
                  <div className="h-40 border rounded-lg overflow-hidden relative">
                    {typeof window !== "undefined" && (
                      <div className="w-full h-full">
                        <MapContainer
                          center={[
                            editingMetadata?.location?.latitude || 35.8997,
                            editingMetadata?.location?.longitude || 14.5146,
                          ]}
                          zoom={13}
                          style={{ height: "100%", width: "100%" }}
                          className="z-0"
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <MapClickHandler
                            onLocationSelect={(lat, lng, name) => {
                              const location = {
                                latitude: lat,
                                longitude: lng,
                                name,
                              };
                              setTempLocationData(location);
                              if (editingMetadata) {
                                setEditingMetadata({
                                  ...editingMetadata,
                                  location: {
                                    latitude: lat,
                                    longitude: lng,
                                    address: name,
                                  },
                                });
                              }
                            }}
                          />
                          {(editingMetadata?.location || tempLocationData) && (
                            <Marker
                              position={[
                                tempLocationData?.latitude ||
                                  editingMetadata?.location?.latitude ||
                                  35.8997,
                                tempLocationData?.longitude ||
                                  editingMetadata?.location?.longitude ||
                                  14.5146,
                              ]}
                            />
                          )}
                        </MapContainer>
                        {(editingMetadata?.location || tempLocationData) && (
                          <div className="absolute bottom-2 left-2 right-2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
                              {tempLocationData?.name ||
                                editingMetadata?.location?.address ||
                                `${(tempLocationData?.latitude || editingMetadata?.location?.latitude || 0).toFixed(4)}, ${(tempLocationData?.longitude || editingMetadata?.location?.longitude || 0).toFixed(4)}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-4">
            <div className="bg-blue-50 /20 border border-blue-200  rounded-lg p-2">
              <p className="text-xs text-lishka-blue">
                <strong>Note:</strong> Updating this information will remove the
                AI confidence indicator.
              </p>
            </div>
          </div>

          {/* Cancel and Save Buttons at bottom */}
          <div className="mt-4 pt-2 flex gap-3">
            <Button
              onClick={() => {
                setShowEditAIDialog(false);
                setEditingPhotoIndex(null);
                setEditingMetadata(null);
                setTempLocationData(null);
              }}
              disabled={loading}
              variant="outline"
              className="flex-1 h-10 rounded-lg font-medium"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedAIInfo}
              disabled={loading}
              className="flex-1 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
