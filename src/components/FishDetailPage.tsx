import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import BottomNav, { SideNav } from "./BottomNav";
import WeatherWidgetPro from "./WeatherWidgetPro";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Shield,
  Phone,
} from "lucide-react";
import FishCard from "./FishCard";
import {
  handleFishImageError,
  getPlaceholderFishImage,
  getFishImageUrl as getFishImageUrlFromService,
} from "@/lib/fish-image-service";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import LoadingDots from "./LoadingDots";

// Fishing Season Calendar Component
interface FishingSeasonCalendarProps {
  fishingSeasons?: FishingSeasons;
  fishName: string;
  location?: string;
}

const FishingSeasonCalendar: React.FC<FishingSeasonCalendarProps> = ({
  fishingSeasons,
  fishName,
  location,
}) => {
  // Month data
  const months = [
    { short: "Jan", full: "January", index: 0 },
    { short: "Feb", full: "February", index: 1 },
    { short: "Mar", full: "March", index: 2 },
    { short: "Apr", full: "April", index: 3 },
    { short: "May", full: "May", index: 4 },
    { short: "Jun", full: "June", index: 5 },
    { short: "Jul", full: "July", index: 6 },
    { short: "Aug", full: "August", index: 7 },
    { short: "Sep", full: "September", index: 8 },
    { short: "Oct", full: "October", index: 9 },
    { short: "Nov", full: "November", index: 10 },
    { short: "Dec", full: "December", index: 11 },
  ];

  const currentMonthIndex = new Date().getMonth();

  // Function to determine if a month is in season
  const isMonthInSeason = (monthData: {
    short: string;
    full: string;
    index: number;
  }): boolean => {
    if (!fishingSeasons?.inSeason || !Array.isArray(fishingSeasons.inSeason)) {
      console.log(`No fishing seasons data available for ${fishName}`);
      return false;
    }

    // Convert all season entries to lowercase for comparison
    const seasonEntries = fishingSeasons.inSeason
      .map((season) =>
        typeof season === "string" ? season.toLowerCase().trim() : "",
      )
      .filter((season) => season.length > 0);

    console.log(
      `Checking month ${monthData.full} against seasons:`,
      seasonEntries,
    );

    // If no valid season entries, return false
    if (seasonEntries.length === 0) {
      console.log(`No valid season entries found for ${fishName}`);
      return false;
    }

    // Check each season entry
    for (const season of seasonEntries) {
      console.log(`Processing season entry: "${season}"`);

      // Direct match with full month name
      if (season === monthData.full.toLowerCase()) {
        console.log(
          `✓ Direct match: ${season} === ${monthData.full.toLowerCase()}`,
        );
        return true;
      }

      // Direct match with short month name
      if (season === monthData.short.toLowerCase()) {
        console.log(
          `✓ Short match: ${season} === ${monthData.short.toLowerCase()}`,
        );
        return true;
      }

      // Check if season contains the month name (for entries like "spring", "summer", etc.)
      if (
        season.includes(monthData.full.toLowerCase()) ||
        season.includes(monthData.short.toLowerCase())
      ) {
        console.log(
          `✓ Contains match: ${season} contains ${monthData.full.toLowerCase()}`,
        );
        return true;
      }

      // Handle seasonal terms
      const seasonalMonths = {
        spring: [2, 3, 4], // March, April, May
        summer: [5, 6, 7], // June, July, August
        autumn: [8, 9, 10], // September, October, November
        fall: [8, 9, 10], // September, October, November
        winter: [11, 0, 1], // December, January, February
      };

      if (seasonalMonths[season]) {
        if (seasonalMonths[season].includes(monthData.index)) {
          console.log(`✓ Seasonal match: ${monthData.full} is in ${season}`);
          return true;
        }
      }

      // Handle ranges like "January-March", "Jan-Mar", "March to June", etc.
      if (season.includes("-") || season.includes(" to ")) {
        const separator = season.includes("-") ? "-" : " to ";
        const [startSeason, endSeason] = season
          .split(separator)
          .map((s) => s.trim());

        console.log(`Processing range: ${startSeason} to ${endSeason}`);

        // Find start and end month indices
        const startMonth = months.find(
          (m) =>
            m.full.toLowerCase() === startSeason ||
            m.short.toLowerCase() === startSeason ||
            m.full.toLowerCase().startsWith(startSeason) ||
            m.short.toLowerCase().startsWith(startSeason),
        );

        const endMonth = months.find(
          (m) =>
            m.full.toLowerCase() === endSeason ||
            m.short.toLowerCase() === endSeason ||
            m.full.toLowerCase().startsWith(endSeason) ||
            m.short.toLowerCase().startsWith(endSeason),
        );

        if (startMonth && endMonth) {
          const startIdx = startMonth.index;
          const endIdx = endMonth.index;
          const currentIdx = monthData.index;

          console.log(
            `Range indices: start=${startIdx}, end=${endIdx}, current=${currentIdx}`,
          );

          // Handle range that wraps around the year (e.g., Nov-Feb)
          let inRange = false;
          if (startIdx <= endIdx) {
            // Normal range (e.g., Mar-Jun)
            inRange = currentIdx >= startIdx && currentIdx <= endIdx;
          } else {
            // Wrapping range (e.g., Nov-Feb)
            inRange = currentIdx >= startIdx || currentIdx <= endIdx;
          }

          if (inRange) {
            console.log(
              `✓ Range match: ${monthData.full} is in range ${startSeason}-${endSeason}`,
            );
            return true;
          }
        } else {
          console.log(
            `Could not find months for range: ${startSeason} to ${endSeason}`,
          );
        }
      }

      // Handle comma-separated lists like "March, April, May"
      if (season.includes(",")) {
        const monthList = season.split(",").map((m) => m.trim());
        for (const monthName of monthList) {
          if (
            monthName === monthData.full.toLowerCase() ||
            monthName === monthData.short.toLowerCase() ||
            monthData.full.toLowerCase().startsWith(monthName) ||
            monthData.short.toLowerCase().startsWith(monthName)
          ) {
            console.log(
              `✓ List match: ${monthData.full} found in comma-separated list`,
            );
            return true;
          }
        }
      }
    }

    console.log(`✗ No match found for ${monthData.full}`);
    return false;
  };

  // Function to get month styling
  const getMonthStyling = (monthData: {
    short: string;
    full: string;
    index: number;
  }): string => {
    const isInSeason = isMonthInSeason(monthData);
    const isCurrentMonth = monthData.index === currentMonthIndex;

    if (isInSeason && isCurrentMonth) {
      // Current month and in season - light green
      return "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300";
    } else if (isInSeason) {
      // In season but not current month - light blue
      return "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300";
    } else if (isCurrentMonth) {
      // Current month but not in season - light red
      return "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300";
    } else {
      // Not in season and not current month - light gray
      return "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800/20 dark:border-gray-700 dark:text-gray-500";
    }
  };

  // Debug logging
  console.log("=== FISHING SEASON CALENDAR DEBUG ===");
  console.log("Fishing seasons data:", fishingSeasons);
  console.log("In season array:", fishingSeasons?.inSeason);
  console.log("Current month index:", currentMonthIndex);
  console.log("Current month name:", months[currentMonthIndex].full);
  console.log("=====================================");

  return (
    <div className="grid grid-cols-12 gap-0.5 sm:gap-1 text-center">
      {months.map((monthData) => {
        const styling = getMonthStyling(monthData);
        const isInSeason = isMonthInSeason(monthData);

        console.log(
          `Month ${monthData.full}: in-season=${isInSeason}, styling=${styling}`,
        );

        return (
          <div
            key={monthData.short}
            className={`py-1 sm:py-2 px-0.5 sm:px-1 rounded-md border text-[10px] ${styling}`}
          >
            {monthData.short}
          </div>
        );
      })}
    </div>
  );
};

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

interface FishingRegulations {
  sizeLimit: string;
  bagLimit: string;
  seasonDates: string;
  licenseRequired: string;
  additionalRules: string[];
  penalties: string;
  lastUpdated: string;
}

interface FishingSeasons {
  inSeason: string[];
  traditionalSeason: string[];
  conservationConcerns: string;
  regulations: string;
  notInSeason: string[];
  reasoning: string;
}

interface FishDetails {
  name: string;
  scientificName: string;
  description: string;
  image?: string;
  fishingMethods?: FishingMethod[];
  fishingSeasons?: FishingSeasons;
  fishingRegulations?: FishingRegulations;
  allRoundGear?: FishingGear;
  localNames?: string[];
  currentSeasonStatus?: string;
  officialSeasonDates?: string;
  fishingLocation?: string;
  isToxic?: boolean;
  dangerType?: string;
}

const FishDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fishName } = useParams<{ fishName: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fishDetails, setFishDetails] = useState<FishDetails | null>(null);
  const [userLocationName, setUserLocationName] = useState<string>("");
  const [showDebugUI, setShowDebugUI] = useState<boolean>(false);
  const [fishImageUrl, setFishImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    // Get debug UI preference from localStorage
    const debugUIPreference = localStorage.getItem("showDebugUI");
    if (debugUIPreference !== null) {
      setShowDebugUI(debugUIPreference === "true");
    }

    // Listen for debug UI changes
    const handleDebugUIChange = () => {
      const newDebugUIPreference = localStorage.getItem("showDebugUI");
      if (newDebugUIPreference !== null) {
        setShowDebugUI(newDebugUIPreference === "true");
      }
    };

    window.addEventListener("debugUIChanged", handleDebugUIChange);

    return () => {
      window.removeEventListener("debugUIChanged", handleDebugUIChange);
    };
  }, []);

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

        const userLocationData = localStorage.getItem("userLocation");
        let userLocation = "Unknown Location";

        // Try to parse the location data to get the name
        if (userLocationData) {
          try {
            const locationObj = JSON.parse(userLocationData);
            userLocation = locationObj.name || "Unknown Location";
          } catch {
            userLocation = userLocationData || "Unknown Location";
          }
        }

        setUserLocationName(userLocation);
        const currentMonth = new Date().toLocaleString("default", {
          month: "long",
        });

        // Get initial data from navigation state or create default
        const fishNameFormatted = fishName.replace(/-/g, " ");
        const initialData = location.state?.fish || {
          name: fishNameFormatted,
          scientificName: "Unknown",
          image: await getFishImageUrlFromService(fishNameFormatted, "Unknown"),
        };

        // First API call for general fishing information
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey.trim()}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `You are a fishing expert with detailed knowledge of local fishing regulations, seasonal patterns, and traditional fishing practices worldwide. You adapt your expertise to the specific location provided by the user. Always provide specific, accurate information for the requested location. Return only valid JSON without any additional text or formatting.`,
                },
                {
                  role: "user",
                  content: `Provide detailed fishing information for ${initialData.name} in ${userLocation}. Today is ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. Return only valid JSON in this exact format:

{
  "name": "${initialData.name}",
  "scientificName": "${initialData.scientificName}",
  "description": "Detailed description of the fish including habitat, behavior, and identification features specific to ${userLocation} waters",
  "localNames": ["Local names for this fish in ${userLocation} - provide regional/local names if this fish is found in these waters, otherwise return empty array"],
  "currentSeasonStatus": "Yes, currently in season or No, not currently in season based on today's date and ${userLocation} regulations",
  "officialSeasonDates": "Official fishing season dates for this species in ${userLocation} or Year-round or No specific season",
  "fishingLocation": "${userLocation}",
  "fishingSeasons": {
    "inSeason": ["List of months when this fish is typically in season in ${userLocation}"],
    "traditionalSeason": ["Traditional fishing months for this species in ${userLocation}"],
    "conservationConcerns": "Conservation status and concerns specific to ${userLocation} waters",
    "regulations": "${userLocation} specific fishing regulations for this species",
    "biologicalReasoning": "Why this fish is in season during these months in ${userLocation} region",
    "reasoning": "Explanation of how biology connects to ${userLocation} fishing regulations"
  },
  "allRoundGear": {
    "rods": "Recommended rod specifications for ${userLocation} fishing conditions",
    "reels": "Reel recommendations for ${userLocation} waters",
    "line": "Line specifications suitable for ${userLocation} conditions",
    "leader": "Leader recommendations for ${userLocation} fishing",
    "description": "General gear setup explanation for ${userLocation} fishing conditions"
  },
  "fishingMethods": [
    {
      "title": "Primary fishing method for this species in ${userLocation}",
      "description": "Detailed description of the method adapted to ${userLocation} conditions",
      "gear": {
        "rods": "Specific rod requirements for ${userLocation}",
        "reels": "Reel specifications for ${userLocation} conditions",
        "line": "Line requirements for ${userLocation} waters",
        "leader": "Leader setup for ${userLocation} fishing",
        "bait": ["Effective baits available in ${userLocation}"],
        "lures": ["Effective lures for ${userLocation} waters"],
        "depth": "Fishing depth range typical for ${userLocation}",
        "speed": "Trolling speed if applicable for ${userLocation} conditions",
        "jig_weight": "Jig weights if applicable for ${userLocation} waters",
        "jig_size": "Jig sizes if applicable for ${userLocation} fishing"
      },
      "proTip": "Local ${userLocation} fishing tip for this species"
    }
  ]
}`,
                },
              ],
              temperature: 0.3,
            }),
          },
        );

        // Second API call for detailed regulations
        const regulationsResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey.trim()}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `You are a fishing regulations expert with comprehensive knowledge of local fishing laws, size limits, bag limits, and licensing requirements worldwide. Provide accurate, up-to-date regulatory information for the specific location and species requested. Return only valid JSON without any additional text or formatting.`,
                },
                {
                  role: "user",
                  content: `Provide detailed fishing regulations for ${initialData.name} in ${userLocation}. Today is ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. Return only valid JSON in this exact format:

{
  "sizeLimit": "Minimum and/or maximum size limits for ${initialData.name} in ${userLocation} (e.g., 'Minimum 25cm, Maximum 60cm' or 'No size restrictions' or 'Not specified')",
  "bagLimit": "Daily bag limit for ${initialData.name} in ${userLocation} (e.g., '5 fish per day' or 'No bag limit' or 'Not specified')",
  "seasonDates": "Official open/closed season dates for ${initialData.name} in ${userLocation} (e.g., 'Open: May 1 - September 30' or 'Year-round' or 'Check local regulations')",
  "licenseRequired": "Fishing license requirements in ${userLocation} (e.g., 'Recreational fishing license required' or 'No license required for shore fishing' or 'Commercial license only')",
  "additionalRules": ["List of additional specific rules for ${initialData.name} in ${userLocation} such as gear restrictions, area closures, catch and release requirements, etc."],
  "penalties": "Penalties for violations in ${userLocation} (e.g., 'Fines from €50-€500' or 'Varies by violation' or 'Contact local authorities')",
  "lastUpdated": "When these regulations were last updated or verified (e.g., '2024' or 'Check with local authorities for current regulations')"
}`,
                },
              ],
              temperature: 0.2,
            }),
          },
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        if (!regulationsResponse.ok)
          throw new Error(
            `Regulations API error: ${regulationsResponse.status}`,
          );

        const data = await response.json();
        const regulationsData = await regulationsResponse.json();
        // Initialize result with default values to prevent reference errors
        let result = {
          description: "No description available.",
          fishingMethods: [],
          fishingSeasons: {
            inSeason: [],
            traditionalSeason: [],
            conservationConcerns: "",
            regulations: "",
            notInSeason: [],
            reasoning: "",
          },
          allRoundGear: null,
        };

        let regulationsResult = {
          sizeLimit: "Not specified",
          bagLimit: "Not specified",
          seasonDates: "Check local regulations",
          licenseRequired: "Check local requirements",
          additionalRules: [],
          penalties: "Contact local authorities",
          lastUpdated: "Unknown",
        };

        try {
          const content = data.choices[0].message.content.trim();
          // Remove any markdown formatting if present
          const cleanContent = content.replace(/```json\n?|```\n?/g, "").trim();
          result = JSON.parse(cleanContent);
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
            // Don't throw error, use the default values instead
            console.warn("Using default values due to parsing error");
          }
        }

        // Parse regulations response
        try {
          const regulationsContent =
            regulationsData.choices[0].message.content.trim();
          const cleanRegulationsContent = regulationsContent
            .replace(/```json\n?|```\n?/g, "")
            .trim();
          regulationsResult = JSON.parse(cleanRegulationsContent);
        } catch (parseError) {
          console.error("Regulations JSON parse error:", parseError);
          console.log(
            "Raw regulations content:",
            regulationsData.choices[0].message.content,
          );
          // Try to fix common JSON issues
          const fixedRegulationsContent =
            regulationsData.choices[0].message.content
              .replace(/\n/g, " ")
              .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
              .replace(/:\s*'([^']*)'/g, ':"$1"');

          try {
            regulationsResult = JSON.parse(fixedRegulationsContent);
            console.log("Fixed regulations JSON parsing successful");
          } catch (secondError) {
            console.error("Failed to fix regulations JSON:", secondError);
            console.warn(
              "Using default regulations values due to parsing error",
            );
          }
        }

        // Ensure we have fishing methods array from the API response
        const fishingMethods = result.fishingMethods || [];
        console.log(
          `Received ${fishingMethods.length} fishing methods from API`,
        );

        // Extract fishing seasons from the API response
        const fishingSeasons = result.fishingSeasons || {};
        console.log("=== API RESPONSE DEBUG ===");
        console.log("Raw API result:", result);
        console.log("Fishing seasons from API:", fishingSeasons);
        console.log("inSeason array from API:", fishingSeasons.inSeason);
        console.log("=========================");

        const fishDetailsData = {
          ...initialData,
          description: result.description || "No description available.",
          fishingMethods: fishingMethods,
          allRoundGear: result.allRoundGear,
          fishingSeasons: result.fishingSeasons,
          fishingRegulations: regulationsResult,
          localNames: result.localNames || [],
          currentSeasonStatus: result.currentSeasonStatus || "Status unknown",
          officialSeasonDates:
            result.officialSeasonDates || "Dates not available",
          fishingLocation: result.fishingLocation || userLocation,
        };

        setFishDetails(fishDetailsData);

        // Load the fish image from Vercel Blob storage
        try {
          console.log(
            `Loading image for ${fishDetailsData.name} (${fishDetailsData.scientificName})`,
          );
          const blobImageUrl = await getFishImageUrlFromService(
            fishDetailsData.name,
            fishDetailsData.scientificName,
          );
          console.log(`Got blob image URL: ${blobImageUrl}`);
          setFishImageUrl(blobImageUrl);
        } catch (imageError) {
          console.error(`Error loading fish image:`, imageError);
          setFishImageUrl(getPlaceholderFishImage());
        } finally {
          setImageLoading(false);
        }
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
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full lg:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2 dark:text-white">
              Loading...
            </h1>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Desktop Side Navigation */}
          <div className="hidden lg:block">
            <SideNav />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Desktop Header */}
            <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold ml-2 dark:text-white">
                  Loading...
                </h1>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <LoadingDots color="#0251FB" size={6} />
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  if (error || !fishDetails) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full lg:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2 dark:text-white">Error</h1>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Desktop Side Navigation */}
          <div className="hidden lg:block">
            <SideNav />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Desktop Header */}
            <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold ml-2 dark:text-white">
                  Error
                </h1>
              </div>
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

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full lg:hidden">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-2 dark:text-white">
            {fishDetails.name}
          </h1>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Side Navigation */}
        <div className="hidden lg:block">
          <SideNav />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Fish Details Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Desktop Header */}
            <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold ml-2 dark:text-white">
                  {fishDetails.name}
                </h1>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">
              {/* Fish Image Card */}
              <Card className="overflow-hidden rounded-xl">
                <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
                  {imageLoading ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                      <div className="text-gray-400">Loading image...</div>
                    </div>
                  ) : (
                    <img
                      src={
                        fishImageUrl ||
                        fishDetails.image ||
                        getPlaceholderFishImage()
                      }
                      alt={fishDetails.name}
                      className="w-full h-full object-cover absolute top-0 left-0"
                      onError={(e) => {
                        console.log(
                          `Fish detail image error for ${fishDetails.name}`,
                        );
                        handleFishImageError(e, fishDetails.name);
                      }}
                    />
                  )}
                  {/* Toxic label for toxic fish */}
                  {fishDetails.isToxic && (
                    <div className="absolute bottom-4 right-4 bg-red-600 px-3 py-1 rounded-3xl text-xs font-medium text-white z-10">
                      TOXIC
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h1 className="font-semibold text-xl text-white">
                      {fishDetails.name}
                    </h1>
                    <p className="text-white/80 text-xs italic">
                      {fishDetails.scientificName}
                    </p>
                  </div>
                  <div className="absolute -bottom-4 left-0 right-0 h-4 bg-red-600"></div>
                </div>
              </Card>

              {/* Toxicity Information Card - Only visible for toxic fish */}
              {fishDetails.isToxic && (
                <Card className="p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-4">
                    Toxicity Information
                  </h2>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {fishDetails.dangerType ||
                        "This fish poses potential health risks. Exercise extreme caution when handling."}
                    </p>
                    <div>
                      <h3 className="font-medium text-base text-gray-900 dark:text-gray-100 mb-2">
                        Safe Handling
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Always wear protective gloves, avoid contact with spines
                        or secretions, use tools to remove hooks, and wash hands
                        thoroughly after contact.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-base text-gray-900 dark:text-gray-100 mb-2">
                        If Injured
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Rinse wound with hot water, apply pressure to control
                        bleeding, and seek immediate medical attention. Call
                        emergency services if symptoms are severe.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Description Card */}
              <Card className="p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4">About this Fish</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {fishDetails.description}
                </p>
              </Card>

              {/* Fishing Regulations Card */}
              {fishDetails.fishingRegulations && (
                <Card className="p-4 sm:p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      Fishing Regulations
                    </h2>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {fishDetails.fishingLocation ||
                        userLocationName ||
                        "Location not specified"}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Size Limit */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 flex-shrink-0 mt-0.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black dark:text-gray-300"
                        >
                          <path d="M3 6h18" />
                          <path d="M7 12h10" />
                          <path d="M10 18h4" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                          Size Limit
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {fishDetails.fishingRegulations.sizeLimit}
                        </span>
                      </div>
                    </div>

                    {/* Bag Limit */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 flex-shrink-0 mt-0.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black dark:text-gray-300"
                        >
                          <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v12z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                          Bag Limit
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {fishDetails.fishingRegulations.bagLimit}
                        </span>
                      </div>
                    </div>

                    {/* Season Dates */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 flex-shrink-0 mt-0.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black dark:text-gray-300"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                          Season Dates
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {fishDetails.fishingRegulations.seasonDates}
                        </span>
                      </div>
                    </div>

                    {/* License Required */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 flex-shrink-0 mt-0.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black dark:text-gray-300"
                        >
                          <rect
                            x="2"
                            y="3"
                            width="20"
                            height="14"
                            rx="2"
                            ry="2"
                          />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                          License Required
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {fishDetails.fishingRegulations.licenseRequired}
                        </span>
                      </div>
                    </div>

                    {/* Additional Rules */}
                    {fishDetails.fishingRegulations.additionalRules &&
                      fishDetails.fishingRegulations.additionalRules.length >
                        0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-6 flex-shrink-0 mt-0.5">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-black dark:text-gray-300"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                              Additional Rules
                            </span>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                              {fishDetails.fishingRegulations.additionalRules.map(
                                (rule, index) => (
                                  <li key={index} className="text-sm">
                                    {rule}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                    {/* Penalties */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 flex-shrink-0 mt-0.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black dark:text-gray-300"
                        >
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5" />
                          <path d="M2 12l10 5 10-5" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                          Penalties
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {fishDetails.fishingRegulations.penalties}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last updated: {fishDetails.fishingRegulations.lastUpdated}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Always verify current regulations with local authorities
                      before fishing.
                    </p>
                  </div>
                </Card>
              )}

              {/* Fishing Season Calendar Card */}
              <Card className="p-4 sm:p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Fishing Season</h2>
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {fishDetails.fishingLocation ||
                      userLocationName ||
                      "Location not specified"}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Best months to catch {fishDetails.name} in{" "}
                    {fishDetails.fishingLocation ||
                      userLocationName ||
                      "your area"}
                    :
                  </div>
                  <FishingSeasonCalendar
                    fishingSeasons={fishDetails.fishingSeasons}
                    fishName={fishDetails.name}
                    location={fishDetails.fishingLocation || userLocationName}
                  />

                  {/* Debug Section - Show raw data from OpenAI */}
                  {showDebugUI && (
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                        Debug: Raw OpenAI Data
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Official Season Dates (
                            {fishDetails.fishingLocation ||
                              userLocationName ||
                              "Location"}
                            ):
                          </span>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded border mt-1">
                            <code className="text-gray-800 dark:text-gray-200">
                              {fishDetails.officialSeasonDates || "No data"}
                            </code>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Current Season Status:
                          </span>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded border mt-1">
                            <code className="text-gray-800 dark:text-gray-200">
                              {fishDetails.currentSeasonStatus || "No data"}
                            </code>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            In Season Array:
                          </span>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded border mt-1">
                            <code className="text-gray-800 dark:text-gray-200">
                              {fishDetails.fishingSeasons?.inSeason
                                ? JSON.stringify(
                                    fishDetails.fishingSeasons.inSeason,
                                    null,
                                    2,
                                  )
                                : "No data"}
                            </code>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Local Names in{" "}
                            {fishDetails.fishingLocation ||
                              userLocationName ||
                              "Location"}
                            :
                          </span>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded border mt-1">
                            <code className="text-gray-800 dark:text-gray-200">
                              {fishDetails.localNames
                                ? JSON.stringify(
                                    fishDetails.localNames,
                                    null,
                                    2,
                                  )
                                : "No data"}
                            </code>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Conservation Concerns:
                          </span>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded border mt-1">
                            <code className="text-gray-800 dark:text-gray-200">
                              {fishDetails.fishingSeasons
                                ?.conservationConcerns || "No data"}
                            </code>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Regulations for{" "}
                            {fishDetails.fishingLocation ||
                              userLocationName ||
                              "Location"}
                            :
                          </span>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded border mt-1">
                            <code className="text-gray-800 dark:text-gray-200">
                              {fishDetails.fishingSeasons?.regulations ||
                                "No data"}
                            </code>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Biological Reasoning:
                          </span>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded border mt-1">
                            <code className="text-gray-800 dark:text-gray-200">
                              {fishDetails.fishingSeasons
                                ?.biologicalReasoning || "No data"}
                            </code>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Array Length:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {fishDetails.fishingSeasons?.inSeason?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Array Type:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {typeof fishDetails.fishingSeasons?.inSeason}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Fishing Location:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {fishDetails.fishingLocation ||
                              userLocationName ||
                              "Not specified"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Today's Date:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {new Date().toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reasoning */}
                  {fishDetails.fishingSeasons?.reasoning && (
                    <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Seasonal Information
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fishDetails.fishingSeasons.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* All Round Gear Card */}
              {fishDetails.allRoundGear && (
                <Card className="p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-4">All Round Gear</h2>
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
                        <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                          Rods
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
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
                        <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                          Reels
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
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
                        <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                          Line
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
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
                        <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                          Leader
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {fishDetails.allRoundGear.leader}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
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
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 space-y-6"
                  >
                    <h2 className="text-xl font-semibold">{method.title}</h2>

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
                          <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                            Location
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
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
                            <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                              {method.title.toLowerCase().includes("jig")
                                ? "Jigs"
                                : method.title.toLowerCase().includes("troll")
                                  ? "Lures"
                                  : method.gear?.bait
                                    ? "Bait"
                                    : "Lures"}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
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
                            <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                              Speed
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
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
                              <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                                Jig Weight
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
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
                              <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                                Jig Size
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
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
                              <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                                Hooks
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
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
                            <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                              Hook Size Range
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {method.gear.hook_size_range}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {method.description}
                    </p>

                    {/* Technical Details */}
                    {method.technical_details && (
                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <h4 className="font-medium text-base text-blue-700 dark:text-blue-400 mb-1">
                          Technical Details
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {method.technical_details}
                        </p>
                      </div>
                    )}

                    {/* Pro Tip */}
                    {method.proTip && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="font-medium text-base text-gray-900 dark:text-gray-100 mb-2">
                          Pro Tip
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {method.proTip}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    No fishing methods available for this fish.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Weather Widget - Desktop only */}
          <div className="hidden lg:block w-80 min-w-[320px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="h-full overflow-y-auto">
              <WeatherWidgetPro />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
};

export default FishDetailPage;
