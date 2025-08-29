import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAuth } from "@/contexts/auth-context";
import BottomNav from "@/components/bottom-nav";
import { log } from "@/lib/logging";
import { GearItem, toGearItem } from "@/lib/gear";
import { useDeleteGear } from "@/hooks/queries";
import GearItemCard from "./gear-item-card";
import { GEAR_CATEGORIES } from "./my-gear";

const GearCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  // const fileInputRef = useRef<HTMLInputElement>(null);
  // const cameraInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // const [uploadingGear, setUploadingGear] = useState(false);

  const deleteGear = useDeleteGear();

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

  const gearItems = useMemo(() => {
    const gearItems =
      profile?.gear_items && Array.isArray(profile.gear_items)
        ? profile.gear_items.map(toGearItem)
        : [];

    const categoryGear = gearItems.filter(
      (item: GearItem) => item.category === categoryId,
    );

    if (categoryGear.length === 0 && categoryId) {
      return getMockDataForCategory(categoryId);
    }

    return categoryGear;
  }, [profile?.gear_items]);

  // Load gear items from profile on component mount
  useEffect(() => {
    if (user?.id) {
      //const gearId = searchParams.get("gearId");
      // If no real gear items, use mock data for testing
      // Auto-expand the specific gear item if gearId is provided
      // if (gearId) {
      //   const gearIndex = categoryGear.findIndex(
      //     (item) => item.id === gearId
      //   );
      //   if (gearIndex !== -1) {
      //     log(
      //       `[GearCategoryPage] Auto-expanding gear at index ${gearIndex} with ID ${gearId}`
      //     );
      //     setExpandedCardIndex(gearIndex);
      //   } else {
      //     console.warn(
      //       `[GearCategoryPage] Gear with ID ${gearId} not found in category ${categoryId}`
      //     );
      //   }
      // }
    } else {
      log("[GearCategoryPage] No user ID, setting gear loaded to true");
    }
  }, [user?.id, profile?.gear_items, profile?.id, categoryId, searchParams]);

  const handleDeleteGear = async (index: number) => {
    try {
      setLoading(true);
      setError(null);

      await deleteGear.mutateAsync(index);

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
      <main className="flex-1  h-full overflow-y-auto">
        <div className="p-4 lg:pb-4 max-w-2xl mx-auto w-full pb-20">
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
                  return (
                    <GearItemCard
                      key={index}
                      gear={gear}
                      categoryId={categoryId}
                      handleDeleteGear={() => handleDeleteGear(index)}
                      loading={loading}
                    />
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
                  style={{ backgroundColor: "#0251FB0D" }}
                >
                  Go to Profile
                  <Plus className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
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

export default GearCategoryPage;
