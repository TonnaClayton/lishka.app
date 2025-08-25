import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Package,
  Check,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import GearDetailModal from "./gear-detail-modal";
import { useAuth } from "@/contexts/auth-context";
import BottomNav from "./bottom-nav";
import { log } from "@/lib/logging";
import { toGearItem } from "@/lib/gear";
import { Json } from "@/types/supabase";

// Gear categories as specified
const GEAR_CATEGORIES = [
  { id: "rods-reels", name: "Rods & Reels", icon: "🎣" },
  { id: "lures-jigs", name: "Lures and Jigs", icon: "🪝" },
  { id: "bait-chum", name: "Bait & Chum", icon: "🐟" },
  { id: "accessories", name: "Fishing Accessories", icon: "🧰" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "other", name: "Other", icon: "📦" },
];

const MyGearPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  // const fileInputRef = useRef<HTMLInputElement>(null);
  // const cameraInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gearLoaded, setGearLoaded] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGearIndex, setEditingGearIndex] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [selectedGearId, setSelectedGearId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    description: "",
    brand: "",
    model: "",
    price: "",
    condition: "",
  });

  // Get gear items directly from profile (no local state)
  const gearItems =
    profile?.gear_items && Array.isArray(profile.gear_items)
      ? profile.gear_items.map((item) => toGearItem(item))
      : [];

  // Load gear items from profile on component mount
  useEffect(() => {
    const loadGearItems = async () => {
      try {
        log("[MyGearPage] Loading gear items:", {
          hasUser: !!user?.id,
          hasProfile: !!profile,
          profileGearItems: profile?.gear_items,
        });

        if (!profile && user?.id) {
          log("[MyGearPage] Profile not loaded yet, waiting...");
          return;
        }

        if (profile?.gear_items && Array.isArray(profile.gear_items)) {
          log("[MyGearPage] Loading gear from database:", {
            gearCount: profile.gear_items.length,
          });
        } else {
          log("[MyGearPage] No gear items found");
        }
      } catch (error) {
        console.error("[MyGearPage] Error loading gear items:", error);
      } finally {
        setGearLoaded(true);
      }
    };

    if (user?.id) {
      loadGearItems();
    } else {
      setGearLoaded(true);
    }
  }, [user?.id, profile?.gear_items, profile?.id]);

  // Removed automatic save - gear is now only saved from ProfilePage
  // This page is now view-only for gear items

  // Get ranking text based on gear count
  const getRankingText = (count: number): string => {
    if (count === 0) {
      return "Upload your fishing gear to get detailed insights, from equipment type to optimal usage.";
    } else if (count >= 1 && count <= 9) {
      return "Building your collection";
    } else if (count >= 10 && count <= 49) {
      return "You're in the top 50% of fishermen with this gear collection.";
    } else if (count >= 50 && count <= 99) {
      return "You're in the top 20% of fishermen with this gear collection.";
    } else {
      return "You're in the top 5% of fishermen with this gear collection.";
    }
  };

  // Handle gear click to show detail modal - store only the ID to ensure we always get fresh data
  // const handleGearClick = (gear: GearItem) => {
  //   setSelectedGearId(gear.id);
  // };

  // Close gear modal
  const closeGearModal = () => {
    setSelectedGearId(null);
  };

  // Get selected gear from current profile data (ensures fresh data)
  const selectedGear = selectedGearId
    ? gearItems.find((gear) => gear.id === selectedGearId) || null
    : null;

  // Handle gear editing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        userConfirmed: true,
      };

      // Update profile with new gear data
      await updateProfile({ gear_items: updatedGear as unknown as Json[] });
      setShowEditDialog(false);
      setEditingGearIndex(null);
      setSuccess("Gear updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("[MyGearPage] Error updating gear:", error);
      setError("Failed to update gear. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteGear = async (index: number) => {
    try {
      setLoading(true);
      setError(null);

      const updatedGear = gearItems.filter((_, i) => i !== index);

      // Update profile with new gear data
      await updateProfile({ gear_items: updatedGear as unknown as Json[] });
      setOpenMenuIndex(null);
      setSuccess("Gear deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("[MyGearPage] Error deleting gear:", error);
      setError("Failed to delete gear. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get gear items by category
  const getGearByCategory = (categoryId: string) => {
    return gearItems.filter((item) => item.category === categoryId);
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

  // Don't render anything if no user
  if (!user) {
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
            <h1 className="text-xl font-bold ml-2 dark:text-white">My Gear</h1>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full pb-20 lg:pb-4 h-full overflow-y-auto">
        <div className="space-y-6 flex flex-col gap-y-0">
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

          {/* Gear Count and Ranking */}
          <div className="text-left py-2">
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {gearItems.length} Pieces
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-base">
              {gearItems.length === 0
                ? "Add gear from your profile page to get detailed insights, from equipment type to optimal usage."
                : getRankingText(gearItems.length)}
            </p>
            {gearItems.length === 0 && (
              <Button
                onClick={() => navigate("/profile")}
                className="mt-4 border-none shadow-none text-gray-800 font-medium py-3 px-6"
                style={{ backgroundColor: "#0251FB0D" }}
              >
                Add Your First Gear
                <Plus className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Gear Categories */}
          <div className="space-y-3">
            {GEAR_CATEGORIES.map((category) => {
              const categoryGear = getGearByCategory(category.id);
              return (
                <div
                  key={category.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    // Always navigate to category page for consistent UX
                    navigate(`/gear-category/${category.id}`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {categoryGear.length > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-gear-badge rounded-full">
                          {categoryGear.length}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-[#191B1F]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      {/* Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
      {/* Edit Gear Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md px-6 py-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Edit Gear Information
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gearName">Gear Name</Label>
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
              <Label htmlFor="gearCategory">Category</Label>
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
                <Label htmlFor="gearBrand">Brand</Label>
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
                <Label htmlFor="gearModel">Model</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gearPrice">Price</Label>
                <Input
                  id="gearPrice"
                  value={editFormData.price}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="$0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gearDescription">Description</Label>
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

          <DialogFooter className="flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={loading}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Gear Detail Modal */}
      <GearDetailModal
        isOpen={!!selectedGearId}
        onClose={closeGearModal}
        gear={selectedGear}
        recommendation={null}
      />
    </div>
  );
};

export default MyGearPage;
