import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import BottomNav, { SideNav } from "./BottomNav";
import WeatherWidgetPro from "./WeatherWidgetPro";
import { ArrowLeft, AlertCircle } from "lucide-react";
import FishCard from "./FishCard";
import {
  handleFishImageError,
  getPlaceholderFishImage,
  getFishImageUrlSync,
} from "@/lib/fish-image-service";
import { getBlobImage } from "@/lib/blob-storage";
import { getFishImageUrl } from "@/lib/fishbase-api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import LoadingDots from "./LoadingDots";

interface FishingGear {
  rods?: string;
  reels?: string;
  line?: string;
  leader?: string;
  bait?: string[];
  lures?: string[];
  hooks?: string;
  hook_size_range?: string;
  depth?: string;
  speed?: string;
  structure?: string;
  sonarTips?: string;
  jigging_technique?: string;
  technical_details?: string;
}

interface FishingMethod {
  title: string;
  description: string;
  gear?: FishingGear;
  proTip?: string;
}

interface FishDetails {
  name: string;
  scientificName: string;
  description: string;
  image?: string;
  fishingMethods?: FishingMethod[];
}

const FishDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fishName } = useParams<{ fishName: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fishDetails, setFishDetails] = useState<FishDetails | null>(null);

  useEffect(() => {
    const getFishDetails = async () => {
      if (!fishName) {
        setError("No fish name provided");
        setLoading(false);
        return;
      }

      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) throw new Error("OpenAI API key is missing");

        const userLocation =
          localStorage.getItem("userLocation") || "Miami Coast";
        const currentMonth = new Date().toLocaleString("default", {
          month: "long",
        });

        // Get initial data from navigation state or create default
        const initialData = location.state?.fish || {
          name: fishName.replace(/-/g, " "),
          scientificName: "Unknown",
          image: await getFishImageUrl(fishName.replace(/-/g, " "), "Unknown"),
        };

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
                    "You are a highly experienced technical fishing expert with deep knowledge of fish behavior, underwater topography, marine navigation, sonar interpretation, and advanced fishing techniques. You understand how fish relate to structure, use modern electronics, and know how weather and seasonal patterns affect fishing success. Your expertise includes detailed knowledge of bathymetric charts, wreck fishing, reef systems, and interpreting complex sonar returns for species identification.",
                },
                {
                  role: "user",
                  content: `As a technical fishing expert, analyze ${userLocation} considering underwater topography, structure, and seasonal patterns. Then provide comprehensive fishing information for ${initialData.name} during ${currentMonth}. Consider all possible methods: jigging, spinning, bottom fishing, deep dropping, float fishing, drift fishing, trolling, and vertical jigging. Evaluate each based on the species' behavior patterns and habitat preferences.

                Use metric units in your response (provide all measurements in metric units). Include centimeters/meters for length, kilograms/grams for weight, and Celsius for temperature.

                Return in this exact JSON format with no trailing commas or syntax errors:
                {
                  "name": "${initialData.name}",
                  "scientificName": "${initialData.scientificName}",
                  "description": "A detailed analysis of the fish's behavior patterns, preferred structure types, depth ranges, and seasonal movements in the local waters. Include key sonar signatures and how to identify the species on fish finders.",
                  "fishingSeasons": ["List of months when this fish species is best to catch in ${userLocation}. Include all months where fishing is good, e.g., 'January', 'February', etc."],
                  "allRoundGear": {
                    "rods": "Specify power, action, and length",
                    "reels": "Include gear ratio and line capacity needs",
                    "line": "Specify material, test, and diameter",
                    "leader": "Material and test based on fish behavior",
                    "description": "Technical explanation of why this gear matches the species' characteristics and feeding patterns"
                  },
                  "fishingMethods": [
                    {
                      "title": "Technical method name (e.g., 'Jigs', 'Live Bait', 'Soft Plastics', 'Trolling', 'Bottom Rigs', 'Topwater')",
                      "description": "Detailed technical explanation of why this method works for this species, including fish behavior patterns, structure relationships, and seasonal patterns",
                      "gear": {
                        "rods": "Specific technical requirements including power, action, and length",
                        "reels": "Include gear ratios, drag specs, and line capacity",
                        "line": "Full specifications including material, test, and diameter",
                        "leader": "Material, test, and length specifications",
                        "hooks": "Detailed hook specifications including size, type, and material",
                        "hook_size_range": "Range of hook sizes appropriate for this method",
                        "bait": ["List of specific effective baits with sizes"],
                        "lures": ["List of specific lure models with sizes and colors"],
                        "depth": "Optimal depth range and how it varies with conditions",
                        "speed": "Precise retrieval or trolling speed ranges",
                        "structure": "Detailed structure types and how to fish them",
                        "sonarTips": "How to identify productive areas and fish on sonar",
                        "jig_weight": "Recommended jig weight range based on depth and current",
                        "jig_size": "Recommended jig size range in centimeters"
                      },
                      "proTip": "Advanced technical tip covering structure approach, conditions, timing, and technique refinements"
                    }
                  ]
                }`,
                },
              ],
              temperature: 0.7,
            }),
          },
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        let result;
        try {
          result = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.log("Raw content:", data.choices[0].message.content);
          // Try to fix common JSON issues
          const fixedContent = data.choices[0].message.content
            .replace(/\n/g, " ") // Remove newlines
            .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Add quotes to property names
            .replace(/:\s*'([^']*)'/g, ':"$1"'); // Replace single quotes with double quotes

          try {
            result = JSON.parse(fixedContent);
            console.log("Fixed JSON parsing successful");
          } catch (secondError) {
            console.error("Failed to fix JSON:", secondError);
            throw new Error("Invalid JSON response from API");
          }
        }

        // Ensure we have fishing methods array from the API response
        const fishingMethods = result.fishingMethods || [];
        console.log(
          `Received ${fishingMethods.length} fishing methods from API`,
        );

        // Extract fishing seasons from the API response
        const fishingSeasons = result.fishingSeasons || [
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
        ];
        console.log("Fishing seasons from API:", fishingSeasons);

        setFishDetails({
          ...initialData,
          description: result.description || "No description available.",
          fishingMethods: fishingMethods,
          allRoundGear: result.allRoundGear,
          fishingSeasons: fishingSeasons,
        });
      } catch (err) {
        console.error("Error fetching fish details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch fish details",
        );
      } finally {
        setLoading(false);
      }
    };

    getFishDetails();
  }, [fishName, location.state]);

  if (loading) {
    return (
      <div className="h-screen bg-white dark:bg-gray-950 flex">
        <SideNav />
        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl ml-2">Loading...</h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <LoadingDots color="#0251FB" size={6} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !fishDetails) {
    return (
      <div className="h-screen bg-white dark:bg-gray-950 flex">
        <SideNav />
        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl ml-2">Error</h1>
          </div>
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error || "Fish details not found"}
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-gray-950 flex">
      <SideNav />
      <div className="flex-1 flex">
        <div className="flex-1 w-full lg:max-w-[calc(100%-380px)] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl ml-2">{fishDetails.name}</h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Fish Image Card */}
            <Card className="overflow-hidden rounded-3xl">
              <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
                <img
                  src={fishDetails.image}
                  alt={fishDetails.name}
                  className="w-full h-full object-cover absolute top-0 left-0"
                  onError={(e) => {
                    if (fishDetails.scientificName) {
                      getBlobImage(fishDetails.scientificName)
                        .then((blobUrl) => {
                          if (blobUrl) e.currentTarget.src = blobUrl;
                          else handleFishImageError(e, fishDetails.name);
                        })
                        .catch(() => handleFishImageError(e, fishDetails.name));
                    } else {
                      handleFishImageError(e, fishDetails.name);
                    }
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h1 className="font-bold text-2xl text-white">
                    {fishDetails.name}
                  </h1>
                  <p className="text-white/80 text-sm italic">
                    {fishDetails.scientificName}
                  </p>
                </div>
                <div className="absolute -bottom-4 left-0 right-0 h-4 bg-red-600"></div>
              </div>
            </Card>

            {/* Description Card */}
            <Card className="p-6 rounded-3xl">
              <h2 className="text-xl font-semibold mb-3">About this Fish</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {fishDetails.description}
              </p>
            </Card>

            {/* Fishing Season Calendar Card */}
            <Card className="p-4 sm:p-6 rounded-3xl">
              <h2 className="text-xl font-semibold mb-2 sm:mb-3">
                Fishing Season
              </h2>
              <div className="mt-2 sm:mt-4">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3">
                  Best months to catch {fishDetails.name}:
                </div>
                <div className="grid grid-cols-12 gap-0.5 sm:gap-1 text-center">
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((month, index) => {
                    // Check if the month is in season by comparing with full month names
                    const fullMonthName = new Date(0, index).toLocaleString(
                      "default",
                      { month: "long" },
                    );

                    // Get current month index (0-11)
                    const currentMonthIndex = new Date().getMonth();
                    const isCurrentMonth = index === currentMonthIndex;

                    // Debug logging
                    if (index === 0) {
                      console.log(
                        "Checking fishing seasons:",
                        fishDetails.fishingSeasons,
                      );
                      console.log("Current month index:", currentMonthIndex);
                      console.log("Using mock data?", !result.fishingSeasons);
                    }

                    const isInSeason = fishDetails.fishingSeasons?.some(
                      (season) => {
                        const seasonLower = season.toLowerCase();
                        const monthLower = month.toLowerCase();
                        const fullMonthLower = fullMonthName.toLowerCase();

                        // Check for exact match or substring match
                        const isMatch =
                          seasonLower === monthLower ||
                          seasonLower === fullMonthLower ||
                          seasonLower.includes(monthLower) ||
                          seasonLower.includes(fullMonthLower);

                        if (isMatch && index === 0) {
                          console.log(
                            `Match found for ${month}/${fullMonthName} in season: ${season}`,
                          );
                        }

                        return isMatch;
                      },
                    ) : false;

                    // Determine the class based on whether it's the current month and in season
                    let monthClass = "";
                    if (isCurrentMonth) {
                      if (isInSeason) {
                        monthClass =
                          "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300";
                      } else {
                        monthClass =
                          "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300";
                      }
                    } else if (isInSeason) {
                      monthClass =
                        "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300";
                    } else {
                      monthClass =
                        "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-400";
                    }

                    return (
                      <div
                        key={month}
                        className={`py-1 sm:py-2 px-0.5 sm:px-1 rounded-md border text-xs sm:text-sm ${monthClass}`}
                      >
                        {month}
                      </div>
                    );
                  })}
                </div>
                
                {/* Reasoning */}
                {fishDetails.fishingSeasonInfo?.reasoning && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Seasonal Information</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {fishDetails.fishingSeasonInfo.reasoning}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* All Round Gear Card */}
            {fishDetails.allRoundGear && (
              <Card className="p-6 rounded-3xl">
                <h2 className="text-xl font-semibold mb-6">All Round Gear</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        <path d="M3 3h6l2 4h10v3M3 3v18M3 3H2m1 0h1" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Rods
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {fishDetails.allRoundGear.rods}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        <circle cx="12" cy="12" r="8" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Reels
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {fishDetails.allRoundGear.reels}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        <path d="M4 12h16M4 12l2 3M4 12l2-3M20 12l-2 3m2-3l-2-3" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Line
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {fishDetails.allRoundGear.line}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        <path d="M12 22c-4.4 0-8-3.6-8-8s3.6-8 8-8" />
                        <path d="M20 14c0-4.4-3.6-8-8-8s-8 3.6-8 8" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Leader
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {fishDetails.allRoundGear.leader}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      {fishDetails.allRoundGear.description}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Fishing Methods */}
            {fishDetails.fishingMethods &&
            fishDetails.fishingMethods.length > 0 ? (
              fishDetails.fishingMethods.map((method, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 mb-6 space-y-6"
                >
                  <h2 className="text-2xl font-bold">{method.title}</h2>

                  {/* Location */}
                  <div className="flex flex-col space-y-6">
                    <div className="flex items-start gap-3">
                      <div className="w-6 flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-700 dark:text-gray-300"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Location
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {method.gear?.depth || "Not specified"}
                        </span>
                      </div>
                    </div>

                    {/* Bait/Lures */}
                    {(method.gear?.bait || method.gear?.lures) && (
                      <div className="flex items-start gap-3">
                        <div className="w-6 flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            <path d="M16 8l2 2v2l2 2v4a2 2 0 0 1-2 2h-3.1c-.5 0-.9-.1-1.3-.4l-1.1-.8c-.4-.3-.8-.4-1.3-.4h-2.6c-.5 0-.9.1-1.3.4l-1.1.8c-.4.3-.8.4-1.3.4H2a2 2 0 0 1-2-2v-4l2-2V8l2-2 1.06.53a6.01 6.01 0 0 1 5.88 0L16 8z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {method.title.toLowerCase().includes("jig")
                              ? "Jigs"
                              : method.title.toLowerCase().includes("troll")
                                ? "Lures"
                                : method.gear?.bait
                                  ? "Bait"
                                  : "Lures"}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            {method.gear?.bait
                              ? method.gear.bait.join(", ")
                              : method.gear?.lures?.join(", ")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Speed */}
                    {method.gear?.speed && (
                      <div className="flex items-start gap-3">
                        <div className="w-6 flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            <path d="M3 10l2.8-1.4a4 4 0 0 1 3.6-.1l7.4 3.7a4 4 0 0 0 3.6.1l.6-.3" />
                            <path d="M3 6l2.8-1.4a4 4 0 0 1 3.6-.1l7.4 3.7a4 4 0 0 0 3.6.1l.6-.3" />
                            <path d="M14 14l1-3h3l1-4h2l1-4" />
                            <path d="M5 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                            <path d="M19 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            Speed
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            {method.gear.speed}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Jig Weight - Show for jigging methods */}
                    {method.gear?.jig_weight &&
                      method.title.toLowerCase().includes("jig") && (
                        <div className="flex items-start gap-3">
                          <div className="w-6 flex-shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-gray-700 dark:text-gray-300"
                            >
                              <path d="M12 2v20M2 12h20M12 9v0M12 15v0" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Jig Weight
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {method.gear.jig_weight}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Jig Size - Show for jigging methods */}
                    {method.gear?.jig_size &&
                      method.title.toLowerCase().includes("jig") && (
                        <div className="flex items-start gap-3">
                          <div className="w-6 flex-shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-gray-700 dark:text-gray-300"
                            >
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Jig Size
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {method.gear.jig_size}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Hooks - Only show for bottom fishing methods */}
                    {method.gear?.hooks &&
                      method.title.toLowerCase().includes("bottom") && (
                        <div className="flex items-start gap-3">
                          <div className="w-6 flex-shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-gray-700 dark:text-gray-300"
                            >
                              <path d="M12 9v12m0 0c-1.5 0-3-1.5-3-3" />
                              <path d="M12 21c1.5 0 3-1.5 3-3" />
                              <path d="M12 3c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6z" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Hooks
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {method.gear.hooks}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Hook Size Range - Show whenever available */}
                    {method.gear?.hook_size_range && (
                      <div className="flex items-start gap-3">
                        <div className="w-6 flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            <path d="M3 6h18" />
                            <path d="M7 12h10" />
                            <path d="M10 18h4" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            Hook Size Range
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            {method.gear.hook_size_range}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {method.description}
                  </p>

                  {/* Technical Details */}
                  {method.technical_details && (
                    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                        Technical Details
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {method.technical_details}
                      </p>
                    </div>
                  )}

                  {/* Pro Tip */}
                  {method.proTip && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Pro Tip
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {method.proTip}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 mb-6">
                <p className="text-gray-600 dark:text-gray-300">
                  No fishing methods available for this fish.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Weather Widget */}
        <div className="hidden lg:block w-80 min-w-[380px] h-screen border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <WeatherWidgetPro />
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default FishDetailPage;
