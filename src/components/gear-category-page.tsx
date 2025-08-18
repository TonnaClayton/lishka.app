import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  Package,
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  Edit3,
  MoreVertical,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/auth-context";
import {
  uploadGearImage,
  GearUploadResult,
  GearMetadata,
} from "@/lib/gear-upload-service";
import BottomNav from "./bottom-nav";
import { log } from "@/lib/logging";

// Gear categories as specified
const GEAR_CATEGORIES = [
  { id: "rods-reels", name: "Rods & Reels", icon: "🎣" },
  { id: "lures-jigs", name: "Lures & Jigs", icon: "🪝" },
  { id: "bait-chum", name: "Bait & Chum", icon: "🐟" },
  { id: "accessories", name: "Fishing Accessories", icon: "🧰" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "other", name: "Other", icon: "📦" },
];

// Gear item interface
interface GearItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  brand?: string;
  model?: string;
  price?: string;
  purchaseDate?: string;
  condition?: string;
  imageUrl: string;
  timestamp: string;
  userConfirmed?: boolean;
  gearType?: string;
  estimatedValue?: string;
  aiConfidence?: number;
  // Enhanced fields for all categories
  size?: string;
  weight?: string;
  targetFish?: string;
  fishingTechnique?: string;
  weatherConditions?: string;
  waterConditions?: string;
  seasonalUsage?: string;
  colorPattern?: string;
  actionType?: string;
  depthRange?: string;
  versatility?: string;
  compatibleGear?: string;
  // Category-specific fields
  gearRatio?: string;
  bearings?: string;
  dragSystem?: string;
  lineCapacity?: string;
  construction?: string;
  features?: string;
  action?: string;
  power?: string;
  lineWeight?: string;
  lureWeight?: string;
  handle?: string;
  capacity?: string;
  material?: string;
  waterResistant?: string;
  compartments?: string;
  usage?: string;
  sharpness?: string;
  durability?: string;
  baitType?: string;
  scent?: string;
  color?: string;
  waterType?: string;
  season?: string;
  technique?: string;
  screenSize?: string;
  frequency?: string;
  maxDepth?: string;
  gps?: string;
  transducer?: string;
  powerSource?: string;
  mounting?: string;
  accuracy?: string;
  display?: string;
  battery?: string;
  insulation?: string;
  exterior?: string;
  iceRetention?: string;
  portability?: string;
  pockets?: string;
  fit?: string;
  // Debug information
  rawJsonResponse?: string;
  openaiPrompt?: string;
}

const GearCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingGear, setUploadingGear] = useState(false);
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [gearLoaded, setGearLoaded] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGearIndex, setEditingGearIndex] = useState<number | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    description: "",
    brand: "",
    model: "",
    price: "",
    condition: "",
    size: "",
    weight: "",
    targetFish: "",
    fishingTechnique: "",
    weatherConditions: "",
    waterConditions: "",
    seasonalUsage: "",
    colorPattern: "",
    actionType: "",
    depthRange: "",
    versatility: "",
    compatibleGear: "",
  });
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(
    null,
  );

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get current category info
  const currentCategory = GEAR_CATEGORIES.find((cat) => cat.id === categoryId);

  // Mock data for testing different categories
  const getMockDataForCategory = (categoryId: string): GearItem[] => {
    const baseImageUrl =
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80";

    switch (categoryId) {
      case "rods-reels":
        return [
          {
            id: "rod-1",
            name: "Shimano Stradic CI4+ Spinning Reel",
            category: "rods-reels",
            brand: "Shimano",
            model: "Stradic CI4+",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Spinning Reel",
            size: "3000 Series",
            weight: "7.4 oz",
            targetFish: "Bass, Trout, Walleye",
            fishingTechnique: "Spinning, Finesse fishing",
            gearRatio: "6.0:1",
            bearings: "6+1 Ball Bearings",
            dragSystem: "Front Drag",
            lineCapacity: "8lb/140yd, 10lb/120yd",
            construction: "CI4+ Body Material",
            features: "X-Ship Technology, Hagane Gear",
          },
          {
            id: "rod-2",
            name: "St. Croix Bass X Casting Rod",
            category: "rods-reels",
            brand: "St. Croix",
            model: "Bass X",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Casting Rod",
            size: "7'0\"",
            weight: "4.2 oz",
            targetFish: "Bass, Pike",
            fishingTechnique: "Baitcasting, Heavy lures",
            action: "Medium Heavy",
            power: "Fast Action",
            lineWeight: "12-20 lb",
            lureWeight: "1/4 - 3/4 oz",
            construction: "Premium SCII Graphite",
            handle: "Premium Cork Handle",
          },
        ];

      case "accessories":
        return [
          {
            id: "acc-1",
            name: "Plano 3700 Tackle Box",
            category: "accessories",
            brand: "Plano",
            model: "3700",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Tackle Storage",
            size: '14" x 9" x 2"',
            weight: "1.5 lbs",
            capacity: "Multiple compartments",
            material: "Durable Plastic",
            features: "Adjustable dividers, Secure latches",
            waterResistant: "Yes",
            compartments: "4-24 adjustable compartments",
            usage: "Lure and tackle organization",
          },
          {
            id: "acc-2",
            name: "Berkley Braid Scissors",
            category: "accessories",
            brand: "Berkley",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Cutting Tool",
            size: "4 inches",
            weight: "2 oz",
            material: "Stainless Steel",
            features: "Serrated edge, Ergonomic grip",
            usage: "Cutting braid and mono lines",
            sharpness: "Precision cutting edge",
            durability: "Corrosion resistant",
          },
        ];

      case "bait-chum":
        return [
          {
            id: "bait-1",
            name: "Berkley PowerBait Trout Nuggets",
            category: "bait-chum",
            brand: "Berkley",
            model: "PowerBait",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Artificial Bait",
            size: "1.75 oz jar",
            targetFish: "Trout, Salmon",
            baitType: "Dough Bait",
            scent: "Garlic scented",
            color: "Rainbow",
            waterType: "Freshwater",
            season: "Year-round",
            technique: "Still fishing, Bottom fishing",
          },
          {
            id: "bait-2",
            name: "Gulp! Saltwater Shrimp",
            category: "bait-chum",
            brand: "Berkley",
            model: "Gulp!",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Soft Plastic Bait",
            size: "3 inch",
            targetFish: "Redfish, Snook, Trout",
            baitType: "Soft Plastic",
            scent: "Natural shrimp scent",
            color: "New Penny",
            waterType: "Saltwater",
            season: "Year-round",
            technique: "Jigging, Carolina rig",
          },
        ];

      case "electronics":
        return [
          {
            id: "elec-1",
            name: "Garmin Striker 4 Fish Finder",
            category: "electronics",
            brand: "Garmin",
            model: "Striker 4",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Fish Finder",
            screenSize: "3.5 inch",
            frequency: "77/200 kHz",
            maxDepth: "1,600 ft freshwater",
            gps: "Built-in GPS",
            transducer: "Dual-beam transducer",
            features: "CHIRP sonar, Waypoint marking",
            powerSource: "12V DC",
            mounting: "Tilt/swivel mount included",
          },
          {
            id: "elec-2",
            name: "Piscifun Fishing Scale",
            category: "electronics",
            brand: "Piscifun",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Digital Scale",
            capacity: "110 lb / 50 kg",
            accuracy: "±0.2 lb",
            display: "LCD with backlight",
            features: "Data lock, Tare function",
            battery: "2 AAA batteries",
            material: "Stainless steel hook",
            waterResistant: "Yes",
          },
        ];

      case "other":
        return [
          {
            id: "other-1",
            name: "Yeti Hopper Flip 12 Cooler",
            category: "other",
            brand: "Yeti",
            model: "Hopper Flip 12",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Soft Cooler",
            capacity: "12 cans",
            weight: "3.1 lbs",
            insulation: "ColdCell Insulation",
            exterior: "DryHide Shell",
            features: "Leakproof, HydroLok Zipper",
            iceRetention: "24+ hours",
            portability: "Carry handle and shoulder strap",
          },
          {
            id: "other-2",
            name: "Patagonia Fishing Vest",
            category: "other",
            brand: "Patagonia",

            imageUrl: baseImageUrl,
            timestamp: new Date().toISOString(),
            gearType: "Fishing Vest",
            size: "Large",
            material: "Recycled polyester",
            pockets: "15 pockets total",
            features: "Quick-dry, UPF 50+",
            waterResistant: "DWR finish",
            season: "All seasons",
            fit: "Regular fit",
          },
        ];

      default:
        return [];
    }
  };

  // Load gear items from profile on component mount
  useEffect(() => {
    const loadGearItems = async () => {
      try {
        const gearId = searchParams.get("gearId");
        log("[GearCategoryPage] 🔍 DETAILED LOADING DEBUG:", {
          hasUser: !!user?.id,
          userId: user?.id,
          hasProfile: !!profile,
          profileId: profile?.id,
          profileGearItems: profile?.gear_items,
          profileGearItemsType: typeof profile?.gear_items,
          profileGearItemsLength: profile?.gear_items?.length,
          categoryId,
          gearId,
          currentUrl: window.location.href,
        });

        if (!profile && user?.id) {
          log("[GearCategoryPage] Profile not loaded yet, waiting...");
          return;
        }

        let categoryGear: GearItem[] = [];

        if (profile?.gear_items && Array.isArray(profile.gear_items)) {
          log("[GearCategoryPage] 🔍 PROCESSING GEAR ITEMS:", {
            totalGearCount: profile.gear_items.length,
            allGearItems: profile.gear_items.map((item, index) => ({
              index,
              id: item.id,
              name: item.name,
              category: item.category,
              hasRawJsonResponse: !!item.rawJsonResponse,
              hasOpenaiPrompt: !!item.openaiPrompt,
              aiConfidence: item.aiConfidence,
            })),
          });

          // Filter gear items by category
          categoryGear = profile.gear_items.filter(
            (item: GearItem) => item.category === categoryId,
          );

          log("[GearCategoryPage] 🔍 FILTERED GEAR FOR CATEGORY:", {
            categoryId,
            filteredCount: categoryGear.length,
            filteredItems: categoryGear.map((item, index) => ({
              index,
              id: item.id,
              name: item.name,
              category: item.category,
              hasRawJsonResponse: !!item.rawJsonResponse,
              rawJsonResponsePreview: item.rawJsonResponse?.substring(0, 100),
              hasOpenaiPrompt: !!item.openaiPrompt,
              openaiPromptPreview: item.openaiPrompt?.substring(0, 100),
              aiConfidence: item.aiConfidence,
            })),
          });
        }

        // If no real gear items, use mock data for testing
        if (categoryGear.length === 0 && categoryId) {
          categoryGear = getMockDataForCategory(categoryId);
          log(
            "[GearCategoryPage] Using mock data for category:",
            categoryId,
            categoryGear.length,
          );
        }

        setGearItems(categoryGear);

        // Auto-expand the specific gear item if gearId is provided
        if (gearId) {
          const gearIndex = categoryGear.findIndex(
            (item) => item.id === gearId,
          );
          if (gearIndex !== -1) {
            log(
              `[GearCategoryPage] Auto-expanding gear at index ${gearIndex} with ID ${gearId}`,
            );
            setExpandedCardIndex(gearIndex);
          } else {
            console.warn(
              `[GearCategoryPage] Gear with ID ${gearId} not found in category ${categoryId}`,
            );
          }
        }
      } catch (error) {
        console.error("[GearCategoryPage] Error loading gear items:", error);
        // Fallback to mock data on error
        if (categoryId) {
          setGearItems(getMockDataForCategory(categoryId));
        } else {
          setGearItems([]);
        }
      } finally {
        setGearLoaded(true);
      }
    };

    if (user?.id) {
      loadGearItems();
    } else {
      log("[GearCategoryPage] No user ID, setting gear loaded to true");
      setGearLoaded(true);
    }
  }, [user?.id, profile?.gear_items, profile?.id, categoryId, searchParams]);

  // Simplified save function - only save when explicitly called
  const saveGearToDatabase = async (newGearList: GearItem[]) => {
    if (!user?.id || !profile) {
      console.error("[GearCategoryPage] Cannot save - missing user or profile");
      return { error: { message: "User not authenticated" } };
    }

    try {
      log("[GearCategoryPage] Saving gear to database:", {
        categoryId,
        newGearCount: newGearList.length,
        gearItems: newGearList.map((g) => ({ id: g.id, name: g.name })),
      });

      // Get current full gear list and replace items for this category
      const currentGear = profile?.gear_items || [];
      const otherCategoryGear = currentGear.filter(
        (item: GearItem) => item.category !== categoryId,
      );
      const finalGearList = [...otherCategoryGear, ...newGearList];

      const { error } = await updateProfile({
        gear_items: finalGearList,
      });

      if (error) {
        console.error("[GearCategoryPage] Database save failed:", error);
        return { error };
      }

      log("[GearCategoryPage] Gear saved successfully");
      return { error: null };
    } catch (error) {
      console.error("[GearCategoryPage] Exception saving gear:", error);
      return { error: { message: "Failed to save gear" } };
    }
  };

  // Handle gear editing
  const handleEditGear = (index: number) => {
    const gear = gearItems[index];
    setEditFormData({
      name: gear.name,
      category: gear.category,
      description: gear.description || "",
      brand: gear.brand || "",
      model: gear.model || "",
      price: gear.price || "",
      condition: gear.condition || "",
      size: gear.size || "",
      weight: gear.weight || "",
      targetFish: gear.targetFish || "",
      fishingTechnique: gear.fishingTechnique || "",
      weatherConditions: gear.weatherConditions || "",
      waterConditions: gear.waterConditions || "",
      seasonalUsage: gear.seasonalUsage || "",
      colorPattern: gear.colorPattern || "",
      actionType: gear.actionType || "",
      depthRange: gear.depthRange || "",
      versatility: gear.versatility || "",
      compatibleGear: gear.compatibleGear || "",
    });
    setEditingGearIndex(index);
    setShowEditDialog(true);
    setOpenMenuIndex(null);
  };

  const handleSaveEdit = async () => {
    if (editingGearIndex === null) return;

    try {
      setLoading(true);
      setError(null);

      const updatedGear = [...gearItems];
      updatedGear[editingGearIndex] = {
        ...updatedGear[editingGearIndex],
        name: editFormData.name,
        category: editFormData.category,
        description: editFormData.description,
        brand: editFormData.brand,
        model: editFormData.model,

        price: editFormData.price,
        condition: editFormData.condition,
        size: editFormData.size,
        weight: editFormData.weight,
        targetFish: editFormData.targetFish,
        fishingTechnique: editFormData.fishingTechnique,
        weatherConditions: editFormData.weatherConditions,
        waterConditions: editFormData.waterConditions,
        seasonalUsage: editFormData.seasonalUsage,
        colorPattern: editFormData.colorPattern,
        actionType: editFormData.actionType,
        depthRange: editFormData.depthRange,
        versatility: editFormData.versatility,
        compatibleGear: editFormData.compatibleGear,
        userConfirmed: true,
      };

      // Save to database first
      const saveResult = await saveGearToDatabase(updatedGear);

      if (saveResult.error) {
        console.error(
          "[GearCategoryPage] Failed to save updated gear:",
          saveResult.error,
        );
        setError("Failed to update gear. Please try again.");
        return;
      }

      // Update state only after successful save
      setGearItems(updatedGear);
      setShowEditDialog(false);
      setEditingGearIndex(null);
      setSuccess("Gear updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("[GearCategoryPage] Error updating gear:", error);
      setError("Failed to update gear. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGear = async (index: number) => {
    try {
      setLoading(true);
      setError(null);

      const updatedGear = gearItems.filter((_, i) => i !== index);

      // Save to database first
      const saveResult = await saveGearToDatabase(updatedGear);

      if (saveResult.error) {
        console.error(
          "[GearCategoryPage] Failed to delete gear:",
          saveResult.error,
        );
        setError("Failed to delete gear. Please try again.");
        return;
      }

      // Update state only after successful save
      setGearItems(updatedGear);
      setOpenMenuIndex(null);
      setSuccess("Gear deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("[GearCategoryPage] Error deleting gear:", error);
      setError("Failed to delete gear. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-background">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading gear...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if no user or invalid category
  if (!user || !currentCategory) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 p-4 w-full lg:hidden border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2 dark:text-white">
              {currentCategory.name}
            </h1>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full pb-20 lg:pb-4 h-full overflow-y-auto">
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

          {/* Gear Items */}
          {gearItems.length > 0 ? (
            <div className="space-y-3">
              {gearItems.map((gear, index) => {
                const isExpanded = expandedCardIndex === index;
                return (
                  <div
                    key={gear.id}
                    ref={(el) => (cardRefs.current[index] = el)}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm cursor-pointer overflow-hidden ${
                      isExpanded
                        ? "p-6 transition-all duration-300 ease-in-out"
                        : "p-4"
                    }`}
                    onClick={() => {
                      if (!isExpanded) {
                        setExpandedCardIndex(index);
                        // Scroll to the top of the card after a brief delay to allow for expansion
                        setTimeout(() => {
                          cardRefs.current[index]?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }, 100);
                      } else {
                        setExpandedCardIndex(null);
                      }
                      setOpenMenuIndex(null);
                    }}
                  >
                    {!isExpanded ? (
                      // Compact Card View
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                          <img
                            src={gear.imageUrl}
                            alt={gear.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg leading-tight line-clamp-1">
                            {gear.name}
                          </h4>
                          {gear.brand && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 leading-tight line-clamp-1">
                              {gear.brand}
                              {gear.model && ` ${gear.model}`}
                            </p>
                          )}

                          {/* Main info badges */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 overflow-hidden">
                            {gear.size && (
                              <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium truncate max-w-[60px] sm:max-w-[80px]">
                                {gear.size}
                              </span>
                            )}
                            {gear.weight && (
                              <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium truncate max-w-[60px] sm:max-w-[80px]">
                                {gear.weight}
                              </span>
                            )}
                            {gear.targetFish && (
                              <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium truncate max-w-[80px] sm:max-w-[100px]">
                                {gear.targetFish.split(",")[0].trim()}
                                {gear.targetFish.includes(",") && "..."}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
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
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 sm:p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0"
                              >
                                <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditGear(index);
                                }}
                                className="cursor-pointer"
                                disabled={loading}
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGear(index);
                                }}
                                className="cursor-pointer text-red-600"
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ) : (
                      // Expanded Card View
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 break-words">
                              {gear.name}
                            </h3>
                            {gear.brand && (
                              <p className="text-gray-600 dark:text-gray-300 mb-3 break-words">
                                {gear.brand}
                                {gear.model && ` ${gear.model}`}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
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
                                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 flex items-center justify-center"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditGear(index);
                                  }}
                                  className="cursor-pointer"
                                  disabled={loading}
                                >
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteGear(index);
                                  }}
                                  className="cursor-pointer text-red-600"
                                  disabled={loading}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {/* Large Image */}
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-600 max-w-full">
                          <img
                            src={gear.imageUrl}
                            alt={gear.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Detailed Information */}
                        <div className="grid grid-cols-1 gap-4 max-w-full overflow-hidden">
                          {/* Primary specs */}
                          <div className="grid grid-cols-2 gap-3">
                            {gear.size && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                  Size
                                </div>
                                <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                  {gear.size}
                                </div>
                              </div>
                            )}
                            {gear.weight && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                  Weight
                                </div>
                                <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                  {gear.weight}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Target Fish */}
                          {gear.targetFish && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                Target Fish
                              </div>
                              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                {gear.targetFish}
                              </div>
                            </div>
                          )}

                          {/* Category-specific Details */}
                          <div className="space-y-3">
                            {/* Rods & Reels specific fields */}
                            {categoryId === "rods-reels" && (
                              <>
                                {gear.gearRatio && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Gear Ratio
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.gearRatio}
                                    </div>
                                  </div>
                                )}
                                {gear.bearings && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Bearings
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.bearings}
                                    </div>
                                  </div>
                                )}
                                {gear.dragSystem && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Drag System
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.dragSystem}
                                    </div>
                                  </div>
                                )}
                                {gear.lineCapacity && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Line Capacity
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.lineCapacity}
                                    </div>
                                  </div>
                                )}
                                {gear.action && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Action
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.action}
                                    </div>
                                  </div>
                                )}
                                {gear.power && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Power
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.power}
                                    </div>
                                  </div>
                                )}
                                {gear.lineWeight && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Line Weight
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.lineWeight}
                                    </div>
                                  </div>
                                )}
                                {gear.lureWeight && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Lure Weight
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.lureWeight}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Accessories specific fields */}
                            {categoryId === "accessories" && (
                              <>
                                {gear.capacity && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Capacity
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.capacity}
                                    </div>
                                  </div>
                                )}
                                {gear.compartments && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Compartments
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.compartments}
                                    </div>
                                  </div>
                                )}
                                {gear.waterResistant && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Water Resistant
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.waterResistant}
                                    </div>
                                  </div>
                                )}
                                {gear.usage && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Usage
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.usage}
                                    </div>
                                  </div>
                                )}
                                {gear.durability && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Durability
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.durability}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Bait & Chum specific fields */}
                            {categoryId === "bait-chum" && (
                              <>
                                {gear.baitType && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Bait Type
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.baitType}
                                    </div>
                                  </div>
                                )}
                                {gear.scent && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Scent
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.scent}
                                    </div>
                                  </div>
                                )}
                                {gear.color && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Color
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.color}
                                    </div>
                                  </div>
                                )}
                                {gear.waterType && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Water Type
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.waterType}
                                    </div>
                                  </div>
                                )}
                                {gear.technique && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Technique
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.technique}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Electronics specific fields */}
                            {categoryId === "electronics" && (
                              <>
                                {gear.screenSize && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Screen Size
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.screenSize}
                                    </div>
                                  </div>
                                )}
                                {gear.frequency && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Frequency
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.frequency}
                                    </div>
                                  </div>
                                )}
                                {gear.maxDepth && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Max Depth
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.maxDepth}
                                    </div>
                                  </div>
                                )}
                                {gear.gps && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      GPS
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.gps}
                                    </div>
                                  </div>
                                )}
                                {gear.accuracy && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Accuracy
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.accuracy}
                                    </div>
                                  </div>
                                )}
                                {gear.battery && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Battery
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.battery}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Other category specific fields */}
                            {categoryId === "other" && (
                              <>
                                {gear.insulation && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Insulation
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.insulation}
                                    </div>
                                  </div>
                                )}
                                {gear.iceRetention && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Ice Retention
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.iceRetention}
                                    </div>
                                  </div>
                                )}
                                {gear.pockets && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Pockets
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.pockets}
                                    </div>
                                  </div>
                                )}
                                {gear.fit && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Fit
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.fit}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Lures & Jigs specific fields */}
                            {categoryId === "lures-jigs" && (
                              <>
                                {gear.fishingTechnique && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Technique
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.fishingTechnique}
                                    </div>
                                  </div>
                                )}
                                {gear.depthRange && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Depth Range
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.depthRange}
                                    </div>
                                  </div>
                                )}
                                {gear.colorPattern && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Color Pattern
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.colorPattern}
                                    </div>
                                  </div>
                                )}
                                {gear.actionType && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Action Type
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.actionType}
                                    </div>
                                  </div>
                                )}
                                {gear.versatility && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Versatility
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.versatility}
                                    </div>
                                  </div>
                                )}
                                {gear.compatibleGear && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                      Compatible Gear
                                    </div>
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                      {gear.compatibleGear}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Common fields for all categories */}
                            {gear.fishingTechnique &&
                              categoryId !== "lures-jigs" && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                    Fishing Technique
                                  </div>
                                  <div className="text-sm text-blue-900 dark:text-blue-100">
                                    {gear.fishingTechnique}
                                  </div>
                                </div>
                              )}

                            {gear.construction && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                  Construction
                                </div>
                                <div className="text-sm text-blue-900 dark:text-blue-100">
                                  {gear.construction}
                                </div>
                              </div>
                            )}

                            {gear.material && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                  Material
                                </div>
                                <div className="text-sm text-blue-900 dark:text-blue-100">
                                  {gear.material}
                                </div>
                              </div>
                            )}

                            {gear.features && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                  Features
                                </div>
                                <div className="text-sm text-blue-900 dark:text-blue-100">
                                  {gear.features}
                                </div>
                              </div>
                            )}

                            {gear.season && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                  Season
                                </div>
                                <div className="text-sm text-blue-900 dark:text-blue-100">
                                  {gear.season}
                                </div>
                              </div>
                            )}

                            {/* Standard description fallback */}
                            {gear.description && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                  Description
                                </div>
                                <div className="text-sm text-blue-900 dark:text-blue-100">
                                  {gear.description}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No gear in this category yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Add gear from your profile page to see items in this category.
              </p>
              <Button
                onClick={() => navigate("/profile")}
                className="border-none shadow-none text-gray-800 font-medium py-4 h-auto"
                style={{ backgroundColor: "#025DFB0D" }}
              >
                Go to Profile
                <Plus className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
      {/* Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
      {/* Edit Gear Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md px-6 py-6 max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Gear Information
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="gearName" className="text-xs">
                Gear Name
              </Label>
              <Input
                id="gearName"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter gear name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gearCategory" className="text-xs">
                Category
              </Label>
              <select
                id="gearCategory"
                value={editFormData.category}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {GEAR_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gearBrand" className="text-xs">
                  Brand
                </Label>
                <Input
                  id="gearBrand"
                  value={editFormData.brand}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      brand: e.target.value,
                    }))
                  }
                  placeholder="Brand"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gearModel" className="text-xs">
                  Model
                </Label>
                <Input
                  id="gearModel"
                  value={editFormData.model}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      model: e.target.value,
                    }))
                  }
                  placeholder="Model"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gearCondition" className="text-xs">
                Condition
              </Label>
              <select
                id="gearCondition"
                value={editFormData.condition}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    condition: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            {/* Enhanced fields for lures & jigs */}
            {editFormData.category === "lures-jigs" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gearSize">Size</Label>
                    <Input
                      id="gearSize"
                      value={editFormData.size}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          size: e.target.value,
                        }))
                      }
                      placeholder="e.g., 3 inches"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gearWeight">Weight</Label>
                    <Input
                      id="gearWeight"
                      value={editFormData.weight}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          weight: e.target.value,
                        }))
                      }
                      placeholder="e.g., 0.5 oz"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gearTargetFish">Target Fish</Label>
                  <Input
                    id="gearTargetFish"
                    value={editFormData.targetFish}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        targetFish: e.target.value,
                      }))
                    }
                    placeholder="e.g., Bass, Pike, Trout"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gearFishingTechnique">
                    Fishing Technique
                  </Label>
                  <Input
                    id="gearFishingTechnique"
                    value={editFormData.fishingTechnique}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        fishingTechnique: e.target.value,
                      }))
                    }
                    placeholder="e.g., Casting and retrieving"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gearColorPattern">Color Pattern</Label>
                    <Input
                      id="gearColorPattern"
                      value={editFormData.colorPattern}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          colorPattern: e.target.value,
                        }))
                      }
                      placeholder="e.g., Silver with blue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gearActionType">Action Type</Label>
                    <Input
                      id="gearActionType"
                      value={editFormData.actionType}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          actionType: e.target.value,
                        }))
                      }
                      placeholder="e.g., Wobbling action"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gearDepthRange">Depth Range</Label>
                  <Input
                    id="gearDepthRange"
                    value={editFormData.depthRange}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        depthRange: e.target.value,
                      }))
                    }
                    placeholder="e.g., 2-6 feet"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gearWeatherConditions">
                      Weather Conditions
                    </Label>
                    <Input
                      id="gearWeatherConditions"
                      value={editFormData.weatherConditions}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          weatherConditions: e.target.value,
                        }))
                      }
                      placeholder="e.g., Overcast skies"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gearWaterConditions">
                      Water Conditions
                    </Label>
                    <Input
                      id="gearWaterConditions"
                      value={editFormData.waterConditions}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          waterConditions: e.target.value,
                        }))
                      }
                      placeholder="e.g., Clear water"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gearSeasonalUsage">Seasonal Usage</Label>
                  <Input
                    id="gearSeasonalUsage"
                    value={editFormData.seasonalUsage}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        seasonalUsage: e.target.value,
                      }))
                    }
                    placeholder="e.g., Spring through fall"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gearVersatility">Versatility</Label>
                  <Input
                    id="gearVersatility"
                    value={editFormData.versatility}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        versatility: e.target.value,
                      }))
                    }
                    placeholder="e.g., Highly versatile for multiple species"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gearCompatibleGear">Compatible Gear</Label>
                  <Input
                    id="gearCompatibleGear"
                    value={editFormData.compatibleGear}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        compatibleGear: e.target.value,
                      }))
                    }
                    placeholder="e.g., Medium action rods, spinning reels"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="gearDescription" className="text-xs">
                Description
              </Label>
              <textarea
                id="gearDescription"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Additional details about this gear..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={loading}
              className="flex-1 h-11 rounded-full bg-[#E6EFFF] text-[#0251FB]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={loading}
              className="flex-1 bg-[#0251FB] rounded-full h-11"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <></>
              )}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GearCategoryPage;
