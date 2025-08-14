import { useQuery } from "@tanstack/react-query";
import { generateTextWithAI } from "@/lib/ai";
import { cacheApiResponse, getCachedApiResponse } from "@/lib/api-helpers";
import { getLocalFishName } from "@/lib/fishbase-api";
import { getFishImageUrl } from "@/lib/fish-image-service";
import { OPENAI_DISABLED_MESSAGE, OPENAI_ENABLED } from "@/lib/openai-toggle";
import { config } from "@/lib/config";
import { log } from "@/lib/logging";
import { FishData, fishQueryKeys } from "./use-fish-data";

// Helper functions
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

const getCurrentMonthYear = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getLocationToSeaMapping = (location: string) => {
  const locationToSeaMap: { [key: string]: string } = {
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
    india: "Indian Ocean",
    "sri lanka": "Indian Ocean",
    maldives: "Indian Ocean",
    seychelles: "Indian Ocean",
    mauritius: "Indian Ocean",
    madagascar: "Indian Ocean",
    tanzania: "Indian Ocean",
    kenya: "Indian Ocean",
    somalia: "Indian Ocean",
    "saudi arabia": "Red Sea",
    jordan: "Red Sea",
    sudan: "Red Sea",
    eritrea: "Red Sea",
    djibouti: "Red Sea",
    yemen: "Red Sea",
    uae: "Persian Gulf",
    qatar: "Persian Gulf",
    kuwait: "Persian Gulf",
    bahrain: "Persian Gulf",
    oman: "Persian Gulf",
    iran: "Persian Gulf",
    iraq: "Persian Gulf",
    ukraine: "Black Sea",
    russia: "Black Sea",
    georgia: "Black Sea",
    armenia: "Black Sea",
    azerbaijan: "Black Sea",
  };

  let normalizedLocation = location.toLowerCase().trim();

  try {
    const parsed = JSON.parse(location);
    if (parsed.name) {
      const parts = parsed.name.split(/[,\s]+/);
      normalizedLocation = parts[parts.length - 1].toLowerCase();
    }
  } catch {
    const parts = location.split(/[,\s]+/);
    normalizedLocation = parts[parts.length - 1].toLowerCase();
  }

  return locationToSeaMap[normalizedLocation] || "Regional Waters";
};

const getCleanLocationName = (location: string) => {
  try {
    const parsed = JSON.parse(location);
    if (parsed.name) {
      const parts = parsed.name.split(/[,\s]+/);
      return parts[parts.length - 1];
    }
    return parsed.name || location;
  } catch {
    const parts = location.split(/[,\s]+/);
    return parts[parts.length - 1];
  }
};

const cleanFishName = (fishName: string): string => {
  if (!fishName) return fishName;

  const cleanedName = fishName
    .replace(/^Mediterranean\s+/i, "")
    .replace(/^Mediterranean Sea\s+/i, "")
    .replace(/^Mediterranean-/i, "")
    .trim();

  return cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
};

const validateLocation = (location: string) => {
  if (!location) return "Unknown Location";
  try {
    const parsed = JSON.parse(location);
    return parsed.name || location;
  } catch {
    return location;
  }
};

export interface ToxicFishData extends FishData {
  dangerType: string;
  probabilityScore: number;
}

export interface ToxicFishResponse {
  toxicFishList: ToxicFishData[];
  debugInfo: {
    originalCount: number;
    filteredOut: { name: string; scientificName: string }[];
  };
}

// Toxic fish data fetching function
const fetchToxicFishData = async (
  location: string,
  userLatitude?: number,
  userLongitude?: number,
): Promise<ToxicFishResponse> => {
  log("Starting fetchToxicFishData");

  // Validate OpenAI configuration
  const apiKey = config.VITE_OPENAI_API_KEY;
  if (!apiKey || !OPENAI_ENABLED) {
    throw new Error(OPENAI_DISABLED_MESSAGE);
  }

  // Validate location
  const validatedLocation = validateLocation(location);
  if (!validatedLocation) {
    throw new Error("Invalid location data");
  }

  log("OpenAI API key validation passed");
  log(`Fetching toxic fish data for location: ${validatedLocation}`);

  const currentMonth = getCurrentMonth();
  const currentMonthYear = getCurrentMonthYear();
  const cleanLocation = getCleanLocationName(location);
  const seaOcean = getLocationToSeaMapping(location);

  // Get coordinates from localStorage
  const latitude = userLatitude || 35.8997; // Default Malta coordinates
  const longitude = userLongitude || 14.5146;

  // Use month-year instead of exact date for better cache persistence
  const cacheKey = `toxic_fish_data_v5_${cleanLocation}_${seaOcean}_${currentMonthYear}_${latitude.toFixed(
    3,
  )}_${longitude.toFixed(3)}`;

  // Check cache first
  const cachedData = getCachedApiResponse(cacheKey);
  if (cachedData) {
    log("Using cached toxic fish data for", location, seaOcean, currentMonth);

    // Handle both old cache format (just fish list) and new format (with debug info)
    if (cachedData.toxicFishList && cachedData.debugInfo) {
      // New cache format with debug info
      return {
        toxicFishList: cachedData.toxicFishList,
        debugInfo: cachedData.debugInfo,
      };
    } else if (Array.isArray(cachedData)) {
      // Old cache format (just fish list)
      return {
        toxicFishList: cachedData,
        debugInfo: {
          originalCount: cachedData.length,
          filteredOut: [],
        },
      };
    }
  }

  const { text } = await generateTextWithAI({
    model: "gpt-4",
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
    maxTokens: 4000,
  });

  const content = text;

  // Always log the raw API response for debugging
  log("=== RAW OPENAI API RESPONSE FOR TOXIC FISH ===");
  log("Model used:", "gpt-4o");
  log("Location:", location);
  log("Raw content:", content);
  log("Content length:", content.length);
  log("=============================================");

  let toxicFishData: ToxicFishData[];
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

    log("Cleaned toxic fish JSON string:", jsonStr);
    toxicFishData = JSON.parse(jsonStr);

    // Validate the parsed data
    if (!Array.isArray(toxicFishData)) {
      throw new Error("Response is not an array");
    }

    // Debug: Log the original count (no filtering)
    const originalCount = toxicFishData.length;
    const filteredOut: { name: string; scientificName: string }[] = [];

    log(`DEBUG: Original toxic fish count from OpenAI: ${originalCount}`);
    log(
      "DEBUG: Original toxic fish list:",
      toxicFishData.map((fish) => ({
        name: fish.name,
        scientificName: fish.scientificName,
      })),
    );

    // No filtering - keep all fish as returned by OpenAI

    // Store debug info for UI display
    const debugInfo = {
      originalCount,
      filteredOut,
    };

    log(
      `DEBUG: Final toxic fish count (no filtering): ${toxicFishData.length}`,
      debugInfo,
    );

    // Ensure each fish has required fields, clean scientific names, and is marked as toxic
    toxicFishData = toxicFishData
      .map((fish) => {
        let cleanScientificName = fish.scientificName || "";

        // Remove common abbreviations and ensure proper binomial nomenclature
        if (cleanScientificName) {
          cleanScientificName = cleanScientificName
            .replace(/\s+(spp?\.?|cf\.?|aff\.?)\s*$/i, "") // Remove spp., sp., cf., aff. at the end
            .replace(/\s+(spp?\.?|cf\.?|aff\.?)\s+/gi, " ") // Remove these abbreviations in the middle
            .trim();

          // Ensure we have at least genus and species (two words)
          const parts = cleanScientificName.split(/\s+/);
          if (parts.length < 2) {
            cleanScientificName = "";
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
      })
      .filter((fish) => {
        // Only keep fish with valid scientific names
        const hasValidScientificName =
          fish.scientificName &&
          fish.scientificName !== "Unknown" &&
          fish.scientificName !== "" &&
          fish.scientificName.includes(" ") && // Must have at least genus and species
          fish.scientificName.split(" ").length >= 2; // Must have at least 2 words

        // Exclude algae and plant species from the toxic fish list
        const isNotAlgae = !(
          fish.name.toLowerCase().includes("algae") ||
          fish.name.toLowerCase().includes("seaweed") ||
          fish.name.toLowerCase().includes("kelp") ||
          fish.name.toLowerCase().includes("phytoplankton") ||
          fish.name.toLowerCase().includes("diatom") ||
          fish.name.toLowerCase().includes("dinoflagellate") ||
          fish.scientificName.toLowerCase().includes("algae") ||
          fish.scientificName.toLowerCase().includes("phyto") ||
          fish.scientificName.toLowerCase().includes("chlorophyta") ||
          fish.scientificName.toLowerCase().includes("rhodophyta") ||
          fish.scientificName.toLowerCase().includes("phaeophyta") ||
          fish.scientificName.toLowerCase().includes("pyrrophyta") ||
          fish.scientificName.toLowerCase().includes("bacillariophyta")
        );

        return hasValidScientificName && isNotAlgae;
      });
  } catch (e) {
    console.error("Error parsing toxic fish data:", e);
    console.error("Raw toxic fish response:", content);

    // No fallback data - show error message instead
    toxicFishData = [];

    log("Using fallback toxic fish data due to parsing error");
  }

  // Set toxic fish data immediately for faster display (already ordered by probability from prompt)
  const toxicFishWithDefaults = toxicFishData.map((fish) => ({
    ...fish,
    name: cleanFishName(fish.name),
    isToxic: true,
  }));

  // Debug log
  log(
    `DEBUG: Received ${toxicFishWithDefaults.length} toxic fish from OpenAI API for ${cleanLocation} (${seaOcean}) at coordinates ${latitude}, ${longitude}`,
  );
  log(
    "DEBUG: Toxic fish data (ordered by probability):",
    toxicFishWithDefaults.map((fish) => ({
      name: fish.name,
      scientificName: fish.scientificName,
      probabilityScore: fish.probabilityScore,
    })),
  );

  const result = {
    toxicFishList: toxicFishWithDefaults,
    debugInfo: {
      originalCount: toxicFishWithDefaults.length,
      filteredOut: [],
    },
  };

  // Cache both fish data and debug info for 24 hours (longer cache duration)
  cacheApiResponse(cacheKey, result, 24 * 60 * 60 * 1000);

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
        localName = await getLocalFishName(fish.scientificName, browserLang);
      } catch (e) {
        console.error(`Error fetching local name for ${fish.name}:`, e);
      }

      // Update individual toxic fish with image and local name
      if (imageUrl || localName) {
        result.toxicFishList[index] = {
          ...result.toxicFishList[index],
          image: imageUrl || result.toxicFishList[index].image,
          localName: localName || result.toxicFishList[index].localName,
        };
      }
    }),
  );

  log("Finished fetchToxicFishData");
  return result;
};

export const useToxicFishData = (
  location: string,
  userLatitude?: number,
  userLongitude?: number,
) => {
  return useQuery({
    queryKey: fishQueryKeys.toxicFishData(
      location,
      userLatitude,
      userLongitude,
    ),
    queryFn: () => fetchToxicFishData(location, userLatitude, userLongitude),
    enabled: !!location,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
  });
};
