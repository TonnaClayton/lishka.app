import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import BottomNav, { SideNav } from "./BottomNav";
import WeatherWidgetPro from "./WeatherWidgetPro";
import { motion } from "framer-motion";
import {
  handleFishImageError,
  getPlaceholderFishImage,
} from "@/lib/fish-image-service";
import {
  ArrowLeft,
  Fish,
  Droplet,
  Calendar,
  AlertTriangle,
  Anchor,
  MapPin,
  Package,
  Lightbulb,
  Book,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import LoadingDots from "./LoadingDots";
import {
  fetchWithRetry,
  getCachedApiResponse,
  cacheApiResponse,
} from "@/lib/api-helpers";

interface FishData {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  originalImage?: string; // Store the original image URL from navigation
  description: string;
  habitat: string;
  difficulty: "Easy" | "Intermediate" | "Advanced" | "Expert";
  season: string[];
  isToxic: boolean;
  toxicityInfo?: string;
  fishingMethods: string[];
  regulations: string;
  locations: string[];
  bait: string[];
  gear: string[];
  proTips: string[];
}

interface FishDetailPageProps {
  fishData?: FishData;
}

const FishDetailPage: React.FC<FishDetailPageProps> = ({
  fishData: propsFishData,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fishName } = useParams<{ fishName: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: number } | null>(
    null,
  );
  const [fishData, setFishData] = useState<FishData | null>(null);
  const [apiStatus, setApiStatus] = useState({ connected: false, model: "" });

  // Get image from location state if available
  const imageFromNavigation = location.state?.image;
  console.log("Image from navigation:", imageFromNavigation);

  // If fishData is provided as a prop, use it directly
  useEffect(() => {
    if (propsFishData) {
      setFishData(propsFishData);
      setLoading(false);
      return;
    }

    // Otherwise check cache or fetch from API
    const fetchFishDetails = async () => {
      if (!fishName) return;

      setLoading(true);
      setError(null);

      try {
        // Check cache first with timestamp validation
        const cachedData = localStorage.getItem(
          `fish_details_${fishName.toLowerCase()}`,
        );
        if (cachedData) {
          try {
            const parsedCache = JSON.parse(cachedData);
            const cacheTimestamp = localStorage.getItem(
              `fish_details_${fishName.toLowerCase()}_timestamp`,
            );

            // Get current date to check if it's the first day of the month
            const currentDate = new Date();
            const isFirstDayOfMonth = currentDate.getDate() === 1;

            // Cache is valid for 30 days (2592000000 ms) and not the first day of the month
            // This ensures we keep cached data longer but still refresh monthly
            const cacheIsValid =
              cacheTimestamp &&
              Date.now() - parseInt(cacheTimestamp) < 2592000000 &&
              !isFirstDayOfMonth;

            if (cacheIsValid) {
              console.log("Retrieved fish details from cache:", fishName);
              setFishData(parsedCache);
              setLoading(false);
              return;
            } else if (isFirstDayOfMonth) {
              console.log(
                "First day of month - refreshing data for:",
                fishName,
              );
            } else {
              console.log("Cache expired for:", fishName);
            }
          } catch (cacheError) {
            console.error("Error parsing cached fish data:", cacheError);
            // Continue to API call if cache parsing fails
          }
        }

        // Import OpenAI toggle
        const { OPENAI_ENABLED, OPENAI_DISABLED_MESSAGE } = await import(
          "@/lib/openai-toggle"
        );

        // Check if OpenAI is disabled
        if (!OPENAI_ENABLED) {
          console.log(OPENAI_DISABLED_MESSAGE);

          // Create mock fish details
          const fishDetails: FishData = {
            id: "1",
            name: fishName || "Unknown Fish",
            scientificName: fishName
              ? `${fishName.charAt(0).toUpperCase()}${fishName.slice(1).toLowerCase()} species`
              : "Unknown species",
            image:
              imageFromNavigation ||
              "https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746814934638-lishka-placeholder.png",
            originalImage: imageFromNavigation,
            description:
              "This is a mock description since OpenAI API is currently disabled for troubleshooting. This fish is commonly found in coastal waters and is popular among local anglers.",
            habitat: "Coastal waters, reefs, and rocky structures",
            difficulty: "Intermediate",
            season: ["Spring", "Summer", "Fall"],
            isToxic: false,
            fishingMethods: ["Casting", "Trolling", "Bottom fishing"],
            regulations:
              "Check local regulations before fishing. OpenAI API is currently disabled for troubleshooting.",
            locations: ["Nearshore reefs", "Rocky outcroppings", "Jetties"],
            bait: ["Live minnows", "Soft plastic lures", "Spoons"],
            gear: ["Medium-action rod", "10-20lb test line", "Circle hooks"],
            proTips: [
              "Fish during incoming tides for best results",
              "Target structure and drop-offs",
              "Early morning and late evening are prime feeding times",
            ],
          };

          // Save to cache with timestamp
          localStorage.setItem(
            `fish_details_${fishName?.toLowerCase()}_mock`,
            JSON.stringify(fishDetails),
          );

          setFishData(fishDetails);
          setLoading(false);
          return;
        }

        // Check if API key is available
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw {
            message:
              "OpenAI API key is missing. Please add it in project settings.",
            code: 401,
          };
        }

        // Create a cache key for the fish details API request
        const detailsApiCacheKey = `fish_details_api_${fishName.toLowerCase()}`;

        // Get cached API response if available
        const cachedApiResponse = getCachedApiResponse(detailsApiCacheKey);

        // Make OpenAI API call with retry logic and rate limiting
        console.log("Fetching details for fish:", fishName);
        console.log("OpenAI API key available:", !!apiKey);
        const response = await fetchWithRetry(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey.trim()}`,
              "OpenAI-Beta": "assistants=v1",
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a fishing expert AI that provides detailed information about fish species.",
                },
                {
                  role: "user",
                  content: `Provide detailed information about ${fishName} for a fishing app. Include: scientific name, description, habitat, difficulty level (Easy, Intermediate, Advanced, or Expert), season availability (as an array), whether it's toxic (boolean), fishing methods (array), regulations, best fishing locations (array), recommended bait (array), required gear (array), and pro tips (array). Format as JSON.`,
                },
              ],
              response_format: { type: "json_object" },
            }),
          },
          3, // 3 retries
          2000, // 2 second initial delay
        );

        if (!response.ok) {
          const errorCodes = {
            400: "Bad request - Check your query parameters",
            401: "Unauthorized - Invalid API key",
            403: "Forbidden - You don't have access to this resource",
            404: "Not found - The requested resource doesn't exist",
            429: "Too many requests - Rate limit exceeded",
            500: "Server error - Something went wrong on OpenAI's end",
            502: "Bad gateway - OpenAI is down or being upgraded",
            503: "Service unavailable - OpenAI is overloaded or down for maintenance",
            504: "Gateway timeout - The request took too long to process",
          };

          const errorMessage =
            errorCodes[response.status] ||
            `OpenAI API error: ${response.status}`;
          throw { message: errorMessage, code: response.status };
        }

        const data = await response.json();
        console.log("API response data:", data);

        // Cache the API response for 24 hours
        cacheApiResponse(detailsApiCacheKey, data, 24 * 60 * 60 * 1000);

        // Update API status
        setApiStatus({
          connected: true,
          model: data.model || "gpt-3.5-turbo",
        });

        try {
          const parsedContent = JSON.parse(data.choices[0].message.content);
          console.log("Parsed fish details:", parsedContent);

          // Create fish data object from API response
          const fishDetails: FishData = {
            id: "1",
            name: fishName,
            scientificName: parsedContent.scientificName || "Unknown",
            // Use image from navigation state if available, otherwise use placeholder
            image: imageFromNavigation || getPlaceholderFishImage(),
            // Store the original image URL in cache to ensure consistency
            originalImage: imageFromNavigation,
            description:
              parsedContent.description || "No description available.",
            habitat:
              parsedContent.habitat ||
              "Coastal waters, reefs, and rocky structures",
            difficulty: parsedContent.difficulty || "Intermediate",
            season: Array.isArray(parsedContent.season)
              ? parsedContent.season
              : [parsedContent.season || "Year-round"],
            isToxic:
              parsedContent.isToxic === true || parsedContent.toxic === true,
            toxicityInfo: parsedContent.toxicityInfo || "",
            fishingMethods: Array.isArray(parsedContent.fishingMethods)
              ? parsedContent.fishingMethods
              : ["Casting", "Trolling", "Bottom fishing"],
            regulations:
              parsedContent.regulations ||
              "Check local regulations before fishing.",
            locations: Array.isArray(parsedContent.locations)
              ? parsedContent.locations
              : ["Nearshore reefs", "Rocky outcroppings", "Jetties"],
            bait: Array.isArray(parsedContent.bait)
              ? parsedContent.bait
              : ["Live minnows", "Soft plastic lures", "Spoons"],
            gear: Array.isArray(parsedContent.gear)
              ? parsedContent.gear
              : ["Medium-action rod", "10-20lb test line", "Circle hooks"],
            proTips: Array.isArray(parsedContent.proTips)
              ? parsedContent.proTips
              : [
                  "Fish during incoming tides for best results",
                  "Target structure and drop-offs",
                  "Early morning and late evening are prime feeding times",
                ],
          };

          // Save to cache with timestamp
          localStorage.setItem(
            `fish_details_${fishName.toLowerCase()}`,
            JSON.stringify(fishDetails),
          );

          // Add timestamp for cache validation
          localStorage.setItem(
            `fish_details_${fishName.toLowerCase()}_timestamp`,
            Date.now().toString(),
          );

          setFishData(fishDetails);
        } catch (parseError) {
          console.error(
            "Error parsing fish details:",
            parseError,
            data.choices[0].message.content,
          );
          throw {
            message: "Failed to parse fish details from API response",
            code: 422,
          };
        }
      } catch (err) {
        console.error("Error fetching fish details:", err);
        setError({
          message: err.message || "Failed to fetch fish details",
          code: err.code || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFishDetails();
  }, [fishName, propsFishData]);

  const difficultyColor = {
    Easy: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800",
    Advanced: "bg-orange-100 text-orange-800",
    Expert: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="h-screen overflow-hidden bg-[#F7F7F7] flex">
        <SideNav />
        <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white p-4 flex items-center flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="font-inter text-xl ml-2">Loading...</h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-gray-600">Loading fish details...</p>
              <LoadingDots color="#0251FB" size={6} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-hidden bg-[#F7F7F7] flex">
        <SideNav />
        <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white p-4 shadow-sm flex items-center flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="font-inter text-xl ml-2">Error</h1>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error {error.code}</AlertTitle>
              <AlertDescription className="text-gray-700">
                {error.message}
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate(-1)} className="w-full mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!fishData) {
    return (
      <div className="h-screen overflow-hidden bg-[#F7F7F7] flex">
        <SideNav />
        <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white p-4 shadow-sm flex items-center flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="font-inter text-xl ml-2">Not Found</h1>
          </div>
          <div className="p-4 text-center flex-1 overflow-y-auto">
            <p className="text-gray-600">Fish details not found.</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F7F7F7] flex">
      {/* Side Navigation - Hidden on mobile, visible on desktop */}
      <SideNav />
      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex overflow-hidden">
        <div className="flex-1 w-full lg:max-w-[calc(100%-380px)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white p-4 shadow-sm flex items-center w-full flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="font-inter text-xl ml-2">{fishData.name}</h1>
          </div>
          {/* Fish Image Card */}

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Info Card */}
            <Card className="overflow-hidden mb-4">
              <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
                <img
                  src={
                    fishData.originalImage ||
                    fishData.image ||
                    "https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746814934638-lishka-placeholder.png"
                  }
                  alt={fishData.name}
                  className="w-full h-full object-cover absolute top-0 left-0"
                  onError={(e) => handleFishImageError(e, fishData.name)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h1 className="font-inter font-bold text-2xl text-white">
                    {fishData.name}
                  </h1>
                  <p className="text-white/80 text-sm italic">
                    {fishData.scientificName}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center">
                  <Fish className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Description
                </h3>
                <p className="mt-2 text-sm text-gray-700 break-words">
                  {fishData.description}
                </p>

                <Separator className="my-4" />

                <h3 className="font-semibold flex items-center">
                  <Droplet className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Habitat
                </h3>
                <p className="mt-2 text-sm text-gray-700 break-words">
                  {fishData.habitat}
                </p>

                <Separator className="my-4" />

                <h3 className="font-semibold flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Season
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fishData.season.map((season, index) => (
                    <Badge key={index} variant="outline">
                      {season}
                    </Badge>
                  ))}
                </div>

                <Separator className="my-4" />

                <h3 className="font-semibold flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Toxicity
                </h3>
                <div className="mt-2">
                  {fishData.isToxic ? (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md text-sm break-words">
                      <p className="font-semibold">
                        Warning: This fish may be toxic
                      </p>
                      {fishData.toxicityInfo && (
                        <p className="mt-1">{fishData.toxicityInfo}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 break-words">
                      This fish is generally safe to handle and consume when
                      properly prepared.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fish Image Card */}

            {/* Fishing Methods Card */}
            <Card className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <Badge className={difficultyColor[fishData.difficulty]}>
                    {fishData.difficulty} Difficulty
                  </Badge>
                </div>

                <h3 className="font-semibold flex items-center">
                  <Anchor className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Best Fishing Methods
                </h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 break-words">
                  {fishData.fishingMethods.map((method, index) => (
                    <li key={index} className="mb-2">
                      {method}
                    </li>
                  ))}
                </ul>

                <Separator className="my-4" />

                <h3 className="font-semibold flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Best Locations
                </h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 break-words">
                  {fishData.locations.map((location, index) => (
                    <li key={index} className="mb-2">
                      {location}
                    </li>
                  ))}
                </ul>

                <Separator className="my-4" />

                <h3 className="font-semibold flex items-center">
                  <Fish className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Recommended Bait
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fishData.bait.map((bait, index) => (
                    <Badge key={index} variant="outline">
                      {bait}
                    </Badge>
                  ))}
                </div>

                <Separator className="my-4" />

                <h3 className="font-semibold flex items-center">
                  <Package className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Required Gear
                </h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 break-words">
                  {fishData.gear.map((gear, index) => (
                    <li key={index} className="mb-2">
                      {gear}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="overflow-hidden">
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Pro Tips
                </h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground break-words">
                  {fishData.proTips.map((tip, index) => (
                    <li key={index} className="mb-2">
                      {tip}
                    </li>
                  ))}
                </ul>

                <Separator className="my-4" />

                <h3 className="font-semibold flex items-center">
                  <Book className="h-5 w-5 mr-2 text-[#0251FB]" />
                  Regulations
                </h3>
                <div className="mt-2 bg-info/10 border border-info/30 p-3 rounded-md text-sm break-words">
                  <p className="text-info/90">{fishData.regulations}</p>
                  <p className="mt-2 text-xs text-info/70">
                    Always check current local regulations before fishing as
                    they may change.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 mb-4">
              <Button className="w-full rounded-full bg-[#0251FB] hover:bg-[#0251FB]/90">
                Find Nearby Fishing Spots
              </Button>
            </div>

            {/* API Status Message */}
            {apiStatus.connected && (
              <Alert variant="success" className="mb-4">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertTitle>Connected to OpenAI</AlertTitle>
                <AlertDescription>
                  Using model: {apiStatus.model}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Weather Widget Sidebar */}
        <div className="hidden lg:block w-80 min-w-[380px] h-screen border-l border-gray-200 bg-[#F7F7F7] overflow-hidden">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-4 flex-shrink-0 pt-4 px-4 dark:text-white">
              Weather
            </h2>
            <div className="flex-1 overflow-y-auto px-4">
              {localStorage.getItem("userLocation") && (
                <WeatherWidgetPro
                  userLocation={JSON.parse(
                    localStorage.getItem("userLocation") || "{}",
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishDetailPage;
