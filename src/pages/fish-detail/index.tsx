import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, AlertCircle } from "lucide-react";
import BottomNav, { SideNav } from "@/components/bottom-nav";
import WeatherWidgetPro from "@/components/weather-widget-pro";
import { FishingGear, FishingSeasons, useFishDetails } from "@/hooks/queries";
import {
  handleFishImageError,
  getPlaceholderFishImage,
} from "@/lib/fish-image-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { log } from "@/lib/logging";
import { useProfile } from "@/hooks/queries";
import { useAuth } from "@/contexts/auth-context";
import FishDetailSkeleton from "./fish-detail-skeleton";

// Fishing Season Calendar Component
interface FishingSeasonCalendarProps {
  fishingSeasons?: FishingSeasons;
  fishName: string;
  location?: string;
}

const FishingSeasonCalendar: React.FC<FishingSeasonCalendarProps> = ({
  fishingSeasons,
  fishName,
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
      log(`No fishing seasons data available for ${fishName}`);
      return false;
    }

    // Convert all season entries to lowercase for comparison
    const seasonEntries = fishingSeasons.inSeason
      .map((season) =>
        typeof season === "string" ? season.toLowerCase().trim() : "",
      )
      .filter((season) => season.length > 0);

    log(`Checking month ${monthData.full} against seasons:`, seasonEntries);

    // If no valid season entries, return false
    if (seasonEntries.length === 0) {
      log(`No valid season entries found for ${fishName}`);
      return false;
    }

    // Check each season entry
    for (const season of seasonEntries) {
      log(`Processing season entry: "${season}"`);

      // Direct match with full month name
      if (season === monthData.full.toLowerCase()) {
        log(`✓ Direct match: ${season} === ${monthData.full.toLowerCase()}`);
        return true;
      }

      // Direct match with short month name
      if (season === monthData.short.toLowerCase()) {
        log(`✓ Short match: ${season} === ${monthData.short.toLowerCase()}`);
        return true;
      }

      // Check if season contains the month name (for entries like "spring", "summer", etc.)
      if (
        season.includes(monthData.full.toLowerCase()) ||
        season.includes(monthData.short.toLowerCase())
      ) {
        log(
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
          log(`✓ Seasonal match: ${monthData.full} is in ${season}`);
          return true;
        }
      }

      // Handle ranges like "January-March", "Jan-Mar", "March to June", etc.
      if (season.includes("-") || season.includes(" to ")) {
        const separator = season.includes("-") ? "-" : " to ";
        const [startSeason, endSeason] = season
          .split(separator)
          .map((s) => s.trim());

        log(`Processing range: ${startSeason} to ${endSeason}`);

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

          log(
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
            log(
              `✓ Range match: ${monthData.full} is in range ${startSeason}-${endSeason}`,
            );
            return true;
          }
        } else {
          log(
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
            log(
              `✓ List match: ${monthData.full} found in comma-separated list`,
            );
            return true;
          }
        }
      }
    }

    log(`✗ No match found for ${monthData.full}`);
    return false;
  };

  // Function to get month styling
  const getMonthStyling = (monthData: {
    short: string;
    full: string;
    index: number;
  }): string => {
    const isInSeason = isMonthInSeason(monthData);

    if (isInSeason) {
      // In season - light blue
      return "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300";
    } else {
      // Not in season - light gray
      return "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800/20 dark:border-gray-700 dark:text-gray-500";
    }
  };

  // Debug logging
  log("=== FISHING SEASON CALENDAR DEBUG ===");
  log("Fishing seasons data:", fishingSeasons);
  log("In season array:", fishingSeasons?.inSeason);
  log("Current month index:", currentMonthIndex);
  log("Current month name:", months[currentMonthIndex].full);
  log("=====================================");

  return (
    <div className="grid grid-cols-12 gap-0.5 sm:gap-1 text-center">
      {months.map((monthData) => {
        const styling = getMonthStyling(monthData);
        const isInSeason = isMonthInSeason(monthData);

        log(
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

const FishDetailPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile(user.id);
  const { fishName } = useParams<{ fishName: string }>();
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const [fishDetails, setFishDetails] = useState<FishDetails | null>(null);

  const [fishImageUrl] = useState<string>("");
  const [imageLoading] = useState(true);

  const {
    data: fishDetailsData,
    isLoading: isFishDetailsLoading,
    isError: isFishDetailError,
    error: fishDetailError,
  } = useFishDetails(fishName);

  // Cache keys for consistent data
  // const getCacheKey = (
  //   type: string,
  //   fishName: string,
  //   location: string,
  //   scientificName?: string
  // ) => {
  //   const key = `${type}_${fishName}_${location}_${scientificName || "unknown"}`
  //     .toLowerCase()
  //     .replace(/[^a-z0-9_]/g, "_");
  //   return key;
  // };

  //   // Cache duration: 7 days for regulations, 1 day for general info
  //   const CACHE_DURATION = {
  //     regulations: 7 * 24 * 60 * 60 * 1000, // 7 days
  //     fishInfo: 24 * 60 * 60 * 1000, // 1 day
  //   };

  //   const getCachedData = (cacheKey: string) => {
  //     try {
  //       const cached = localStorage.getItem(cacheKey);
  //       if (cached) {
  //         const { data, timestamp } = JSON.parse(cached);
  //         const now = Date.now();
  //         const maxAge = cacheKey.includes("regulations")
  //           ? CACHE_DURATION.regulations
  //           : CACHE_DURATION.fishInfo;

  //         if (now - timestamp < maxAge) {
  //           log(`✅ Using cached data for: ${cacheKey}`);
  //           return data;
  //         } else {
  //           log(`⏰ Cache expired for: ${cacheKey}`);
  //           localStorage.removeItem(cacheKey);
  //         }
  //       }
  //     } catch (error) {
  //       console.warn("Error reading cache:", error);
  //     }
  //     return null;
  //   };

  //   const setCachedData = (cacheKey: string, data: any) => {
  //     try {
  //       const cacheEntry = {
  //         data,
  //         timestamp: Date.now(),
  //       };
  //       localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  //       log(`💾 Cached data for: ${cacheKey}`);
  //     } catch (error) {
  //       console.warn("Error writing cache:", error);
  //     }
  //   };

  //   useEffect(() => {
  //     const getFishDetails = async () => {
  //       if (!fishName) {
  //         setError("No fish name provided");
  //         setLoading(false);
  //         return;
  //       }

  //       try {
  //         const apiKey = config.VITE_OPENAI_API_KEY;
  //         if (!apiKey) throw new Error("OpenAI API key is missing");

  //         const userLocation = profile?.location || "Unknown Location";

  //         const currentMonth = new Date().toLocaleString("default", {
  //           month: "long",
  //         });

  //         // Get initial data from navigation state or create default
  //         const fishNameFormatted = fishName.replace(/-/g, " ");
  //         const initialData = location.state?.fish || {
  //           name: fishNameFormatted,
  //           scientificName: "Unknown",
  //           image: await getFishImageUrlFromService(fishNameFormatted, "Unknown"),
  //         };

  //         // For API calls, we'll use both common and scientific names for better accuracy
  //         const fishIdentifier =
  //           initialData.scientificName && initialData.scientificName !== "Unknown"
  //             ? `${initialData.name} (${initialData.scientificName})`
  //             : initialData.name;

  //         // Check cache for fish info first
  //         const fishInfoCacheKey = getCacheKey(
  //           "fishinfo",
  //           initialData.name,
  //           userLocation,
  //           initialData.scientificName
  //         );
  //         const cachedFishInfo = getCachedData(fishInfoCacheKey);

  //         let result: any;
  //         if (cachedFishInfo) {
  //           result = cachedFishInfo;
  //           log("📋 Using cached fish info");
  //         } else {
  //           log("🌐 Fetching fresh fish info from API");
  //           // First API call for general fishing information
  //           const { text } = await generateTextWithAI({
  //             model: "gpt-4o",
  //             messages: [
  //               {
  //                 role: "system",
  //                 content: `You are a professional fishing guide, marine biologist, and tackle expert with deep global knowledge of fish species, seasonal patterns, fishing regulations, and advanced fishing methods.

  // CRITICAL ACCURACY REQUIREMENTS:
  // 🎯 ONLY provide information you are confident is accurate and verifiable
  // 🎯 For technical specifications (distances, depths, speeds, weights), provide RANGES rather than specific values
  // 🎯 Base recommendations on established fishing practices and scientific knowledge
  // 🎯 When uncertain about specific details, use conservative estimates or indicate uncertainty
  // 🎯 Cross-reference your knowledge with established fishing literature and practices
  // 🎯 Prioritize safety and proven techniques over experimental approaches

  // DATA VALIDATION RULES:
  // ✅ Trolling distances: Use appropriate ranges based on species and local conditions
  // ✅ Depths: Based on known habitat preferences and bathymetry
  // ✅ Gear specifications: Use industry-standard recommendations
  // ✅ Seasonal patterns: Based on biological cycles and migration patterns
  // ✅ Local conditions: Consider regional fishing practices and environmental factors

  // You will:
  // 1. Identify the top 3 most effective fishing methods for the given fish species at the specified location and date
  // 2. For each method, return method-specific gear details using the correct structure based on the method chosen
  // 3. Include a pro tip tailored to each method and the location
  // 4. Use realistic data ranges, tailored to local conditions, depths, and gear types
  // 5. Return only valid JSON in the exact format specified — do not include explanations or markdown

  // 🎣 Fishing Method Field Guide:
  // Use the matching fields in the gear object depending on the method selected:

  // Jigging
  // depth
  // jigType
  // jigWeight
  // jigColor
  // jiggingStyle
  // rodType
  // reelType
  // line
  // leader

  // Bottom Fishing
  // depth
  // hookSize
  // bait
  // rigType
  // weight
  // rodType
  // reelType
  // line
  // leader

  // Trolling
  // depth
  // lureType
  // lureSize
  // lureColor
  // trollingSpeed
  // trollingDistance
  // rodType
  // reelType
  // line
  // leader

  // Float Fishing
  // depth
  // floatType
  // hookSize
  // bait
  // line
  // leader
  // rodType

  // Spinning / Casting (Lure Fishing)
  // castingDistance
  // lureType
  // lureWeight
  // lureColor
  // rodType
  // reelType
  // line
  // leader

  // Deep Drop Fishing
  // depth
  // electricReel
  // rigType
  // bait
  // weight
  // lightAttractors
  // line
  // leader

  // Surface Casting
  // castingDistance
  // lureType
  // lureWeight
  // lureColor
  // rodType
  // reelType
  // line
  // leader

  // Live Bait Drifting
  // depth
  // bait
  // hookSize
  // rigType
  // line
  // leader
  // rodType`,
  //               },
  //               {
  //                 role: "user",
  //                 content: `Provide detailed fishing information for ${fishIdentifier} in ${userLocation}. Today is ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. Return only valid JSON in this exact format:
  // {
  // "name": "Common name of the species",
  // "scientificName": "Scientific name (Latin binomial nomenclature)",
  // "description": "Habitat, behavior, and identifying features specific to the region",
  // "localNames": ["Local names if known, otherwise empty array"],
  // "currentSeasonStatus": "Yes" or "No",
  // "officialSeasonDates": "e.g. 'June 1 - September 30' or 'Year-round'",
  // "fishingLocation": "${userLocation}",
  // "fishingSeasons": {
  // "inSeason": ["Months when it's typically targeted"],
  // "traditionalSeason": ["Traditional local fishing months"],
  // "conservationConcerns": "Status or pressures in this region",
  // "regulations": "Local rules or size/bag limits",
  // "biologicalReasoning": "Why it's in season (spawning, feeding, migration)",
  // "reasoning": "How biology relates to local laws"
  // },
  // "allRoundGear": {
  // "rods": "All-round rod recommendation",
  // "reels": "All-round reel type/size",
  // "line": "Line type and strength",
  // "leader": "Leader material and size",
  // "description": "General setup for multi-method fishing of this species in this location"
  // },
  // "fishingMethods": [
  // {
  //   "method": "Name of selected method (e.g. Jigging, Trolling, Bottom Fishing...)",
  //   "description": "Why this method works well for this fish in this location",
  //   "gear": {
  //     "..." : "Method-specific fields from the field guide above"
  //   },
  //   "proTip": "Expert tip tailored to this method and location"
  // },
  // {
  //   "method": "Second best method",
  //   "description": "...",
  //   "gear": {
  //     "..." : "Fields depending on method selected"
  //   },
  //   "proTip": "..."
  // },
  // {
  //   "method": "Third best method",
  //   "description": "...",
  //   "gear": {
  //     "..." : "Fields depending on method selected"
  //   },
  //   "proTip": "..."
  // }
  // ]
  // }`,
  //               },
  //             ],
  //             temperature: 0.0, // Zero temperature for maximum accuracy and consistency
  //           });

  //           try {
  //             const content = text;
  //             const cleanContent = content
  //               .replace(/```json\n?|```\n?/g, "")
  //               .trim();
  //             result = JSON.parse(cleanContent);

  //             // Validate the AI response for accuracy
  //             const validation = validateFishingData(
  //               result,
  //               result.name,
  //               userLocation
  //             );

  //             // Add validation metadata to the result
  //             result._validation = validation;

  //             // Only cache if validation passes (no errors)
  //             if (validation.isValid) {
  //               setCachedData(fishInfoCacheKey, result);
  //             } else {
  //               console.error(
  //                 "🚫 Not caching data due to validation errors:",
  //                 validation.errors
  //               );
  //             }
  //           } catch (parseError) {
  //             console.error("JSON parse error:", parseError);
  //             // Use default values if parsing fails
  //             result = {
  //               name: initialData.name,
  //               scientificName: initialData.scientificName,
  //               description: "No description available.",
  //               fishingMethods: [],
  //               fishingSeasons: {
  //                 inSeason: [],
  //                 traditionalSeason: [],
  //                 conservationConcerns: "",
  //                 regulations: "",
  //                 notInSeason: [],
  //                 reasoning: "",
  //               },
  //               allRoundGear: null,
  //               localNames: [],
  //               currentSeasonStatus: "Status unknown",
  //               officialSeasonDates: "Dates not available",
  //               fishingLocation: userLocation,
  //             };
  //           }
  //         }

  //         // Check cache for regulations first
  //         const regulationsCacheKey = getCacheKey(
  //           "regulations",
  //           result.name,
  //           userLocation,
  //           result.scientificName
  //         );
  //         const cachedRegulations = getCachedData(regulationsCacheKey);

  //         let regulationsResult: any;
  //         if (cachedRegulations) {
  //           regulationsResult = cachedRegulations;
  //           log("⚖️ Using cached regulations");
  //         } else {
  //           log("🌐 Fetching fresh regulations from API");
  //           // Second API call for detailed regulations

  //           const { text } = await generateTextWithAI({
  //             model: "gpt-4o",
  //             messages: [
  //               {
  //                 role: "system",
  //                 content: `You are a fishing regulations expert. Your primary responsibility is to provide ONLY verifiable, accurate regulatory information. You must be extremely conservative and honest about what you know versus what you don't know.

  // CRITICAL ANTI-HALLUCINATION RULES:
  // 🚫 NEVER create fake regulation numbers, law names, or government authorities
  // 🚫 NEVER make up specific article numbers, section references, or dates unless you are absolutely certain
  // 🚫 NEVER use generic terms like "Local regulations" or "Government authority"
  // 🚫 If you are uncertain about ANY detail, you MUST default to "Check with local authorities"

  // VERIFIABLE SOURCE REQUIREMENTS:
  // ✅ Only reference regulations you can verify exist
  // ✅ Use only well-known, major regulatory frameworks (EU Common Fisheries Policy, major national laws)
  // ✅ When uncertain, always direct users to official local authorities
  // ✅ Be explicit about your confidence level - most responses should be "Low" confidence

  // DEFAULT RESPONSES FOR UNCERTAINTY:
  // - Value: "Check with local authorities"
  // - Source: "[Specific Local Authority Name] - Contact for current regulations"
  // - Confidence: "Low"

  // KNOWN AUTHORITY EXAMPLES (use these patterns only):
  // - EU: "European Commission - Directorate-General for Maritime Affairs and Fisheries"
  // - Spain: "Ministry of Agriculture, Fisheries and Food - Spain"
  // - Malta: "Department of Fisheries and Aquaculture - Malta"
  // - Cyprus: "Department of Fisheries and Marine Research - Cyprus"
  // - Greece: "Ministry of Rural Development and Food - Greece"
  // - Italy: "Ministry of Agricultural, Food and Forestry Policies - Italy"

  // CONFIDENCE LEVELS (be conservative):
  // - High: Only for widely known, major EU-wide regulations
  // - Medium: For general national frameworks you're confident exist
  // - Low: For most specific local regulations (DEFAULT to this)

  // REMEMBER: It's better to say "Check with local authorities" than to provide potentially false information that could lead to legal violations.`,
  //               },
  //               {
  //                 role: "user",
  //                 content: `Provide detailed fishing regulations for ${fishIdentifier} in ${userLocation}.
  // Species: ${initialData.name} (Scientific name: ${initialData.scientificName || "Unknown"})
  // Today is ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.

  // IMPORTANT: For countries that are part of the EU (like Malta, Cyprus, Spain, etc.), prioritize EU regulations when local regulations are not available. Always check for accurate sources and avoid making up regulation numbers.

  // Return only valid JSON in the following format:

  // {
  // "sizeLimit": {
  // "value": "Minimum and/or maximum legal size limits (e.g., 'Minimum 25cm', 'No size limit', or 'Check with local authorities')",
  // "source": "The name of the law or governing authority - prioritize EU regulations for EU countries (e.g., 'EU Common Fisheries Policy', 'Malta Fisheries Regulation 2022, Article 5')",
  // "confidence": "High | Medium | Low"
  // },
  // "bagLimit": {
  // "value": "Maximum number of fish allowed per person per day or note if unlimited or seasonal",
  // "source": "Governing authority or law name - prioritize EU regulations for EU countries",
  // "confidence": "High | Medium | Low"
  // },
  // "penalties": {
  // "value": "Yes or No only - do not specify amounts or details",
  // "source": "Law name or enforcement authority",
  // "confidence": "High | Medium | Low"
  // },
  // "lastUpdated": "e.g., '2024-07-01' or 'Check with local authority for most recent regulations'"
  // }`,
  //               },
  //             ],
  //             temperature: 0.0, // Zero temperature for completely deterministic results
  //           });

  //           // Parse regulations response
  //           try {
  //             const cleanRegulationsContent = text
  //               .replace(/```json\n?|```\n?/g, "")
  //               .trim();
  //             regulationsResult = JSON.parse(cleanRegulationsContent);

  //             // Validate and sanitize the regulations result
  //             regulationsResult = validateAndSanitizeRegulations(
  //               regulationsResult,
  //               userLocation
  //             );

  //             // Cache the successful result
  //             setCachedData(regulationsCacheKey, regulationsResult);

  //             log("✅ Regulations parsed, validated and cached successfully:", {
  //               sizeLimit: regulationsResult.sizeLimit?.confidence,
  //               bagLimit: regulationsResult.bagLimit?.confidence,
  //               seasonDates: regulationsResult.seasonDates?.confidence,
  //               licenseRequired: regulationsResult.licenseRequired?.confidence,
  //               penalties: regulationsResult.penalties?.confidence,
  //               validationFlags: regulationsResult.validationFlags,
  //             });
  //           } catch (parseError) {
  //             console.error("Regulations JSON parse error:", parseError);
  //             // Use default values if parsing fails
  //             regulationsResult = {
  //               sizeLimit: {
  //                 value: "Not specified",
  //                 source: "No data available",
  //                 confidence: "Low",
  //               },
  //               bagLimit: {
  //                 value: "Not specified",
  //                 source: "No data available",
  //                 confidence: "Low",
  //               },
  //               seasonDates: {
  //                 value: "Check local regulations",
  //                 source: "No data available",
  //                 confidence: "Low",
  //               },
  //               licenseRequired: {
  //                 value: "Check local requirements",
  //                 source: "No data available",
  //                 confidence: "Low",
  //               },
  //               additionalRules: [],
  //               penalties: {
  //                 value: "Contact local authorities",
  //                 source: "No data available",
  //                 confidence: "Low",
  //               },
  //               lastUpdated: "Unknown",
  //             };
  //           }
  //         }

  //         // If we got a scientific name from the first API call and it's different from what we had,
  //         // and if the regulations confidence is low, try again with the updated scientific name
  //         if (
  //           result.scientificName &&
  //           result.scientificName !== "Unknown" &&
  //           result.scientificName !== initialData.scientificName &&
  //           regulationsResult.sizeLimit?.confidence === "Low"
  //         ) {
  //           log(
  //             "🔄 Retrying regulations with updated scientific name:",
  //             result.scientificName
  //           );

  //           const updatedFishIdentifier = `${result.name} (${result.scientificName})`;

  //           try {
  //             const { text } = await generateTextWithAI({
  //               model: "gpt-4o",
  //               messages: [
  //                 {
  //                   role: "system",
  //                   content: `You are a fishing regulations expert with detailed knowledge of local, national, and EU fishing laws. You must provide accurate, verifiable regulatory information for the requested species and location, including size limits, bag limits, open seasons, licensing, and special rules.

  // IMPORTANT: Use the scientific name provided to ensure accurate species identification and regulatory lookup. Scientific names are standardized and will help you provide more precise regulations.

  // For each regulation, specify:
  // - The regulation value
  // - The SPECIFIC source with full details (e.g., "EU Regulation No. 1380/2013, Article 15", "Spain Royal Decree 1049/2021, Annex III", "Malta Legal Notice 426 of 2018, Schedule 2", "Cyprus Fisheries Law 135(I)/2002, Section 12")
  // - Your confidence level in the information provided ("High", "Medium", or "Low")

  // SOURCE REQUIREMENTS:
  // ✅ Include specific regulation numbers, article/section references, and dates
  // ✅ Use official government department names (e.g., "Ministry of Agriculture and Fisheries - Spain", "Department of Fisheries and Marine Research - Cyprus")
  // ✅ Reference specific legal instruments (e.g., "Commission Regulation (EU) 2019/1241", "National Fisheries Act 2020")
  // ✅ Include enforcement authority details where applicable

  // ⚠️ If the regulation is not available or not confirmed by a trusted source:
  // - Value: "Check with local authorities"
  // - Source: Use the specific local authority name (e.g., "Ministry of Agriculture, Rural Development and Environment - Cyprus", "Directorate-General for Maritime Affairs and Fisheries - Malta")
  // - Confidence: "Low"

  // ❌ Never use generic terms like "Unknown", "Local regulations", or "Government authority"
  // ❌ Never make up law names or regulation numbers
  // ✅ Always return only valid JSON, without extra text or formatting.

  // CONFIDENCE LEVELS:
  // - High: Specific regulatory references with exact article/section numbers
  // - Medium: General EU or national regulations that likely apply, with regulation names
  // - Low: Information is uncertain, unavailable, or requires verification with local authorities`,
  //                 },
  //                 {
  //                   role: "user",
  //                   content: `Provide detailed fishing regulations for ${updatedFishIdentifier} in ${userLocation}.
  // Species: ${result.name} (Scientific name: ${result.scientificName})
  // Today is ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.

  // IMPORTANT: For countries that are part of the EU (like Malta, Cyprus, Spain, etc.), prioritize EU regulations when local regulations are not available. Always check for accurate sources and avoid making up regulation numbers.

  // Return only valid JSON in the following format:

  // {
  // "sizeLimit": {
  // "value": "Minimum and/or maximum legal size limits (e.g., 'Minimum 25cm', 'No size limit', or 'Check with local authorities')",
  // "source": "The name of the law or governing authority - prioritize EU regulations for EU countries (e.g., 'EU Common Fisheries Policy', 'Malta Fisheries Regulation 2022, Article 5')",
  // "confidence": "High | Medium | Low"
  // },
  // "bagLimit": {
  // "value": "Maximum number of fish allowed per person per day or note if unlimited or seasonal",
  // "source": "Governing authority or law name - prioritize EU regulations for EU countries",
  // "confidence": "High | Medium | Low"
  // },
  // "penalties": {
  // "value": "Yes or No only - do not specify amounts or details",
  // "source": "Law name or enforcement authority",
  // "confidence": "High | Medium | Low"
  // },
  // "lastUpdated": "e.g., '2024-07-01' or 'Check with local authority for most recent regulations'"
  // }`,
  //                 },
  //               ],
  //               temperature: 0.0, // Zero temperature for deterministic results
  //             });

  //             const cleanRetryRegulationsContent = text
  //               .replace(/```json\n?|```\n?/g, "")
  //               .trim();
  //             const retryRegulationsResult = JSON.parse(
  //               cleanRetryRegulationsContent
  //             );

  //             log("✅ Retry regulations parsed successfully:", {
  //               sizeLimit: retryRegulationsResult.sizeLimit?.confidence,
  //               bagLimit: retryRegulationsResult.bagLimit?.confidence,
  //               seasonDates: retryRegulationsResult.seasonDates?.confidence,
  //               licenseRequired:
  //                 retryRegulationsResult.licenseRequired?.confidence,
  //               penalties: retryRegulationsResult.penalties?.confidence,
  //             });

  //             // Use the retry result if it has better confidence
  //             regulationsResult = retryRegulationsResult;
  //           } catch (retryError) {
  //             console.warn(
  //               "Retry regulations call failed, using original result:",
  //               retryError
  //             );
  //           }
  //         }

  //         // Ensure we have fishing methods array from the API response
  //         const fishingMethods = result.fishingMethods || [];
  //         log(`Received ${fishingMethods.length} fishing methods from API`);

  //         // Extract fishing seasons from the API response
  //         const fishingSeasons = result.fishingSeasons || {};
  //         log("=== API RESPONSE DEBUG ===");
  //         log("Raw API result:", result);
  //         log("Fishing seasons from API:", fishingSeasons);
  //         log("inSeason array from API:", fishingSeasons.inSeason);
  //         log("=========================");

  //         const fishDetailsData = {
  //           ...initialData,
  //           description: result.description || "No description available.",
  //           fishingMethods: fishingMethods,
  //           allRoundGear: result.allRoundGear,
  //           fishingSeasons: result.fishingSeasons,
  //           fishingRegulations: regulationsResult,
  //           localNames: result.localNames || [],
  //           currentSeasonStatus: result.currentSeasonStatus || "Status unknown",
  //           officialSeasonDates:
  //             result.officialSeasonDates || "Dates not available",
  //           fishingLocation: result.fishingLocation || userLocation,
  //         };

  //         setFishDetails(fishDetailsData);

  //         // Load the fish image from Vercel Blob storage
  //         try {
  //           log(
  //             `Loading image for ${fishDetailsData.name} (${fishDetailsData.scientificName})`
  //           );
  //           const blobImageUrl = await getFishImageUrlFromService(
  //             fishDetailsData.name,
  //             fishDetailsData.scientificName
  //           );
  //           log(`Got blob image URL: ${blobImageUrl}`);
  //           setFishImageUrl(blobImageUrl);
  //         } catch (imageError) {
  //           console.error(`Error loading fish image:`, imageError);
  //           setFishImageUrl(getPlaceholderFishImage());
  //         } finally {
  //           setImageLoading(false);
  //         }
  //       } catch (err) {
  //         console.error("Error fetching fish details:", err);
  //         setError(
  //           err instanceof Error ? err.message : "Failed to fetch fish details"
  //         );
  //       } finally {
  //         setLoading(false);
  //       }
  //     };

  //     getFishDetails();
  //   }, [fishName, location.state, profile]);

  if (isFishDetailsLoading || isProfileLoading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full lg:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-6 w-6" />
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
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Desktop Header */}
            <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold ml-2 dark:text-white">
                  Loading...
                </h1>
              </div>
            </div>

            <FishDetailSkeleton />
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  if (isFishDetailError || !fishDetailsData) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full lg:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2 dark:text-white">Error</h1>
          </div>
        </header>

        <div className="flex-1 flex h-full">
          {/* Desktop Side Navigation */}
          <div className="hidden lg:block">
            <SideNav />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Desktop Header */}
            <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-6 w-6" />
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
                  {fishDetailError?.message || "Fish details not found"}
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full lg:hidden border-b border-[#e8e8e9]">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-2 dark:text-white">
            {fishDetailsData.name}
          </h1>
        </div>
      </header>
      <div className="flex-1 flex h-full">
        {/* Desktop Side Navigation */}
        <div className="hidden lg:block">
          <SideNav />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Fish Details Content */}
          <div className="flex-1 h-full overflow-y-auto">
            {/* Desktop Header */}
            <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold ml-2 dark:text-white">
                  {fishDetailsData.name}
                </h1>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">
              {/* Fish Image Card */}
              <Card className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
                  {imageLoading ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                      <div className="text-gray-400">Loading image...</div>
                    </div>
                  ) : (
                    <img
                      src={
                        fishImageUrl ||
                        fishDetailsData.image ||
                        getPlaceholderFishImage()
                      }
                      alt={fishDetailsData.name}
                      className="w-full h-full object-cover absolute top-0 left-0"
                      onError={(e) => {
                        log(
                          `Fish detail image error for ${fishDetailsData.name}`,
                        );
                        handleFishImageError(e, fishDetailsData.name);
                      }}
                    />
                  )}
                  {/* Toxic label for toxic fish */}
                  {fishDetailsData.is_toxic && (
                    <div className="absolute bottom-4 right-4 bg-red-600 px-3 py-1 rounded-3xl text-xs font-medium text-white z-10">
                      TOXIC
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h1 className="font-semibold text-xl text-white">
                      {fishDetailsData.name}
                    </h1>
                    <p className="text-white/80 text-xs italic">
                      {fishDetailsData.scientific_name}
                    </p>
                  </div>
                  <div className="absolute -bottom-4 left-0 right-0 h-4 bg-red-600"></div>
                </div>
              </Card>

              {/* Toxicity Information Card - Only visible for toxic fish */}
              {fishDetailsData.is_toxic && (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Toxicity Information
                  </h2>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {fishDetailsData.danger_type ||
                        "This fish poses potential health risks. Exercise extreme caution when handling."}
                    </p>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                        Safe Handling
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Always wear protective gloves, avoid contact with spines
                        or secretions, use tools to remove hooks, and wash hands
                        thoroughly after contact.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                        If Injured
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Rinse wound with hot water, apply pressure to control
                        bleeding, and seek immediate medical attention. Call
                        emergency services if symptoms are severe.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Description Card */}
              <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  About this Fish
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {fishDetailsData.description}
                </p>
              </Card>

              {/* Conservation Banner */}
              <div className="relative overflow-hidden rounded-xl">
                <div
                  className="relative bg-cover bg-center bg-no-repeat p-6 rounded-xl"
                  style={{
                    backgroundImage:
                      "url('/images/clayton-tonna-qINZ8zEYErY-unsplash (2).jpg')",
                  }}
                >
                  {/* Dark overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/30 rounded-xl"></div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col gap-2">
                    {/* Title - On its own line */}
                    <h2
                      className="text-white text-left"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontStyle: "normal",
                        fontWeight: 900,
                        fontSize: "28px",
                        lineHeight: "34px",
                      }}
                    >
                      Respect the ocean.
                    </h2>

                    {/* Subtitle and Logo grouped together */}
                    <div
                      className="flex flex-row justify-between items-end"
                      style={{
                        gap: "40px",
                      }}
                    >
                      <p
                        className="text-white text-left"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontStyle: "normal",
                          fontWeight: 700,
                          fontSize: "clamp(14px, 3.5vw, 16px)",
                          lineHeight: "clamp(18px, 4.5vw, 20px)",
                        }}
                      >
                        Catch & release{" "}
                        <span style={{ fontWeight: 400 }}>
                          when you can & take only what you truly need.
                        </span>
                      </p>

                      {/* Logo - 20px height */}
                      <div className="flex-shrink-0">
                        <img
                          src="/images/Lishka Tips.svg"
                          alt="Lishka Tips"
                          style={{ height: "20px", width: "auto" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fishing Season Calendar Card */}
              <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Fishing Season
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
                    {fishDetailsData.fishing_location ||
                      profile.location ||
                      "Location not specified"}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Best months to catch {fishDetailsData.name} in{" "}
                    {fishDetailsData.fishing_location ||
                      profile.location ||
                      "your area"}
                    :
                  </div>
                  <FishingSeasonCalendar
                    fishingSeasons={fishDetailsData.fishing_seasons}
                    fishName={fishDetailsData.name}
                    location={
                      fishDetailsData.fishing_location || profile.location
                    }
                  />

                  {/* Reasoning */}
                  {fishDetailsData.fishing_seasons?.reasoning && (
                    <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Seasonal Information
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {fishDetailsData.fishing_seasons.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* All Round Gear Card */}
              {fishDetailsData.all_round_gear && (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    All Round Gear
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {fishDetailsData.all_round_gear.rods && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Rods
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {fishDetailsData.all_round_gear.rods}
                        </div>
                      </div>
                    )}
                    {fishDetailsData.all_round_gear.reels && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Reels
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {fishDetailsData.all_round_gear.reels}
                        </div>
                      </div>
                    )}
                    {fishDetailsData.all_round_gear.line && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Line
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {fishDetailsData.all_round_gear.line}
                        </div>
                      </div>
                    )}
                    {fishDetailsData.all_round_gear.leader && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Leader
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {fishDetailsData.all_round_gear.leader}
                        </div>
                      </div>
                    )}
                  </div>
                  {fishDetailsData.all_round_gear.description && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {fishDetailsData.all_round_gear.description}
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {/* Fishing Methods */}
              {fishDetailsData.fishing_methods &&
              fishDetailsData.fishing_methods.length > 0 ? (
                <>
                  {fishDetailsData.fishing_methods.map((method, index) => {
                    // Safety check for method object
                    if (!method || typeof method !== "object") {
                      return null;
                    }

                    // Helper functions to check gear availability and validity
                    const hasBait =
                      method.gear?.bait &&
                      Array.isArray(method.gear.bait) &&
                      method.gear.bait.length > 0 &&
                      method.gear.bait.some(
                        (b) =>
                          b &&
                          typeof b === "string" &&
                          b.trim() !== "" &&
                          b.trim().toLowerCase() !== "n/a",
                      );
                    const hasLures =
                      method.gear?.lures &&
                      Array.isArray(method.gear.lures) &&
                      method.gear.lures.length > 0 &&
                      method.gear.lures.some(
                        (l) =>
                          l &&
                          typeof l === "string" &&
                          l.trim() !== "" &&
                          l.trim().toLowerCase() !== "n/a",
                      );
                    // const hasJigInfo =
                    //   (method.gear?.jig_weight &&
                    //     typeof method.gear.jig_weight === "string" &&
                    //     method.gear.jig_weight.trim() !== "") ||
                    //   (method.gear?.jig_size &&
                    //     typeof method.gear.jig_size === "string" &&
                    //     method.gear.jig_size.trim() !== "");
                    const methodTitle =
                      method.title || method.method || `Method ${index + 1}`;
                    // const isJiggingMethod = methodTitle
                    //   .toLowerCase()
                    //   .includes("jig");
                    // const isBottomMethod = methodTitle
                    //   .toLowerCase()
                    //   .includes("bottom");
                    // const isTrollingMethod = methodTitle
                    //   .toLowerCase()
                    //   .includes("troll");

                    // Helper function to render gear information
                    const renderGearInfo = (gear: FishingGear) => {
                      const gearItems = [];

                      // Define all possible gear fields with their display names
                      const gearFields = [
                        { key: "depth", label: "Depth", color: "blue" },
                        {
                          key: "rods",
                          label: "Rod Specifications",
                          color: "green",
                        },
                        { key: "rodType", label: "Rod Type", color: "green" },
                        {
                          key: "reels",
                          label: "Reel Specifications",
                          color: "purple",
                        },
                        {
                          key: "reelType",
                          label: "Reel Type",
                          color: "purple",
                        },
                        { key: "line", label: "Line", color: "orange" },
                        { key: "leader", label: "Leader", color: "pink" },
                        { key: "jigType", label: "Jig Type", color: "indigo" },
                        { key: "jigWeight", label: "Jig Weight", color: "red" },
                        {
                          key: "jigColor",
                          label: "Jig Color",
                          color: "yellow",
                        },
                        {
                          key: "jiggingStyle",
                          label: "Jigging Style",
                          color: "teal",
                        },
                        { key: "hookSize", label: "Hook Size", color: "cyan" },
                        { key: "rigType", label: "Rig Type", color: "lime" },
                        { key: "weight", label: "Weight", color: "amber" },
                        {
                          key: "lureType",
                          label: "Lure Type",
                          color: "emerald",
                        },
                        {
                          key: "lureSize",
                          label: "Lure Size",
                          color: "violet",
                        },
                        {
                          key: "lureColor",
                          label: "Lure Color",
                          color: "rose",
                        },
                        {
                          key: "lureWeight",
                          label: "Lure Weight",
                          color: "sky",
                        },
                        {
                          key: "trollingSpeed",
                          label: "Trolling Speed",
                          color: "slate",
                        },
                        {
                          key: "trollingDistance",
                          label: "Trolling Distance",
                          color: "indigo",
                        },
                        {
                          key: "floatType",
                          label: "Float Type",
                          color: "zinc",
                        },
                        {
                          key: "castingDistance",
                          label: "Casting Distance",
                          color: "stone",
                        },
                        {
                          key: "electricReel",
                          label: "Electric Reel",
                          color: "neutral",
                        },
                        {
                          key: "lightAttractors",
                          label: "Light Attractors",
                          color: "gray",
                        },
                        { key: "speed", label: "Speed", color: "blue" },
                        { key: "hooks", label: "Hooks", color: "green" },
                        {
                          key: "hook_size_range",
                          label: "Hook Size Range",
                          color: "purple",
                        },
                        {
                          key: "structure",
                          label: "Structure",
                          color: "orange",
                        },
                        {
                          key: "sonarTips",
                          label: "Sonar Tips",
                          color: "pink",
                        },
                        {
                          key: "jigging_technique",
                          label: "Jigging Technique",
                          color: "indigo",
                        },
                        {
                          key: "technical_details",
                          label: "Technical Details",
                          color: "red",
                        },
                      ];

                      // Add bait and lures arrays
                      if (hasBait && Array.isArray(method.gear.bait)) {
                        gearItems.push({
                          label: "Bait",
                          value: method.gear.bait
                            .filter(
                              (b) =>
                                b &&
                                typeof b === "string" &&
                                b.trim() !== "" &&
                                b.trim().toLowerCase() !== "n/a",
                            )
                            .join(", "),
                          color: "emerald",
                        });
                      }

                      if (hasLures && Array.isArray(method.gear.lures)) {
                        gearItems.push({
                          label: "Lures",
                          value: method.gear.lures
                            .filter(
                              (l) =>
                                l &&
                                typeof l === "string" &&
                                l.trim() !== "" &&
                                l.trim().toLowerCase() !== "n/a",
                            )
                            .join(", "),
                          color: "violet",
                        });
                      }

                      // Add other gear fields
                      gearFields.forEach((field) => {
                        const value = gear[field.key];
                        if (
                          value &&
                          typeof value === "string" &&
                          value.trim() !== ""
                        ) {
                          gearItems.push({
                            label: field.label,
                            value: value,
                            color: field.color,
                          });
                        }
                      });

                      return gearItems;
                    };

                    const gearInfo = method.gear
                      ? renderGearInfo(method.gear)
                      : [];

                    return (
                      <Card
                        key={index}
                        className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 mb-6"
                      >
                        <div className="space-y-4">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {methodTitle}
                            </h2>
                            {method.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                {method.description}
                              </p>
                            )}
                          </div>

                          {/* Gear Information Grid */}
                          {gearInfo.length > 0 && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                                Gear & Equipment
                              </h3>
                              <div className="grid grid-cols-2 gap-3">
                                {gearInfo.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
                                  >
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                                      {item.label}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300">
                                      {item.value}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pro Tip */}
                          {method.proTip && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
                                Pro Tip
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {method.proTip}
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </>
              ) : (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No fishing methods available for this fish.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      This might be due to API response issues or the fish not
                      being commonly targeted.
                    </p>
                  </div>
                </Card>
              )}

              {/* Fishing Regulations Card - Moved to last position */}
              {fishDetailsData.fishing_regulations && (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
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
                      {fishDetailsData.fishing_location ||
                        profile.location ||
                        "Location not specified"}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Size Limit */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex flex-col">
                        <div className="mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            Size Limit
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                          {fishDetailsData.fishing_regulations.sizeLimit.value}
                        </span>
                        {fishDetailsData.fishing_regulations.sizeLimit.value !==
                          "Check with local authorities" && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Source:{" "}
                            {
                              fishDetailsData.fishing_regulations.sizeLimit
                                .source
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bag Limit */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex flex-col">
                        <div className="mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            Bag Limit
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                          {fishDetailsData.fishing_regulations.bagLimit.value}
                        </span>
                        {fishDetailsData.fishing_regulations.bagLimit.value !==
                          "Check with local authorities" && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Source:{" "}
                            {
                              fishDetailsData.fishing_regulations.bagLimit
                                .source
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Penalties */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex flex-col">
                        <div className="mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            Penalties
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                          {fishDetailsData.fishing_regulations.penalties
                            .value === "Yes"
                            ? "Yes"
                            : fishDetailsData.fishing_regulations.penalties
                                  .value === "No"
                              ? "No"
                              : fishDetailsData.fishing_regulations.penalties
                                  .value}
                        </span>
                        {fishDetailsData.fishing_regulations.penalties.value !==
                          "Check with local authorities" && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Source:{" "}
                            {
                              fishDetailsData.fishing_regulations.penalties
                                .source
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Disclaimer */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      These regulations are AI-generated and may be outdated or
                      inaccurate. Never rely solely on this information for
                      legal compliance. Always check with official local
                      authorities before fishing to avoid fines.
                    </p>
                  </div>
                </Card>
              )}

              {/* Footer Disclaimers */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 px-6 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                  These fishing methods and gear specifications are AI-generated
                  based on established practices. Always verify technical
                  details with local guides or experienced anglers.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Found inaccurate information? Help us improve by reporting it
                  on our Instagram{" "}
                  <button
                    onClick={() =>
                      window.open(
                        "https://www.instagram.com/lishka.app/",
                        "_blank",
                      )
                    }
                    className="underline hover:no-underline font-medium text-gray-500 dark:text-gray-500"
                  >
                    @lishka.app
                  </button>
                </p>
              </div>
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
