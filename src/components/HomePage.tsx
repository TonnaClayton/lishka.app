import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, User } from "lucide-react";
import BottomNav from "./BottomNav";
import FishCard from "./FishCard";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

import { OPENAI_ENABLED, OPENAI_DISABLED_MESSAGE } from "@/lib/openai-toggle";
import { getBlobImage } from "@/lib/blob-storage";
import { getLocalFishName } from "@/lib/fishbase-api";
import { getFishImageUrl } from "@/lib/fish-image-service";
import { cacheApiResponse, getCachedApiResponse } from "@/lib/api-helpers";
import LoadingDots from "./LoadingDots";
import LocationSetup from "./LocationSetup";
import FishingTipsCarousel from "./FishingTipsCarousel";
import OffshoreFishingLocations from "./OffshoreFishingLocations";
import EmailVerificationBanner from "./EmailVerificationBanner";

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
  dangerType?: string;
  image?: string;
}

const HomePage: React.FC<HomePageProps> = ({
  location = "Malta",
  onLocationChange = () => {},
}) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [fishList, setFishList] = useState<FishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isLocationSetupOpen, setIsLocationSetupOpen] = useState(false);
  const [toxicFishList, setToxicFishList] = useState<FishData[]>([]);
  const [loadingToxicFish, setLoadingToxicFish] = useState(false);
  const [userLocation, setUserLocation] = useState(() => {
    // Try to get location from localStorage first
    const savedLocation = localStorage.getItem("userLocation");
    // If no saved location, check if we need to set up a default
    if (!savedLocation) {
      const defaultLocation = "Malta";
      localStorage.setItem("userLocation", defaultLocation);
      return defaultLocation;
    }
    return savedLocation || location;
  });
  const [debugInfo, setDebugInfo] = useState<{
    originalCount: number;
    filteredOut: { name: string; scientificName: string }[];
  } | null>(null);

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

  // Get current month-year for cache keys (more stable than daily dates)
  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  // Helper function to map locations to their corresponding seas/oceans
  const getLocationToSeaMapping = (location: string) => {
    // Handle country codes and extract proper country names
    const countryCodeMap: { [key: string]: string } = {
      mt: "Malta",
      us: "United States",
      uk: "United Kingdom",
      ca: "Canada",
      au: "Australia",
      nz: "New Zealand",
      fr: "France",
      es: "Spain",
      it: "Italy",
      gr: "Greece",
      tr: "Turkey",
      eg: "Egypt",
      ma: "Morocco",
      tn: "Tunisia",
      ly: "Libya",
      hr: "Croatia",
      me: "Montenegro",
      al: "Albania",
      cy: "Cyprus",
      lb: "Lebanon",
      sy: "Syria",
      il: "Israel",
      jo: "Jordan",
      sa: "Saudi Arabia",
      ae: "UAE",
      qa: "Qatar",
      kw: "Kuwait",
      bh: "Bahrain",
      om: "Oman",
      ye: "Yemen",
      dz: "Algeria",
      pt: "Portugal",
      mc: "Monaco",
      ad: "Andorra",
      sm: "San Marino",
      va: "Vatican",
      si: "Slovenia",
      ba: "Bosnia and Herzegovina",
      rs: "Serbia",
      bg: "Bulgaria",
      ro: "Romania",
      ua: "Ukraine",
      ru: "Russia",
      ge: "Georgia",
      am: "Armenia",
      az: "Azerbaijan",
    };

    // Location to Sea/Ocean mapping
    const locationToSeaMap: { [key: string]: string } = {
      // Mediterranean Sea
      malta: "Mediterranean Sea",
      spain: "Mediterranean Sea",
      france: "Mediterranean Sea",
      italy: "Mediterranean Sea",
      greece: "Mediterranean Sea",
      turkey: "Mediterranean Sea",
      cyprus: "Mediterranean Sea",
      croatia: "Mediterranean Sea",
      montenegro: "Mediterranean Sea",
      albania: "Mediterranean Sea",
      slovenia: "Mediterranean Sea",
      "bosnia and herzegovina": "Mediterranean Sea",
      serbia: "Mediterranean Sea",
      bulgaria: "Mediterranean Sea",
      romania: "Mediterranean Sea",
      lebanon: "Mediterranean Sea",
      syria: "Mediterranean Sea",
      israel: "Mediterranean Sea",
      egypt: "Mediterranean Sea",
      libya: "Mediterranean Sea",
      tunisia: "Mediterranean Sea",
      algeria: "Mediterranean Sea",
      morocco: "Mediterranean Sea",
      monaco: "Mediterranean Sea",

      // Atlantic Ocean
      "united states": "Atlantic Ocean",
      florida: "Atlantic Ocean",
      canada: "Atlantic Ocean",
      "united kingdom": "Atlantic Ocean",
      portugal: "Atlantic Ocean",
      ireland: "Atlantic Ocean",
      iceland: "Atlantic Ocean",
      norway: "Atlantic Ocean",
      brazil: "Atlantic Ocean",
      argentina: "Atlantic Ocean",
      "south africa": "Atlantic Ocean",
      namibia: "Atlantic Ocean",
      angola: "Atlantic Ocean",
      senegal: "Atlantic Ocean",
      ghana: "Atlantic Ocean",
      nigeria: "Atlantic Ocean",

      // Pacific Ocean
      australia: "Pacific Ocean",
      "new zealand": "Pacific Ocean",
      japan: "Pacific Ocean",
      philippines: "Pacific Ocean",
      indonesia: "Pacific Ocean",
      thailand: "Pacific Ocean",
      vietnam: "Pacific Ocean",
      malaysia: "Pacific Ocean",
      singapore: "Pacific Ocean",
      california: "Pacific Ocean",
      hawaii: "Pacific Ocean",
      chile: "Pacific Ocean",
      peru: "Pacific Ocean",
      ecuador: "Pacific Ocean",
      colombia: "Pacific Ocean",

      // Indian Ocean
      india: "Indian Ocean",
      "sri lanka": "Indian Ocean",
      maldives: "Indian Ocean",
      seychelles: "Indian Ocean",
      mauritius: "Indian Ocean",
      madagascar: "Indian Ocean",
      tanzania: "Indian Ocean",
      kenya: "Indian Ocean",
      somalia: "Indian Ocean",

      // Red Sea
      "saudi arabia": "Red Sea",
      jordan: "Red Sea",
      sudan: "Red Sea",
      eritrea: "Red Sea",
      djibouti: "Red Sea",
      yemen: "Red Sea",

      // Persian Gulf
      uae: "Persian Gulf",
      qatar: "Persian Gulf",
      kuwait: "Persian Gulf",
      bahrain: "Persian Gulf",
      oman: "Persian Gulf",
      iran: "Persian Gulf",
      iraq: "Persian Gulf",

      // Black Sea
      ukraine: "Black Sea",
      russia: "Black Sea",
      georgia: "Black Sea",
      armenia: "Black Sea",
      azerbaijan: "Black Sea",
    };

    let normalizedLocation = location.toLowerCase().trim();

    // Try to parse as JSON first (for location objects with country codes)
    try {
      const parsed = JSON.parse(location);
      if (
        parsed.countryCode &&
        countryCodeMap[parsed.countryCode.toLowerCase()]
      ) {
        normalizedLocation =
          countryCodeMap[parsed.countryCode.toLowerCase()].toLowerCase();
      } else if (parsed.name) {
        const parts = parsed.name.split(/[,\s]+/);
        normalizedLocation = parts[parts.length - 1].toLowerCase();
      }
    } catch (e) {
      // Not JSON, continue with string parsing
      const parts = location.split(/[,\s]+/);
      const country = parts[parts.length - 1].toLowerCase();

      // Check if it's a country code
      if (country.length === 2 && countryCodeMap[country]) {
        normalizedLocation = countryCodeMap[country].toLowerCase();
      } else {
        normalizedLocation = country;
      }
    }

    // Return the sea/ocean for this location, or default to "Regional Waters"
    return locationToSeaMap[normalizedLocation] || "Regional Waters";
  };

  // Helper function to get the clean location name
  const getCleanLocationName = (location: string) => {
    try {
      const parsed = JSON.parse(location);
      // If it's a JSON object with name, extract just the country part
      if (parsed.name) {
        const parts = parsed.name.split(/[,\s]+/);
        // Return the last part which should be the country
        return parts[parts.length - 1];
      }
      return parsed.name || location;
    } catch (e) {
      // For non-JSON strings, extract the country part
      const parts = location.split(/[,\s]+/);
      return parts[parts.length - 1];
    }
  };

  // Helper function to format the subtitle
  const getSeaName = (location: string) => {
    const cleanLocation = getCleanLocationName(location);
    const seaOcean = getLocationToSeaMapping(location);
    return `${cleanLocation} & ${seaOcean} waters`;
  };

  // Helper function to clean fish names by removing "Mediterranean" prefix
  const cleanFishName = (fishName: string): string => {
    if (!fishName) return fishName;

    // Remove "Mediterranean" and variations from the beginning of the name
    const cleanedName = fishName
      .replace(/^Mediterranean\s+/i, "")
      .replace(/^Mediterranean Sea\s+/i, "")
      .replace(/^Mediterranean-/i, "")
      .trim();

    // Ensure the first letter is capitalized after cleaning
    return cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
  };

  const fetchToxicFishData = async () => {
    console.log("Starting fetchToxicFishData");
    setLoadingToxicFish(true);
    try {
      // Validate OpenAI configuration
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey || !OPENAI_ENABLED) {
        throw new Error(OPENAI_DISABLED_MESSAGE);
      }

      // Validate location
      const validatedLocation = validateLocation(userLocation);
      if (!validatedLocation) {
        throw new Error("Invalid location data");
      }

      console.log("OpenAI API key validation passed");
      console.log(
        `Fetching toxic fish data for location: ${validatedLocation}`,
      );

      const currentMonth = getCurrentMonth();
      const currentMonthYear = getCurrentMonthYear();
      const cleanLocation = getCleanLocationName(userLocation);
      const seaOcean = getLocationToSeaMapping(userLocation);

      // Get coordinates from localStorage
      let latitude = 35.8997; // Default Malta coordinates
      let longitude = 14.5146;

      try {
        const savedLocationFull = localStorage.getItem("userLocationFull");
        if (savedLocationFull) {
          const locationData = JSON.parse(savedLocationFull);
          latitude = locationData.latitude || latitude;
          longitude = locationData.longitude || longitude;
        }
      } catch (e) {
        console.warn(
          "Could not parse saved location coordinates, using defaults",
        );
      }

      // Use month-year instead of exact date for better cache persistence
      // Updated cache key to v5 to reflect new prompt with coordinates and probability scoring
      const cacheKey = `toxic_fish_data_v5_${cleanLocation}_${seaOcean}_${currentMonthYear}_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;

      // Check cache first
      const cachedData = getCachedApiResponse(cacheKey);
      if (cachedData) {
        console.log(
          "Using cached toxic fish data for",
          userLocation,
          seaOcean,
          currentMonth,
        );

        // Handle both old cache format (just fish list) and new format (with debug info)
        if (cachedData.toxicFishList && cachedData.debugInfo) {
          // New cache format with debug info
          setToxicFishList(cachedData.toxicFishList);
          setDebugInfo(cachedData.debugInfo);
        } else if (Array.isArray(cachedData)) {
          // Old cache format (just fish list)
          setToxicFishList(cachedData);
          // Set default debug info for old cached data
          setDebugInfo({
            originalCount: cachedData.length,
            filteredOut: [],
          });
        }

        setLoadingToxicFish(false);
        return;
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            max_tokens: 4000,
            messages: [
              {
                role: "system",
                content:
                  "You are a marine biology expert. You must respond with ONLY a valid JSON array. Do not include any explanations, markdown formatting, code blocks, or additional text. Start your response with [ and end with ].",
              },
              {
                role: "user",
                content: `You are a marine biology expert with access to authoritative species occurrence data, habitat preferences, and geospatial information. Return a comprehensive JSON list of genuinely toxic marine organisms from the ${seaOcean} near ${cleanLocation} at coordinates ${latitude}, ${longitude}.

These organisms must meet one of the following strict toxicity criteria:

TOXIC TO HANDLE (Venomous/Dangerous to Touch)
Include organisms that:
- Possess venomous spines, barbs, stingers, or glands
- Have toxic skin, mucus, or secretions that can cause chemical burns, allergic reactions, or envenomation upon touch
- Can deliver venom via bite, sting, or contact (e.g., jellyfish, sea urchins, octopuses)

TOXIC TO EAT (Poisonous When Consumed)
Include organisms that:
- Contain natural biotoxins (e.g., tetrodotoxin, palytoxin, ciguatoxin, domoic acid)
- Are known to accumulate marine toxins in their flesh or organs
- Are scientifically confirmed to cause serious or fatal poisoning when eaten, even after cooking

INCLUDE:
- Fish
- Cephalopods (e.g., octopuses)
- Cnidarians (e.g., jellyfish)
- Echinoderms (e.g., sea urchins)
- Mollusks (e.g., cone snails, bivalves)
- Marine plants and algae (e.g., toxic seaweed, harmful algal blooms)
- Other toxic marine invertebrates

EXCLUDE:
- Any non-toxic species
- Species that are only dangerous due to sharpness or appearance without venom
- Edible species that are only risky when spoiled or improperly cooked
- Any species lacking confirmed toxicity in scientific or regional poison control databases

ADDITIONAL BEHAVIOR: ORDER BY CATCH LIKELIHOOD
Rank the results by probability of being encountered at the given coordinates:
- Cross-reference the organism's preferred habitat with the local seabed type (e.g., rocky, sandy, seagrass, pelagic, reef, artificial structures)
- Use environmental preferences such as depth range, temperature, and season
- If the location favors multiple habitats, consider overlap and adjust probability accordingly

RETURN FORMAT (JSON array only):
Each entry must follow this format:
{
  "name": "Common name",
  "scientificName": "Genus species",
  "habitat": "Brief description of where it lives",
  "difficulty": "Expert",
  "season": "Seasonal availability or bloom period",
  "dangerType": "Toxic to handle - reason" or "Toxic to eat - reason",
  "isToxic": true,
  "probabilityScore": 0.0 to 1.0
}

Example Output:
[
  {
    "name": "Greater Weever",
    "scientificName": "Trachinus draco",
    "habitat": "Sandy and muddy bottoms, shallow coastal waters",
    "difficulty": "Expert",
    "season": "Year-round",
    "dangerType": "Toxic to handle - venomous dorsal and gill spines cause intense pain",
    "isToxic": true,
    "probabilityScore": 0.93
  }
]

FINAL RULE:
Return only genuinely toxic marine organisms. If there are fewer than 20 such species in the region, list only those confirmed. Do not pad the list or make assumptions without habitat match or toxicity confirmation.`,
              },
            ],
            temperature: 0.1,
            max_tokens: 4000,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Always log the raw API response for debugging
      console.log("=== RAW OPENAI API RESPONSE FOR TOXIC FISH ===");
      console.log("Model used:", "gpt-4o");
      console.log("Location:", userLocation);
      console.log("Raw content:", content);
      console.log("Content length:", content.length);
      console.log("=============================================");

      let toxicFishData: FishData[];
      try {
        // Clean the response more thoroughly
        let jsonStr = content.trim();

        // Remove any markdown code blocks and formatting
        jsonStr = jsonStr.replace(/```json\s*|```\s*|```/g, "");
        jsonStr = jsonStr.replace(/^[^\[\{]*/, ""); // Remove text before first [ or {
        jsonStr = jsonStr.replace(/[^\]\}]*$/, ""); // Remove text after last ] or }

        // Find the JSON array boundaries more precisely
        const arrayStart = jsonStr.indexOf("[");
        const arrayEnd = jsonStr.lastIndexOf("]");

        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          jsonStr = jsonStr.substring(arrayStart, arrayEnd + 1);
        }

        console.log("Cleaned toxic fish JSON string:", jsonStr);
        toxicFishData = JSON.parse(jsonStr);

        // Validate the parsed data
        if (!Array.isArray(toxicFishData)) {
          throw new Error("Response is not an array");
        }

        // Debug: Log the original count (no filtering)
        let originalCount = toxicFishData.length;
        let filteredOut: { name: string; scientificName: string }[] = [];

        console.log(
          `DEBUG: Original toxic fish count from OpenAI: ${originalCount}`,
        );
        console.log(
          "DEBUG: Original toxic fish list:",
          toxicFishData.map((fish) => ({
            name: fish.name,
            scientificName: fish.scientificName,
          })),
        );

        // No filtering - keep all fish as returned by OpenAI

        // Store debug info for UI display
        setDebugInfo({
          originalCount,
          filteredOut,
        });

        console.log(
          `DEBUG: Final toxic fish count (no filtering): ${toxicFishData.length}`,
        );

        // Ensure each fish has required fields, clean scientific names, and is marked as toxic
        toxicFishData = toxicFishData.map((fish) => {
          let cleanScientificName = fish.scientificName || "Unknown";

          // Remove common abbreviations and ensure proper binomial nomenclature
          if (cleanScientificName !== "Unknown") {
            cleanScientificName = cleanScientificName
              .replace(/\s+(spp?\.?|cf\.?|aff\.?)\s*$/i, "") // Remove spp., sp., cf., aff. at the end
              .replace(/\s+(spp?\.?|cf\.?|aff\.?)\s+/gi, " ") // Remove these abbreviations in the middle
              .trim();

            // Ensure we have at least genus and species (two words)
            const parts = cleanScientificName.split(/\s+/);
            if (parts.length < 2) {
              cleanScientificName = "Unknown";
            } else if (parts.length > 2) {
              // Keep only genus and species (first two words)
              cleanScientificName = `${parts[0]} ${parts[1]}`;
            }
          }

          return {
            name: cleanFishName(fish.name) || "Unknown Toxic Fish",
            scientificName: cleanScientificName,
            habitat: fish.habitat || "Unknown",
            difficulty: fish.difficulty || "Expert",
            season: fish.season || "Year-round",
            dangerType: fish.dangerType || "Toxic - handle with caution",
            isToxic: true,
            probabilityScore: fish.probabilityScore || 0.5,
          };
        });
      } catch (e) {
        console.error("Error parsing toxic fish data:", e);
        console.error("Raw toxic fish response:", content);

        // No fallback data - show error message instead
        toxicFishData = [];

        console.log("Using fallback toxic fish data due to parsing error");
      }

      // Set toxic fish data immediately for faster display (already ordered by probability from prompt)
      const toxicFishWithDefaults = toxicFishData.map((fish) => ({
        ...fish,
        name: cleanFishName(fish.name),
        isToxic: true,
      }));

      // Debug log
      console.log(
        `DEBUG: Received ${toxicFishWithDefaults.length} toxic fish from OpenAI API for ${cleanLocation} (${seaOcean}) at coordinates ${latitude}, ${longitude}`,
      );
      console.log(
        "DEBUG: Toxic fish data (ordered by probability):",
        toxicFishWithDefaults.map((fish) => ({
          name: fish.name,
          scientificName: fish.scientificName,
          probabilityScore: fish.probabilityScore,
        })),
      );

      setToxicFishList(toxicFishWithDefaults);

      // Cache both fish data and debug info for 24 hours (longer cache duration)
      const cacheData = {
        toxicFishList: toxicFishWithDefaults,
        debugInfo: {
          originalCount: toxicFishWithDefaults.length,
          filteredOut: [],
        },
      };
      cacheApiResponse(cacheKey, cacheData, 24 * 60 * 60 * 1000);

      // Load images and local names in background
      Promise.allSettled(
        toxicFishData.map(async (fish, index) => {
          let imageUrl;
          let localName;

          try {
            imageUrl = await getFishImageUrl(fish.name, fish.scientificName);
          } catch (e) {
            console.error(`Error fetching image for ${fish.name}:`, e);
          }

          try {
            const browserLang = navigator.language.split("-")[0] || "en";
            localName = await getLocalFishName(
              fish.scientificName,
              browserLang,
            );
          } catch (e) {
            console.error(`Error fetching local name for ${fish.name}:`, e);
          }

          // Update individual toxic fish with image and local name
          if (imageUrl || localName) {
            setToxicFishList((prev) => {
              const newList = [...prev];
              if (newList[index]) {
                newList[index] = {
                  ...newList[index],
                  image: imageUrl || newList[index].image,
                  localName: localName || newList[index].localName,
                };
              }
              return newList;
            });
          }
        }),
      );
    } catch (err) {
      console.error("Error fetching toxic fish data:", err);
      // More detailed error logging
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
      }
      setToxicFishList([]);
      setError(
        err instanceof Error ? err.message : "Failed to fetch toxic fish data",
      );
    } finally {
      console.log("Finished fetchToxicFishData");
      setLoadingToxicFish(false);
    }
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
      const currentMonthYear = getCurrentMonthYear();
      const pageSize = 50; // Increased from 20 to 50
      const currentPage = isLoadMore ? page + 1 : 1;
      const cleanLocation = getCleanLocationName(userLocation);

      // Create cache key based on location and month-year for better cache persistence
      const cacheKey = `fish_data_v3_${cleanLocation}_${currentMonthYear}_page_${currentPage}`;

      // Check cache first (only for initial load, not for load more)
      if (!isLoadMore) {
        const cachedData = getCachedApiResponse(cacheKey);
        if (cachedData) {
          console.log("Using cached fish data for", userLocation, currentMonth);
          setFishList(cachedData);
          setPage(1);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a marine biology expert. You must respond with ONLY a valid JSON array. Do not include any explanations, markdown formatting, code blocks, or additional text. Start your response with [ and end with ].",
              },
              {
                role: "user",
                content: `Generate a JSON array with exactly ${pageSize} fish species that are NATIVE and commonly found in the ${getLocationToSeaMapping(userLocation)} near ${cleanLocation} during ${currentMonth}. CRITICAL GEOGRAPHIC REQUIREMENT: Only include fish species that are naturally occurring and indigenous to the ${getLocationToSeaMapping(userLocation)} region. DO NOT include tropical, exotic, or non-native species that would not naturally be found in these waters. For example, if the location is Malta (Mediterranean Sea), do NOT include clownfish, angelfish, or other tropical species. Focus on temperate and regional species appropriate for the specific sea/ocean. Format: [{\"name\":\"Fish Name\",\"scientificName\":\"Scientific Name\",\"habitat\":\"Habitat Description\",\"difficulty\":\"Easy\",\"season\":\"Season Info\",\"isToxic\":false}]. Mix of difficulty levels (Easy/Intermediate/Hard/Advanced/Expert). CRITICAL: scientificName must be complete binomial nomenclature (Genus species) - NEVER use spp., sp., cf., aff., or any abbreviations. Examples: \"Thunnus thynnus\" NOT \"Thunnus spp.\" or \"Thunnus sp.\". Each scientific name must be a specific species with both genus and species names. Return only the JSON array.`,
              },
            ],
            temperature: 0.1,
            max_tokens: 2000,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse the JSON response with better error handling
      let fishData: FishData[];
      try {
        // Clean the response more thoroughly
        let jsonStr = content.trim();

        // Remove any markdown code blocks and formatting
        jsonStr = jsonStr.replace(/```json\s*|```\s*|```/g, "");
        jsonStr = jsonStr.replace(/^[^\[\{]*/, ""); // Remove text before first [ or {
        jsonStr = jsonStr.replace(/[^\]\}]*$/, ""); // Remove text after last ] or }

        // Find the JSON array boundaries more precisely
        const arrayStart = jsonStr.indexOf("[");
        const arrayEnd = jsonStr.lastIndexOf("]");

        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          jsonStr = jsonStr.substring(arrayStart, arrayEnd + 1);
        }

        console.log("Cleaned JSON string:", jsonStr);
        fishData = JSON.parse(jsonStr);

        // Validate the parsed data
        if (!Array.isArray(fishData)) {
          throw new Error("Response is not an array");
        }

        // No filtering - keep all fish as returned by OpenAI

        // Ensure each fish has required fields and clean scientific names
        fishData = fishData.map((fish) => {
          let cleanScientificName = fish.scientificName || "Unknown";

          // Remove common abbreviations and ensure proper binomial nomenclature
          if (cleanScientificName !== "Unknown") {
            cleanScientificName = cleanScientificName
              .replace(/\s+(spp?\.?|cf\.?|aff\.?)\s*$/i, "") // Remove spp., sp., cf., aff. at the end
              .replace(/\s+(spp?\.?|cf\.?|aff\.?)\s+/gi, " ") // Remove these abbreviations in the middle
              .trim();

            // Ensure we have at least genus and species (two words)
            const parts = cleanScientificName.split(/\s+/);
            if (parts.length < 2) {
              cleanScientificName = "Unknown";
            } else if (parts.length > 2) {
              // Keep only genus and species (first two words)
              cleanScientificName = `${parts[0]} ${parts[1]}`;
            }
          }

          return {
            name: fish.name || "Unknown Fish",
            scientificName: cleanScientificName,
            habitat: fish.habitat || "Unknown",
            difficulty: fish.difficulty || "Intermediate",
            season: fish.season || "Year-round",
            isToxic: Boolean(fish.isToxic),
          };
        });
      } catch (e) {
        console.error("Error parsing OpenAI response:", e);
        console.error("Raw response:", content);

        // Log the error details for debugging
        console.error("JSON parsing failed. Raw content:", content);
        console.error("Cleaned content:", jsonStr);

        // No fallback data - throw error to show user-friendly message
        throw new Error(
          "Unable to parse fish data from API response. Please try again.",
        );
      }

      // This will be handled after cross-referencing with toxic fish list

      // Cross-reference with toxic fish list to ensure consistency
      const crossReferencedFishData = fishData.map((fish) => {
        const isToxicInToxicList = toxicFishList.some(
          (toxicFish) =>
            toxicFish.scientificName.toLowerCase() ===
            fish.scientificName.toLowerCase(),
        );
        return {
          ...fish,
          isToxic: fish.isToxic || isToxicInToxicList,
        };
      });

      // Update state with cross-referenced data
      if (isLoadMore) {
        setFishList((prev) => [...prev, ...crossReferencedFishData]);
        setPage(currentPage);
      } else {
        setFishList(crossReferencedFishData);
        setPage(1);
        // Cache the cross-referenced data for 12 hours
        cacheApiResponse(
          cacheKey,
          crossReferencedFishData,
          12 * 60 * 60 * 1000,
        );
      }

      // Load images and local names in background without blocking UI
      Promise.allSettled(
        crossReferencedFishData.map(async (fish, index) => {
          let imageUrl;
          let localName;

          try {
            imageUrl = await getFishImageUrl(fish.name, fish.scientificName);
          } catch (e) {
            console.error(`Error fetching image for ${fish.name}:`, e);
          }

          try {
            const browserLang = navigator.language.split("-")[0] || "en";
            localName = await getLocalFishName(
              fish.scientificName,
              browserLang,
            );
          } catch (e) {
            console.error(`Error fetching local name for ${fish.name}:`, e);
          }

          // Update individual fish with image and local name
          if (imageUrl || localName) {
            setFishList((prev) => {
              const newList = [...prev];
              const fishIndex = isLoadMore
                ? prev.length - crossReferencedFishData.length + index
                : index;
              if (newList[fishIndex]) {
                newList[fishIndex] = {
                  ...newList[fishIndex],
                  image: imageUrl || newList[fishIndex].image,
                  localName: localName || newList[fishIndex].localName,
                };
              }
              return newList;
            });
          }
        }),
      );
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

  // Location validation and standardization
  const validateLocation = (location: string) => {
    if (!location) return "Unknown Location";
    try {
      // Handle JSON string locations
      const parsed = JSON.parse(location);
      return parsed.name || location;
    } catch {
      // Not JSON, use as is
      return location;
    }
  };

  // Separate effect for location initialization
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      const validatedLocation = validateLocation(savedLocation);
      setUserLocation(validatedLocation);
    }
  }, []);

  // Track previous location to avoid unnecessary cache clearing
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);

  // Main effect for location changes
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const handleLocationChange = async () => {
      if (!isMounted) return;

      // Validate location before proceeding
      const validatedLocation = validateLocation(userLocation);
      if (!validatedLocation) {
        console.error("Invalid location");
        return;
      }

      // Only clear cache and reset states if location actually changed
      const locationChanged =
        previousLocation !== null && previousLocation !== validatedLocation;

      if (locationChanged) {
        console.log(
          `Location changed from ${previousLocation} to ${validatedLocation}, clearing cache`,
        );

        // Clear cache only for the old location
        const currentMonthYear = getCurrentMonthYear();
        const seaOcean = getLocationToSeaMapping(validatedLocation);
        const cleanLocation = getCleanLocationName(validatedLocation);

        // Clear old cache entries (use v5 keys for toxic fish with coordinates)
        const fishDataCacheKey = `fish_data_v3_${cleanLocation}_${currentMonthYear}_page_1`;

        // Get coordinates for cache key
        let latitude = 35.8997; // Default Malta coordinates
        let longitude = 14.5146;

        try {
          const savedLocationFull = localStorage.getItem("userLocationFull");
          if (savedLocationFull) {
            const locationData = JSON.parse(savedLocationFull);
            latitude = locationData.latitude || latitude;
            longitude = locationData.longitude || longitude;
          }
        } catch (e) {
          console.warn(
            "Could not parse saved location coordinates for cache clearing",
          );
        }

        const toxicFishCacheKey = `toxic_fish_data_v5_${cleanLocation}_${seaOcean}_${currentMonthYear}_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;

        localStorage.removeItem(fishDataCacheKey);
        localStorage.removeItem(toxicFishCacheKey);

        // Reset states
        setFishList([]);
        setToxicFishList([]);
        setError(null);
        setLoading(true);
        setLoadingToxicFish(true);
      } else if (previousLocation === null) {
        // First load - check if we have cached data before showing loading
        const currentMonthYear = getCurrentMonthYear();
        const seaOcean = getLocationToSeaMapping(validatedLocation);
        const cleanLocation = getCleanLocationName(validatedLocation);

        const fishDataCacheKey = `fish_data_v3_${cleanLocation}_${currentMonthYear}_page_1`;

        // Get coordinates for cache key
        let latitude = 35.8997; // Default Malta coordinates
        let longitude = 14.5146;

        try {
          const savedLocationFull = localStorage.getItem("userLocationFull");
          if (savedLocationFull) {
            const locationData = JSON.parse(savedLocationFull);
            latitude = locationData.latitude || latitude;
            longitude = locationData.longitude || longitude;
          }
        } catch (e) {
          console.warn(
            "Could not parse saved location coordinates for cache checking",
          );
        }

        const toxicFishCacheKey = `toxic_fish_data_v5_${cleanLocation}_${seaOcean}_${currentMonthYear}_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;

        const cachedFishData = getCachedApiResponse(fishDataCacheKey);
        const cachedToxicData = getCachedApiResponse(toxicFishCacheKey);

        if (!cachedFishData) {
          setLoading(true);
        }
        if (!cachedToxicData) {
          setLoadingToxicFish(true);
        }
      }

      // Update previous location
      setPreviousLocation(validatedLocation);

      // Fetch data with delay
      timeoutId = setTimeout(async () => {
        if (!isMounted) return;

        try {
          // Fetch both sets of data in parallel
          await Promise.all([fetchFishData(), fetchToxicFishData()]);
        } catch (error) {
          console.error("Error fetching data:", error);
          if (isMounted) {
            setError(
              error instanceof Error ? error.message : "Failed to fetch data",
            );
          }
        }
      }, 100);
    };

    handleLocationChange();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userLocation]);

  const handleFishClick = (fish: FishData) => {
    // Use a sanitized version of the name for the URL
    const sanitizedName = fish.scientificName
      ? fish.scientificName
          .replace(/[^a-zA-Z0-9]/g, "-")
          .replace(/-+/g, "-")
          .toLowerCase()
      : fish.name
          .replace(/[^a-zA-Z0-9]/g, "-")
          .replace(/-+/g, "-")
          .toLowerCase();

    navigate(`/fish/${sanitizedName}`, {
      state: { fish },
    });
  };

  const handleLoadMore = () => {
    fetchFishData(true);
  };

  // Helper function to get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle avatar click to navigate to profile
  const handleAvatarClick = () => {
    navigate("/profile");
  };

  return (
    <div className="flex flex-col dark:bg-background border-l-0 border-y-0 border-r-0 rounded-xl">
      {/* Email Verification Banner */}
      <EmailVerificationBanner />

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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLocationSetupOpen(true)}
              className="flex items-center gap-1 text-[#0251FB] dark:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <MapPin className="h-4 w-4" />
              <span className="truncate">{userLocation}</span>
            </Button>
            {/* User Avatar */}
            <Avatar
              className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleAvatarClick}
            >
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {profile?.full_name || user?.full_name ? (
                  getInitials(profile?.full_name || user?.full_name || "")
                ) : (
                  <User className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex-1 w-full p-4 lg:p-6 pb-20 p-4">
        {/* Fishing Tips Carousel Section */}
        <div className="mb-8">
          <FishingTipsCarousel location={userLocation} />
        </div>

        {/* Toxic Fish Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
            Toxic & Risky Catches
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Venomous and toxic fish found in {getSeaName(userLocation)}.
          </p>
          {/* Debug Info */}
          {toxicFishList.length > 0 &&
            localStorage.getItem("showToxicFishDebug") === "true" && (
              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs space-y-1">
                <div className="font-mono text-blue-700 dark:text-blue-400">
                  DEBUG: Final toxic fish count: {toxicFishList.length}
                </div>
                {/* Show debug info from state if available */}
                {debugInfo && (
                  <>
                    <div className="font-mono text-blue-700 dark:text-blue-400">
                      Location: {getSeaName(userLocation)}
                    </div>
                    <div className="font-mono text-blue-700 dark:text-blue-400">
                      Original count from OpenAI: {debugInfo.originalCount}
                    </div>
                    {debugInfo.filteredOut.length > 0 && (
                      <div className="font-mono text-orange-700 dark:text-orange-400">
                        Filtered out {debugInfo.filteredOut.length} fish:{" "}
                        {debugInfo.filteredOut.map((f) => f.name).join(", ")}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          {loadingToxicFish ? (
            <div className="flex items-center justify-center py-8">
              <LoadingDots />
              <p className="text-sm text-muted-foreground ml-2">
                Loading toxic fish data...
              </p>
            </div>
          ) : toxicFishList.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Unable to load toxic fish data at the moment. Please check your
                connection and try refreshing the page.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {toxicFishList.map((fish, index) => (
                <div
                  key={`toxic-${fish.scientificName}-${index}`}
                  className="flex-shrink-0 w-40"
                >
                  <FishCard
                    name={fish.name}
                    scientificName={fish.scientificName}
                    habitat={fish.habitat}
                    difficulty={fish.difficulty}
                    season={fish.season}
                    isToxic={fish.isToxic}
                    dangerType={fish.dangerType}
                    image={fish.image}
                    onClick={() => handleFishClick(fish)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offshore Fishing Locations Section - TEMPORARILY HIDDEN */}
        {/* TODO: This section requires refinement for accurate location suggestions */}
        {/* The OffshoreFishingLocations component needs improvement before re-enabling */}
        {/*
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
            Offshore Fishing Hotspots
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered analysis of underwater structures, wrecks, and drop-offs
            within 10NM of your location. Each spot is ranked by fish activity
            probability.
          </p>
          {localStorage.getItem("showLocationDebug") === "true" && (
            <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs">
              <div className="font-mono text-green-700 dark:text-green-400">
                DEBUG: Passing userLocation to OffshoreFishingLocations: "
                {userLocation}"
              </div>
            </div>
          )}
          <OffshoreFishingLocations userLocation={userLocation} />
        </div>
        */}

        {/* Active Fish Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
            Active fish in {getCurrentMonth()}
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
              {fishList.map((fish, index) => (
                <FishCard
                  key={`${fish.scientificName}-${index}`}
                  name={fish.name}
                  scientificName={fish.scientificName}
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
