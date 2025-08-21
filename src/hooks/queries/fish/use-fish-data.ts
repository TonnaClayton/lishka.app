import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { generateTextWithAI } from "@/lib/ai";
import { cacheApiResponse, getCachedApiResponse } from "@/lib/api-helpers";
import { getLocalFishName } from "@/lib/fishbase-api";
import { getFishImageUrl } from "@/lib/fish-image-service";
import { OPENAI_DISABLED_MESSAGE, OPENAI_ENABLED } from "@/lib/openai-toggle";
import { config } from "@/lib/config";
import { log } from "@/lib/logging";
import { api } from "../api";
import { fishSchema } from "./type";
import z from "zod";

export interface FishData {
  name: string;
  scientificName: string;
  localName?: string;
  habitat: string;
  difficulty: "Easy" | "Intermediate" | "Hard" | "Advanced" | "Expert";
  season: string;
  isToxic: boolean;
  dangerType?: string;
  image?: string;
  probabilityScore?: number;
}

// Helper functions moved from home page
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Fish data fetching function
const fetchFishData = async (location: string, page: number = 1) => {
  if (!OPENAI_ENABLED) {
    throw new Error(OPENAI_DISABLED_MESSAGE);
  }

  const apiKey = config.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is missing");
  }

  const validatedLocation = validateLocation(location);
  if (!validatedLocation) {
    throw new Error("Invalid location data");
  }

  const currentMonth = getCurrentMonth();
  const currentMonthYear = getCurrentMonthYear();
  const pageSize = 50;
  const cleanLocation = getCleanLocationName(location);

  // Create cache key
  const cacheKey = `fish_data_v3_${cleanLocation}_${currentMonthYear}_page_${page}`;

  // Check cache first
  const cachedData = getCachedApiResponse(cacheKey);
  if (cachedData) {
    log("Using cached fish data for", location, currentMonth);
    return cachedData;
  }

  const { text } = await generateTextWithAI({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a marine biology expert. You must respond with ONLY a valid JSON array. Do not include any explanations, markdown formatting, code blocks, or additional text. Start your response with [ and end with ].",
      },
      {
        role: "user",
        content: `Generate a JSON array with exactly ${pageSize} fish species that are NATIVE and commonly found in the ${getLocationToSeaMapping(
          location,
        )} near ${cleanLocation} during ${currentMonth}. 

CRITICAL REQUIREMENTS:
1. SCIENTIFIC NAME FIRST: Every fish MUST have a valid, complete binomial scientific name (Genus species). NO exceptions.
2. NEVER return fish with "Unknown", "N/A", or missing scientific names.
3. scientificName must be complete binomial nomenclature - NEVER use spp., sp., cf., aff., or any abbreviations.
4. Examples: "Thunnus thynnus" NOT "Thunnus spp." or "Thunnus sp." or "Unknown".
5. If you cannot provide a valid scientific name for a fish, DO NOT include it in the response.

GEOGRAPHIC REQUIREMENT: Only include fish species that are naturally occurring and indigenous to the ${getLocationToSeaMapping(
          location,
        )} region. DO NOT include tropical, exotic, or non-native species that would not naturally be found in these waters. For example, if the location is Malta (Mediterranean Sea), do NOT include clownfish, angelfish, or other tropical species. Focus on temperate and regional species appropriate for the specific sea/ocean.

Format: [{\"name\":\"Fish Name\",\"scientificName\":\"Genus species\",\"habitat\":\"Habitat Description\",\"difficulty\":\"Easy\",\"season\":\"Season Info\",\"isToxic\":false}]. Mix of difficulty levels (Easy/Intermediate/Hard/Advanced/Expert). 

IMPORTANT: Each scientific name must be a specific, real species with both genus and species names. Verify the scientific name exists before including the fish. Return only the JSON array.`,
      },
    ],
    temperature: 0.1,
    maxTokens: 2000,
  });

  // Parse the JSON response
  let jsonStr = text.trim();
  jsonStr = jsonStr.replace(/```json\s*|```\s*|```/g, "");
  jsonStr = jsonStr.replace(/^[^\[\{]*/, "");
  jsonStr = jsonStr.replace(/[^\]\}]*$/, "");

  const arrayStart = jsonStr.indexOf("[");
  const arrayEnd = jsonStr.lastIndexOf("]");

  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    jsonStr = jsonStr.substring(arrayStart, arrayEnd + 1);
  }

  log("Cleaned JSON string:", jsonStr);
  let fishData: FishData[] = JSON.parse(jsonStr);

  if (!Array.isArray(fishData)) {
    throw new Error("Response is not an array");
  }

  // Filter and clean fish data
  fishData = fishData
    .map((fish) => {
      let cleanScientificName = fish.scientificName || "";

      if (cleanScientificName) {
        cleanScientificName = cleanScientificName
          .replace(/\s+(spp?\.?|cf\.?|aff\.?)\s*$/i, "")
          .replace(/\s+(spp?\.?|cf\.?|aff\.?)\s+/gi, " ")
          .trim();

        const parts = cleanScientificName.split(/\s+/);
        if (parts.length < 2) {
          cleanScientificName = "";
        } else if (parts.length > 2) {
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
    })
    .filter((fish) => {
      return (
        fish.scientificName &&
        fish.scientificName !== "Unknown" &&
        fish.scientificName !== "" &&
        fish.scientificName.includes(" ") &&
        fish.scientificName.split(" ").length >= 2
      );
    });

  // Cache the data
  cacheApiResponse(cacheKey, fishData, 12 * 60 * 60 * 1000);

  // Load images and local names in background
  Promise.allSettled(
    fishData.map(async (fish, index) => {
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

      if (imageUrl || localName) {
        fishData[index] = {
          ...fishData[index],
          image: imageUrl || fishData[index].image,
          localName: localName || fishData[index].localName,
        };
      }
    }),
  );

  return fishData;
};

export const fishQueryKeys = {
  fishData: (
    location: string,
    page: number,
    userLatitude?: number,
    userLongitude?: number,
  ) => ["fishData", location, page, userLatitude, userLongitude] as const,
  fishDataInfinite: (location: string) =>
    ["fishDataInfinite", location] as const,
  toxicFishData: (
    location: string,
    userLatitude?: number,
    userLongitude?: number,
  ) => ["toxicFishData", location, userLatitude, userLongitude] as const,
  fishingTips: (query: {
    temperature?: number;
    windSpeed?: number;
    waveHeight?: number;
    weatherCondition?: string;
  }) => ["fishingTips", query] as const,
};

export const useFishData = (location: string, page: number = 1) => {
  return useQuery({
    queryKey: fishQueryKeys.fishData(location, page),
    queryFn: () => fetchFishData(location, page),
    enabled: !!location,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useFishDataInfinite = (location: string) => {
  return useInfiniteQuery({
    queryKey: fishQueryKeys.fishDataInfinite(location),
    queryFn: async ({ pageParam = 1 }) => {
      // return fetchFishData(location, pageParam);

      const data = await api<{
        data: z.infer<typeof fishSchema>[];
      }>(`fish?page=${pageParam}&pageSize=20`, {
        method: "GET",
      });

      return data.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // Return next page number if we have data
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!location,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useFishingTips = (query: {
  temperature?: number;
  windSpeed?: number;
  waveHeight?: number;
  weatherCondition?: string;
}) => {
  return useQuery({
    queryKey: fishQueryKeys.fishingTips(query),
    queryFn: async () => {
      const data = await api<{
        data: {
          title: string;
          content: string;
          category: string;
        }[];
      }>("fish/tips", {
        method: "GET",
      });

      console.log("[FISHING TIPS]", data);

      return data.data;
      //return fetchToxicFishData(location, userLatitude, userLongitude);
    },
    // enabled: !!query.temperature && !!query.windSpeed && !!query.waveHeight &&
    //   !!query.weatherCondition,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
  });
};
