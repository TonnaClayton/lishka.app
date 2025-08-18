import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { motion } from "framer-motion";
import {
  ChevronLeft,
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
  Menu,
  Share,
  Pencil,
  CheckIcon,
  LoaderIcon,
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
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
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
import { useAuth } from "@/contexts/auth-context";
import {
  uploadImageToSupabase,
  getSupabaseStorageStatus,
} from "@/lib/supabase-storage";
import { supabase } from "@/lib/supabase";
import { processImageUpload, ImageMetadata } from "@/lib/image-metadata";
import { log } from "@/lib/logging";
import { exportFishInfoOverlayAsImage } from "@/lib/image-export";

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  countryCode?: string;
}
import {
  uploadGearImage,
  GearUploadResult,
  GearMetadata,
} from "@/lib/gear-upload-service";
import FishInfoOverlay from "./fish-info-overlay";
import BottomNav from "./bottom-nav";
import LocationModal from "./location-modal";

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
  log("ProfilePage - User:", user);
  log("ProfilePage - Profile:", profile);

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
  const [uploadedPhotos, setUploadedPhotos] = useState<ImageMetadata[]>([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);
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
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [uploadingGear, setUploadingGear] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    email?: string;
  }>({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showEditAIDialog, setShowEditAIDialog] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(
    null,
  );
  const [editingMetadata, setEditingMetadata] = useState<ImageMetadata | null>(
    null,
  );
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempLocationData, setTempLocationData] = useState<LocationData | null>(
    null,
  );
  const [isEmailEditable, setIsEmailEditable] = useState(false);

  // Load photos from database and localStorage on component mount
  useEffect(() => {
    const loadStoredPhotos = async () => {
      try {
        // First try to load from database (profile.gallery_photos)
        if (profile?.gallery_photos && Array.isArray(profile.gallery_photos)) {
          log(
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
              log(
                "[ProfilePage] Migrating photos from localStorage to database:",
                parsedPhotos.length,
              );
              setUploadedPhotos(parsedPhotos);
              // Migrate to database
              try {
                await updateProfile({ gallery_photos: parsedPhotos });
                log("[ProfilePage] Photos migrated to database successfully");
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
            log(
              "[ProfilePage] Saving photos to database:",
              uploadedPhotos.length,
            );
            await updateProfile({ gallery_photos: uploadedPhotos });
            log("[ProfilePage] Photos saved to database successfully");
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
            log("[ProfilePage] Photos saved to localStorage as fallback");
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
        setUploadedPhotos((prev) => {
          const newPhoto = metadata ? { ...metadata, url: photoUrl } : photoUrl;
          log("🔍 [PROFILE PAGE] Adding new photo to list:", {
            newPhoto,
            hasMetadata: !!metadata,
            hasFishInfo: !!metadata?.fishInfo,
            fishName: metadata?.fishInfo?.name,
            previousPhotosCount: prev.length,
          });
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
    email: user?.email || "",
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
        email: user?.email || "",
        bio: profile.bio || "",
        location: profile.location || "",
        fishing_experience: profile.fishing_experience || "",
        preferred_units: profile.preferred_units || "metric",
        favorite_fish_species: profile.favorite_fish_species || [],
      });
    }
  }, [profile, user]);

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

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation errors when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Validate username format in real-time
    if (field === "username" && typeof value === "string") {
      validateUsernameFormat(value);
    }
  };

  // Username format validation
  const validateUsernameFormat = (username: string) => {
    if (!username) {
      setValidationErrors((prev) => ({ ...prev, username: undefined }));
      return true;
    }

    // Check format: lowercase letters, numbers, dots, and underscores only
    const usernameRegex = /^[a-z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      setValidationErrors((prev) => ({
        ...prev,
        username:
          "Username can only contain lowercase letters, numbers, dots (.) and underscores (_)",
      }));
      return false;
    }

    // Check for consecutive dots or underscores
    if (username.includes("..") || username.includes("__")) {
      setValidationErrors((prev) => ({
        ...prev,
        username: "Username cannot have consecutive dots or underscores",
      }));
      return false;
    }

    // Check minimum length
    if (username.length < 3) {
      setValidationErrors((prev) => ({
        ...prev,
        username: "Username must be at least 3 characters long",
      }));
      return false;
    }

    // Check maximum length
    if (username.length > 30) {
      setValidationErrors((prev) => ({
        ...prev,
        username: "Username must be less than 30 characters",
      }));
      return false;
    }

    setValidationErrors((prev) => ({ ...prev, username: undefined }));
    return true;
  };

  // Check username uniqueness
  const checkUsernameUniqueness = async (username: string) => {
    if (!username || !validateUsernameFormat(username)) {
      return false;
    }

    // Don't check if it's the same as current username
    if (username === profile?.username) {
      return true;
    }

    setCheckingUsername(true);
    log("[ProfilePage] Checking username uniqueness for:", username);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .limit(1);

      log("[ProfilePage] Database query result:", {
        data,
        error,
        username,
      });

      if (error) {
        console.error("Error checking username uniqueness:", error);
        setValidationErrors((prev) => ({
          ...prev,
          username: "Error checking username availability",
        }));
        return false;
      }

      if (data && data.length > 0) {
        log("[ProfilePage] Username already exists in database:", username);
        setValidationErrors((prev) => ({
          ...prev,
          username: "This username is already taken",
        }));
        return false;
      }

      log("[ProfilePage] Username is available:", username);
      setValidationErrors((prev) => ({ ...prev, username: undefined }));
      return true;
    } catch (err) {
      console.error("Username uniqueness check failed:", err);
      setValidationErrors((prev) => ({
        ...prev,
        username: "Error checking username availability",
      }));
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  // Validate email format
  const validateEmailFormat = (email: string) => {
    if (!email) {
      setValidationErrors((prev) => ({ ...prev, email: "Email is required" }));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
      return false;
    }

    setValidationErrors((prev) => ({ ...prev, email: undefined }));
    return true;
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

  const handleImageClick = () => {
    const newColumnState = !isSingleColumn;
    setIsSingleColumn(newColumnState);
  };

  const handleGearUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError(
        `Gear image must be less than 15MB (current: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      );
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      e.target.value = "";
      return;
    }

    setUploadingGear(true);
    setError(null);
    setSuccess(null);

    try {
      log("[ProfilePage] Starting gear upload:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Upload and process gear image
      const result = await uploadGearImage(file);

      if (!result.success || !result.metadata) {
        throw new Error(result.error || "Failed to upload gear");
      }

      log("[ProfilePage] Gear upload successful:", result);

      // Create gear item from metadata
      const gearItem = {
        id: `gear_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: result.metadata.gearInfo?.name || "Unknown Gear",
        category: mapGearTypeToCategory(
          result.metadata.gearInfo?.type || "other",
        ),
        description: result.metadata.gearInfo?.type || "",
        brand: result.metadata.gearInfo?.brand || "",
        model: result.metadata.gearInfo?.model || "",
        imageUrl: result.metadata.url,
        timestamp: result.metadata.timestamp,
        userConfirmed: false,
        gearType: result.metadata.gearInfo?.type || "unknown",
        aiConfidence: result.metadata.gearInfo?.confidence || 0,
        // Enhanced fields
        size: result.metadata.gearInfo?.size || "",
        weight: result.metadata.gearInfo?.weight || "",
        targetFish: result.metadata.gearInfo?.targetFish || "",
        fishingTechnique: result.metadata.gearInfo?.fishingTechnique || "",
        weatherConditions: result.metadata.gearInfo?.weatherConditions || "",
        waterConditions: result.metadata.gearInfo?.waterConditions || "",
        seasonalUsage: result.metadata.gearInfo?.seasonalUsage || "",
        colorPattern: result.metadata.gearInfo?.colorPattern || "",
        actionType: result.metadata.gearInfo?.actionType || "",
        depthRange: result.metadata.gearInfo?.depthRange || "",
        versatility: result.metadata.gearInfo?.versatility || "",
        compatibleGear: result.metadata.gearInfo?.compatibleGear || "",
        // Debug information
        rawJsonResponse: result.metadata.gearInfo?.rawJsonResponse || "",
        openaiPrompt: result.metadata.gearInfo?.openaiPrompt || "",
      };

      // Add to user's gear collection
      const currentGear = profile?.gear_items || [];
      const updatedGear = [gearItem, ...currentGear];

      // Update profile with new gear
      const { error: updateError } = await updateProfile({
        gear_items: updatedGear,
      });

      if (updateError) {
        console.error(
          "[ProfilePage] Error updating profile with gear:",
          updateError,
        );
        setError("Failed to save gear. Please try again.");
        return;
      }

      log("[ProfilePage] Gear saved successfully");

      // Show success message with gear info
      if (
        result.metadata.gearInfo &&
        result.metadata.gearInfo.name !== "Unknown Gear"
      ) {
        const successMsg = `Gear uploaded! Identified: ${result.metadata.gearInfo.name} (${Math.round((result.metadata.gearInfo.confidence || 0) * 100)}% confident)`;
        setSuccess(successMsg);
      } else {
        setSuccess("Gear uploaded successfully!");
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("[ProfilePage] Gear upload failed:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to upload gear. Please try again.");
      }
    } finally {
      setUploadingGear(false);
      // Reset file input
      e.target.value = "";
    }
  };

  // Map gear type to category
  const mapGearTypeToCategory = (gearType: string): string => {
    const type = gearType.toLowerCase();
    if (
      type.includes("rod") ||
      type.includes("reel") ||
      type.includes("combo")
    ) {
      return "rods-reels";
    } else if (
      type.includes("lure") ||
      type.includes("jig") ||
      type.includes("spoon")
    ) {
      return "lures-jigs";
    } else if (type.includes("bait") || type.includes("chum")) {
      return "bait-chum";
    } else if (
      type.includes("electronic") ||
      type.includes("finder") ||
      type.includes("gps")
    ) {
      return "electronics";
    } else if (
      type.includes("accessory") ||
      type.includes("hook") ||
      type.includes("sinker") ||
      type.includes("swivel")
    ) {
      return "accessories";
    } else {
      return "other";
    }
  };

  const handleSharePhoto = async (index: number) => {
    try {
      const photo = uploadedPhotos[index];
      let photoUrl: string;
      let metadata: ImageMetadata | null = null;

      // Simplified extraction - all photos should be ImageMetadata objects now
      if (typeof photo === "string") {
        console.warn(
          `[ProfilePage] Legacy string photo in share function:`,
          photo,
        );
        const photoString = photo as string;
        if (photoString.startsWith("{") && photoString.includes('"url"')) {
          try {
            const parsed = JSON.parse(photoString);
            photoUrl = parsed.url || photo;
            metadata = parsed;
          } catch {
            photoUrl = photo;
          }
        } else {
          photoUrl = photo;
        }
      } else {
        photoUrl = photo.url || String(photo);
        metadata = photo as ImageMetadata;
      }

      // Check if Web Share API is available
      if (navigator.share) {
        try {
          let file: File;
          let shareText = "Check out this fish photo from Lishka!";

          // If we have metadata with fish info, export the overlay as an image
          if (metadata && (metadata.fishInfo || metadata.location)) {
            try {
              // Export the FishInfoOverlay as an image
              const overlayBlob = await exportFishInfoOverlayAsImage(
                metadata,
                photoUrl,
                {
                  quality: 0.9,
                },
              );

              file = new File([overlayBlob], "fish-catch-with-info.png", {
                type: "image/png",
              });

              // Create enhanced share text
              if (
                metadata?.fishInfo?.name &&
                metadata.fishInfo.name !== "Unknown"
              ) {
                shareText = `Check out this ${metadata.fishInfo.name} I caught! 🎣`;
                if (
                  metadata.fishInfo.estimatedSize &&
                  metadata.fishInfo.estimatedSize !== "Unknown"
                ) {
                  shareText += ` Size: ${metadata.fishInfo.estimatedSize}`;
                }
                if (
                  metadata.fishInfo.estimatedWeight &&
                  metadata.fishInfo.estimatedWeight !== "Unknown"
                ) {
                  shareText += ` Weight: ${metadata.fishInfo.estimatedWeight}`;
                }
              }
            } catch (exportError) {
              console.error(
                "[ProfilePage] Error exporting overlay:",
                exportError,
              );
              // Fallback to original image
              const response = await fetch(photoUrl);
              const blob = await response.blob();
              file = new File([blob], "fish-photo.jpg", { type: blob.type });
            }
          } else {
            // No metadata, use original image
            const response = await fetch(photoUrl);
            const blob = await response.blob();
            file = new File([blob], "fish-photo.jpg", { type: blob.type });
          }

          await navigator.share({
            title: "My Fish Catch",
            text: shareText,
            files: [file],
          });

          log("[ProfilePage] Photo with overlay shared successfully");
        } catch (shareError) {
          console.error("[ProfilePage] Error sharing photo:", shareError);
          // Fallback to copying URL
          await navigator.clipboard.writeText(photoUrl);
          setSuccess("Photo URL copied to clipboard!");
          setTimeout(() => setSuccess(null), 3000);
        }
      } else {
        // Fallback: copy URL to clipboard
        try {
          await navigator.clipboard.writeText(photoUrl);
          setSuccess("Photo URL copied to clipboard!");
          setTimeout(() => setSuccess(null), 3000);
        } catch (clipboardError) {
          console.error(
            "[ProfilePage] Error copying to clipboard:",
            clipboardError,
          );
          setError("Unable to share photo. Please try again.");
        }
      }

      // Close the menu
      setOpenMenuIndex(null);
    } catch (err) {
      console.error("[ProfilePage] Error sharing photo:", err);
      setError("Failed to share photo. Please try again.");
      setOpenMenuIndex(null);
    }
  };

  const handleEditAIInfo = (index: number) => {
    const photo = uploadedPhotos[index];
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
    setOpenMenuIndex(null);
  };

  const handleLocationSelect = (location: LocationData) => {
    setTempLocationData(location);
    if (editingMetadata) {
      setEditingMetadata({
        ...editingMetadata,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.name,
        },
      });
    }
    setShowLocationModal(false);
  };

  const handleSaveEditedAIInfo = async () => {
    if (editingPhotoIndex === null || !editingMetadata) return;

    try {
      setLoading(true);
      setError(null);

      // Update the photo in the array
      const updatedPhotos = [...uploadedPhotos];
      updatedPhotos[editingPhotoIndex] = editingMetadata;
      setUploadedPhotos(updatedPhotos);

      // Update the database
      const { error } = await updateProfile({ gallery_photos: updatedPhotos });

      if (error) {
        console.error("[ProfilePage] Error updating AI info:", error);
        setError("Failed to update AI info. Please try again.");
        return;
      }

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

  const handleDeletePhoto = async (index: number) => {
    try {
      setLoading(true);
      setError(null);

      log(`[ProfilePage] Deleting photo at index ${index}`);
      log(`[ProfilePage] Current photos count: ${uploadedPhotos.length}`);
      log(`[ProfilePage] Photo to delete:`, uploadedPhotos[index]);

      // Store original photos for potential revert
      const originalPhotos = [...uploadedPhotos];

      // Remove the photo from the array
      const updatedPhotos = uploadedPhotos.filter((_, i) => i !== index);
      log(`[ProfilePage] Updated photos count: ${updatedPhotos.length}`);

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
        log("[ProfilePage] Photo deleted successfully from database");
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

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError(
        `Photo must be less than 15MB (current: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      );
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

    // CRITICAL FIX: Request location permission FIRST, before any processing
    // This ensures location popup appears immediately for all images
    log("🔍 [PROFILE PAGE] Requesting location permission before processing:", {
      fileName: file.name,
      fileSize: file.size,
      fileSizeInMB: (file.size / (1024 * 1024)).toFixed(2),
    });

    let userLocation: { latitude: number; longitude: number } | null = null;
    try {
      // Import getCurrentLocation function
      const { getCurrentLocation } = await import("@/lib/image-metadata");

      // Request location with timeout - this will show the permission popup
      userLocation = await Promise.race([
        getCurrentLocation(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            log(
              "⏰ [PROFILE PAGE] Location request timeout - continuing without location",
            );
            reject(new Error("Location request timeout"));
          }, 10000); // 10 second timeout
        }),
      ]);

      log("✅ [PROFILE PAGE] Location permission granted:", userLocation);
    } catch (locationError) {
      log("ℹ️ [PROFILE PAGE] Location not available or denied:", {
        error: locationError.message,
        willContinueWithoutLocation: true,
      });
      // Continue without location - this is not a blocking error
    }

    // CRITICAL FIX: Compress image IMMEDIATELY after validation to prevent AI timeouts
    // This ensures ALL images (regardless of size) are compressed before AI processing
    let processedFile = file;
    let compressionInfo: any = undefined;

    // Always compress images larger than 2MB to prevent AI processing timeouts
    const shouldCompress = file.size > 2 * 1024 * 1024; // 2MB threshold

    if (shouldCompress) {
      try {
        log("🗜️ [PROFILE PAGE] Compressing large image before AI processing:", {
          originalSize: file.size,
          originalSizeInMB: (file.size / (1024 * 1024)).toFixed(2),
          fileName: file.name,
          fileType: file.type,
          reason: "Prevent AI timeout for large files",
        });

        // Import compression function dynamically
        const { compressImage } = await import("@/lib/image-metadata");

        // Use aggressive compression settings to ensure small file size for AI
        const compressionResult = await Promise.race([
          compressImage(
            file,
            800, // Smaller max width for AI processing
            800, // Smaller max height for AI processing
            0.7, // Lower quality for smaller file size
          ),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error("Image compression timeout"));
            }, 15000); // 15 second timeout for compression
          }),
        ]);

        processedFile = compressionResult.compressedFile;
        compressionInfo = compressionResult.compressionInfo;

        log("✅ [PROFILE PAGE] Large image compression completed:", {
          originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          compressedSize: `${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`,
          compressionRatio: `${compressionInfo.compressionRatio.toFixed(1)}%`,
          sizeDifference: `${((file.size - processedFile.size) / (1024 * 1024)).toFixed(2)}MB saved`,
          newSizeUnder2MB: processedFile.size < 2 * 1024 * 1024,
        });
      } catch (compressionError) {
        console.error(
          "❌ [PROFILE PAGE] Image compression failed for large file:",
          {
            error: compressionError.message,
            originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            willTryOriginalButMayTimeout: true,
          },
        );
        // Continue with original file but warn that AI processing may timeout
        setError(
          "Image compression failed. Large images may take longer to process.",
        );
        setTimeout(() => setError(null), 5000);
      }
    } else {
      log("ℹ️ [PROFILE PAGE] Image size acceptable, skipping compression:", {
        fileSize: file.size,
        fileSizeInMB: (file.size / (1024 * 1024)).toFixed(2),
        threshold: "2MB",
        reason: "File already small enough for AI processing",
      });
    }

    // Set overall timeout for the entire upload process
    const uploadTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Upload process timed out. Please try again."));
      }, 60000); // 60 second total timeout
    });

    const uploadProcess = async () => {
      try {
        log("[ProfilePage] Starting photo upload:", {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        // Check Supabase storage configuration
        const storageStatus = getSupabaseStorageStatus();
        log("[ProfilePage] Supabase storage status:", storageStatus);

        if (!storageStatus.configured) {
          const errorMessage = "Supabase storage is not properly configured";
          console.error(
            "[ProfilePage] Supabase storage not configured:",
            errorMessage,
          );
          throw new Error(errorMessage);
        }

        // Process image metadata (fish identification, location, etc.) with timeout
        // CRITICAL FIX: Use the pre-compressed file for ALL AI processing
        // This ensures consistent behavior regardless of original file size
        log(
          "🚀 [PROFILE DEBUG] Starting AI processing with pre-compressed file:",
          {
            originalFileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            processedFileSize: `${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`,
            compressionApplied: processedFile !== file,
            fileName: processedFile.name,
            hasPreObtainedLocation: !!userLocation,
            fileReadyForAI: processedFile.size < 5 * 1024 * 1024, // Should be under 5MB
            compressionInfo: compressionInfo
              ? {
                  ratio: compressionInfo.compressionRatio.toFixed(1) + "%",
                  originalDimensions: compressionInfo.originalDimensions,
                  compressedDimensions: compressionInfo.compressedDimensions,
                }
              : "No compression applied",
          },
        );
        const metadataStart = Date.now();

        const metadata = await Promise.race([
          processImageUpload(processedFile, userLocation),
          new Promise<ImageMetadata>((_, reject) => {
            setTimeout(() => {
              console.error(
                "⏰ [PROFILE DEBUG] Image processing timeout (60s) - even with compression",
                {
                  processedFileSize: `${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`,
                  originalFileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
                  compressionApplied: processedFile !== file,
                },
              );
              reject(new Error("Image processing timed out"));
            }, 60000); // Increased timeout since file should be compressed
          }),
        ]);

        // Add compression info to metadata if available
        if (compressionInfo) {
          metadata.compressionInfo = compressionInfo;
        }

        const metadataTime = Date.now() - metadataStart;
        log("✅ [PROFILE DEBUG] Image metadata processing completed", {
          processingTime: metadataTime,
          metadata,
          hasFishInfo: !!metadata.fishInfo,
          fishName: metadata.fishInfo?.name,
          confidence: metadata.fishInfo?.confidence,
          hasLocation: !!metadata.location,
        });

        // Upload the photo with timeout
        // CRITICAL FIX: Upload the compressed file instead of the original
        log("[ProfilePage] Uploading compressed photo to Supabase storage:", {
          fileSize: `${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`,
          fileName: processedFile.name,
          compressionApplied: processedFile !== file,
        });
        const photoUrl = await Promise.race([
          uploadImageToSupabase(processedFile, "fish-photos"),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error("Supabase photo upload timed out"));
            }, 30000);
          }),
        ]);
        log("[ProfilePage] Photo uploaded successfully to Supabase:", photoUrl);

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
        log("📢 [PROFILE DEBUG] Setting success message", {
          hasFishInfo: !!metadata.fishInfo,
          fishName: metadata.fishInfo?.name,
          isUnknownFish: metadata.fishInfo?.name === "Unknown",
        });

        if (metadata.fishInfo && metadata.fishInfo.name !== "Unknown") {
          const successMsg = `Photo uploaded! Identified: ${metadata.fishInfo.name} (${Math.round(metadata.fishInfo.confidence * 100)}% confident)`;
          log(
            "🎉 [PROFILE DEBUG] Fish identified - showing success with fish info:",
            successMsg,
          );
          setSuccess(successMsg);
        } else {
          const successMsg = "Photo uploaded successfully!";
          log(
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
    setValidationErrors({});

    try {
      // Skip email validation since email is now non-editable
      // Email updates are not allowed from this page

      // Validate and check username uniqueness if username is provided
      if (formData.username) {
        const isUsernameValid = await checkUsernameUniqueness(
          formData.username,
        );
        if (!isUsernameValid) {
          setLoading(false);
          return;
        }
      }

      log("Saving profile with data:", formData);

      // Email updates are not allowed from this page
      // Remove email from form data before updating profile
      const { email, ...profileUpdates } = formData;

      // Update profile data
      const { error } = await updateProfile(profileUpdates);
      log("Update profile result:", { error });

      if (error) {
        console.error("Profile update error:", error);
        setError(error.message || "Failed to update profile");
      } else {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        setIsEmailEditable(false);
        setTimeout(() => setSuccess(null), 5000);
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
      log("[ProfilePage] Initiating sign out");
      await signOut();
      // Navigation is now handled by the AuthContext signOut method
      log("[ProfilePage] Sign out completed");
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
    <div className="flex flex-col h-full dark:bg-background bg-[#ffffff]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 p-4 w-full lg:hidden border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-6 w-6" />
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
                    setValidationErrors({});
                    setIsEmailEditable(false);
                    setFormData({
                      full_name: profile?.full_name || "",
                      username: profile?.username || "",
                      email: user?.email || "",
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
                  disabled={
                    loading ||
                    checkingUsername ||
                    !!validationErrors.username ||
                    !!validationErrors.email
                  }
                >
                  <Save className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="size-full bg-[#0251FB] py-3 px-4 flex flex-col gap-y-2 h-fit z-20 fixed top-[69px]">
        <div className="h-[26px] w-full flex items-center justify-between">
          <p className="leading-snug text-white text-base">
            AI Analyzing Photo
          </p>
          <CheckIcon className="w-5 h-5 text-white" />
        </div>
        <div className="h-[26px] w-full flex items-center justify-between opacity-50">
          <p className="leading-snug text-white text-base">Photo Uploading</p>

          <LoaderIcon className="w-5 h-5 text-white" />
        </div>
        <div className="h-[26px] w-full flex items-center justify-between opacity-50">
          <p className="leading-snug text-white text-base">Photo Saved</p>
          <LoaderIcon className="w-5 h-5 text-white" />
        </div>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-4  w-full pb-20 lg:pb-4 h-full overflow-y-auto">
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
                    {isEditing && (
                      <div
                        className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                        onClick={handleAvatarClick}
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

                  {/* Name, Username, and Email */}
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
                        <div className="relative">
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => {
                              const newUsername = e.target.value.toLowerCase();
                              handleInputChange("username", newUsername);
                              // Trigger uniqueness check after a short delay
                              if (
                                newUsername &&
                                newUsername !== profile?.username
                              ) {
                                setTimeout(() => {
                                  if (formData.username === newUsername) {
                                    checkUsernameUniqueness(newUsername);
                                  }
                                }, 500);
                              }
                            }}
                            placeholder="Choose a username (lowercase, dots, underscores allowed)"
                            className={cn(
                              validationErrors.username
                                ? "border-red-500 focus-visible:ring-red-500"
                                : formData.username &&
                                    !validationErrors.username &&
                                    !checkingUsername &&
                                    formData.username !== profile?.username
                                  ? "border-green-500 focus-visible:ring-green-500"
                                  : "",
                            )}
                          />
                          {checkingUsername && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-xs text-blue-600 font-medium">
                                Checking...
                              </span>
                            </div>
                          )}
                          {!checkingUsername &&
                            formData.username &&
                            !validationErrors.username &&
                            formData.username !== profile?.username && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs text-green-600 font-medium">
                                  Available
                                </span>
                              </div>
                            )}
                        </div>
                        {validationErrors.username && (
                          <div className="flex items-center gap-2 mt-1">
                            <X className="w-4 h-4 text-red-500" />
                            <p className="text-sm text-red-600">
                              {validationErrors.username}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Only lowercase letters, numbers, dots (.) and
                          underscores (_) allowed
                        </p>
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
                className="flex-1 border-none shadow-none text-gray-800 font-medium py-4 h-auto flex items-center justify-center gap-2 rounded-lg"
                style={{ backgroundColor: "#025DFB0D" }}
                onClick={() => navigate("/my-gear")}
              >
                My gear
                {profile?.gear_items &&
                  Array.isArray(profile.gear_items) &&
                  profile.gear_items.length > 0 && (
                    <Badge className="bg-blue-600 hover:bg-blue-600 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-sm font-medium">
                      {profile.gear_items.length}
                    </Badge>
                  )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-none shadow-none text-gray-800 font-medium py-4 h-auto flex items-center justify-center gap-2 rounded-lg"
                style={{ backgroundColor: "#025DFB0D" }}
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
                    className={`bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex-col relative transition-colors flex items-center justify-center disabled:opacity-50 touch-manipulation ${
                      isSingleColumn ? "h-20 rounded-lg mb-2" : "aspect-square"
                    }`}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}
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
                    // All photos should now be ImageMetadata objects - simplified parsing
                    let photoUrl: string;
                    let metadata: ImageMetadata | null = null;

                    // Handle legacy data that might still be strings
                    if (typeof photo === "string") {
                      console.warn(
                        `[ProfilePage] Legacy string photo detected at index ${index}:`,
                        photo,
                      );
                      // Check if it's a JSON string that needs parsing
                      const photoString = photo as string;
                      if (
                        photoString.startsWith("{") &&
                        photoString.includes('"url"')
                      ) {
                        try {
                          const parsed = JSON.parse(photoString);
                          photoUrl = parsed.url || photo;
                          metadata = parsed;
                          log(
                            `[ProfilePage] Parsed legacy metadata for photo ${index}:`,
                            metadata,
                          );
                        } catch (parseError) {
                          console.warn(
                            `[ProfilePage] Failed to parse legacy photo metadata at index ${index}:`,
                            parseError,
                          );
                          photoUrl = photo;
                          // Create minimal metadata for legacy string URLs
                          metadata = {
                            url: photo,
                            timestamp: new Date().toISOString(),
                            fishInfo: {
                              name: "Unknown",
                              estimatedSize: "Unknown",
                              estimatedWeight: "Unknown",
                              confidence: 0,
                            },
                          };
                        }
                      } else {
                        photoUrl = photo;
                        // Create minimal metadata for plain string URLs
                        metadata = {
                          url: photo,
                          timestamp: new Date().toISOString(),
                          fishInfo: {
                            name: "Unknown",
                            estimatedSize: "Unknown",
                            estimatedWeight: "Unknown",
                            confidence: 0,
                          },
                        };
                      }
                    } else {
                      // Standard case - photo is already an ImageMetadata object
                      photoUrl = photo.url || String(photo);
                      metadata = photo as ImageMetadata;
                      log(
                        `[ProfilePage] Standard metadata for photo ${index}:`,
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
                          id="fish-info-overlay-container"
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
                              log(
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
                              log(
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

                          {/* Fish Info Overlay - Use FishInfoOverlay component - Only show in single column */}
                          {!isLoading &&
                            !hasError &&
                            metadata &&
                            isSingleColumn && (
                              <FishInfoOverlay
                                metadata={metadata}
                                isSingleColumn={isSingleColumn}
                              />
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
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSharePhoto(index);
                                  }}
                                  disabled={loading}
                                >
                                  <Share className="w-4 h-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAIInfo(index);
                                  }}
                                  disabled={loading}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit AI Info
                                </DropdownMenuItem>
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
                  disabled={uploadingPhoto}
                  key="camera-input"
                />
              </TabsContent>

              <TabsContent value="achievements" className="mt-4">
                <Card className="bg-white dark:bg-gray-800 border border-[#e8e8e9]">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center text-center py-12">
                      <Trophy className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
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
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      Fishing Trips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center text-center py-12">
                      <MapIcon className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
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
      {/* Edit AI Info Dialog */}
      <Dialog open={showEditAIDialog} onOpenChange={setShowEditAIDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95%] mx-auto rounded-lg max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
              <p className="text-xs text-blue-800 dark:text-blue-200">
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
