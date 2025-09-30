import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAuth } from "@/contexts/auth-context";
import BottomNav from "@/components/bottom-nav";
import { error as errorLog } from "@/lib/logging";
import { GearItem, toGearItem } from "@/lib/gear";
import { useDeleteGear } from "@/hooks/queries";
import GearItemCard from "./gear-item-card";
import { GEAR_CATEGORIES } from "./my-gear";
import { captureEvent } from "@/lib/posthog";

const GearCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const gearId = searchParams.get("gearId");
  // const fileInputRef = useRef<HTMLInputElement>(null);
  // const cameraInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // const [uploadingGear, setUploadingGear] = useState(false);

  const deleteGear = useDeleteGear();

  // Get current category info
  const currentCategory = GEAR_CATEGORIES.find((cat) => cat.id === categoryId);

  const allGearItems = useMemo(() => {
    const gearItems =
      profile?.gear_items && Array.isArray(profile.gear_items)
        ? profile.gear_items.map(toGearItem)
        : [];

    return gearItems;
  }, [profile?.gear_items]);

  const gearItems = useMemo(() => {
    if (allGearItems.length === 0) {
      return [];
    }

    const categoryGear = allGearItems.filter(
      (item: GearItem) => item.category === categoryId,
    );

    return categoryGear;
  }, [allGearItems]);

  // Load gear items from profile on component mount
  useEffect(() => {
    if (user?.id) {
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
      errorLog("[GearCategoryPage] No user ID, setting gear loaded to true");
    }
  }, [user?.id, profile?.gear_items, profile?.id, categoryId, searchParams]);

  const handleDeleteGear = useCallback(
    async (id: string) => {
      const gearIndex = allGearItems.findIndex((item) => item.id == id);
      try {
        setLoading(true);
        setError(null);

        if (gearIndex === -1) {
          setError("Gear not found!");
          setTimeout(() => setError(null), 3000);
          return;
        }

        await deleteGear.mutateAsync(gearIndex);
        captureEvent("gear_deleted", {
          gear_id: id,
          gear_category: categoryId,
          gear_name: allGearItems[gearIndex].name,
        });
        setSuccess("Gear deleted successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        captureEvent("gear_deleted_error", {
          gear_id: id,
          gear_category: categoryId,
          gear_name: allGearItems[gearIndex].name,
          error: error,
        });
        errorLog("[GearCategoryPage] Error deleting gear:", error);
        setError("Failed to delete gear. Please try again.");
        setTimeout(() => setError(null), 3000);
      } finally {
        setLoading(false);
      }
    },
    [deleteGear, gearId, allGearItems],
  );

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
                      handleDeleteGear={() => handleDeleteGear(gear.id)}
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
