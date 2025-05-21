import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import FishCard from "./FishCard";
import { Button } from "./ui/button";

import { OPENAI_ENABLED, OPENAI_DISABLED_MESSAGE } from "@/lib/openai-toggle";
import { getBlobImage } from "@/lib/blob-storage";
import { getLocalFishName } from "@/lib/fishbase-api";
import LoadingDots from "./LoadingDots";
import LocationSetup from "./LocationSetup";

// Import Dialog components from ui folder
import { Dialog, DialogContent, DialogOverlay } from "./ui/dialog";

interface HomePageProps {
  location?: string;
  onLocationChange?: (location: string) => void;
}

interface FishData {
  name: string;
  scientificName: string;
  localName?: string;
  habitat: string;
  difficulty: "Easy" | "Intermediate" | "Hard" | "Advanced" | "Expert";
  season: string;
  isToxic: boolean;
  image?: string;
}

const HomePage: React.FC<HomePageProps> = ({
  location = "Miami Coast",
  onLocationChange = () => {},
}) => {
  const navigate = useNavigate();
  const [fishList, setFishList] = useState<FishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isLocationSetupOpen, setIsLocationSetupOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(() => {
    // Try to get location from localStorage first
    const savedLocation = localStorage.getItem("userLocation");
    // If no saved location, check if we need to set up a default
    if (!savedLocation) {
      const defaultLocation = "Miami Coast";
      localStorage.setItem("userLocation", defaultLocation);
      return defaultLocation;
    }
    return savedLocation || location;
  });

  // Get current month
  const getCurrentMonth = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[new Date().getMonth()];
  };

  const fetchFishData = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (!OPENAI_ENABLED) {
        throw new Error(OPENAI_DISABLED_MESSAGE);
      }

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key is missing");
      }

      const currentMonth = getCurrentMonth();
      const pageSize = 20;
      const currentPage = isLoadMore ? page + 1 : 1;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a fishing expert AI that provides accurate information about fish species.",
              },
              {
                role: "user",
                content: `List ${pageSize} fish species that can be caught in ${userLocation} during ${currentMonth}. For each fish, provide: name, scientific name, habitat (freshwater/saltwater/brackish and specific environments), difficulty level to catch (Easy/Intermediate/Hard/Advanced/Expert), seasons when they're most active, and whether they're toxic. Format as JSON array with these exact fields: name, scientificName, habitat, difficulty, season, isToxic. Page: ${currentPage}`,
              },
            ],
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse the JSON response
      let fishData: FishData[];
      try {
        // Handle potential JSON formatting issues
        const jsonStr = content.replace(/```json\n|```/g, "");
        fishData = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Error parsing OpenAI response:", e);
        throw new Error("Failed to parse fish data from OpenAI");
      }

      // Update state based on whether we're loading more or initial load
      if (isLoadMore) {
        setFishList((prev) => [...prev, ...fishData]);
        setPage(currentPage);
      } else {
        setFishList(fishData);
        setPage(1);
      }

      // Load images and local names for each fish
      const enhancedFishData = await Promise.all(
        fishData.map(async (fish) => {
          // Try to get image from Vercel Blob
          let imageUrl;
          try {
            imageUrl = await getBlobImage(fish.scientificName);
          } catch (e) {
            console.error(`Error fetching image for ${fish.name}:`, e);
          }

          // Try to get local name
          let localName;
          try {
            // Get browser language or default to 'en'
            const browserLang = navigator.language.split("-")[0] || "en";
            localName = await getLocalFishName(
              fish.scientificName,
              browserLang,
            );
          } catch (e) {
            console.error(`Error fetching local name for ${fish.name}:`, e);
          }

          return {
            ...fish,
            image: imageUrl || undefined,
            localName: localName || undefined,
          };
        }),
      );

      // Update state with enhanced data
      if (isLoadMore) {
        setFishList((prev) => [
          ...prev.slice(0, prev.length - fishData.length),
          ...enhancedFishData,
        ]);
      } else {
        setFishList(enhancedFishData);
      }
    } catch (err) {
      console.error("Error fetching fish data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch fish data",
      );
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFishData();
  }, [userLocation]);

  const handleFishClick = (fish: FishData) => {
    // Navigate to fish detail page with fish data
    navigate(`/fish/${encodeURIComponent(fish.scientificName)}`, {
      state: { fish },
    });
  };

  const handleLoadMore = () => {
    fetchFishData(true);
  };

  return (
    <div className="flex flex-col dark:bg-background border-l-0 border-y-0 border-r-0 rounded-3xl">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white p-4 w-full lg:hidden dark:bg-gray-800 border-t-0 border-x-0 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 lg:hidden">
            <img
              src="/logo.svg"
              alt="Fishing AI Logo"
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="/logo-night.svg"
              alt="Fishing AI Logo"
              className="h-8 w-auto hidden dark:block"
            />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold dark:text-white">Home</h1>
          </div>
          <img
            src="https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746801732510-image.png"
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      </header>
      {/* Main Content */}
      <div className="flex-1 w-full p-4 lg:p-6 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1 dark:text-white">
            Fish in{" "}
            <span
              className="text-[#0251FB] dark:text-primary underline cursor-pointer"
              onClick={() => setIsLocationSetupOpen(true)}
            >
              {userLocation}
            </span>{" "}
            - {getCurrentMonth()}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Discover fish species available in your area this month
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingDots />
            <p className="text-sm text-muted-foreground mt-4">
              Finding fish in your area...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => fetchFishData()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {fishList.map((fish, index) => (
                <FishCard
                  key={`${fish.scientificName}-${index}`}
                  name={fish.name}
                  scientificName={fish.scientificName}
                  localName={fish.localName}
                  habitat={fish.habitat}
                  difficulty={fish.difficulty}
                  season={fish.season}
                  isToxic={fish.isToxic}
                  image={fish.image}
                  onClick={() => handleFishClick(fish)}
                />
              ))}
            </div>

            {fishList.length > 0 && (
              <div className="flex justify-center mb-20 lg:mb-6">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full max-w-xs"
                >
                  {loadingMore ? (
                    <>
                      <LoadingDots size={4} />
                      <span className="ml-2">Loading...</span>
                    </>
                  ) : (
                    "Load More Fish"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Bottom Navigation */}
      <BottomNav />
      {/* Location Setup (shown conditionally) */}
      {isLocationSetupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md">
            <LocationSetup
              onLocationSet={(newLocation) => {
                // Update the location in the title
                setUserLocation(newLocation.name);
                // Location is already saved to localStorage in LocationSetup component
                // Refresh fish data with new location
                onLocationChange(newLocation.name);
                // Close the location setup after location is set
                setIsLocationSetupOpen(false);
              }}
              isOverlay={true}
              onClose={() => {
                // Only allow closing if a location is already set
                if (localStorage.getItem("userLocation")) {
                  setIsLocationSetupOpen(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
