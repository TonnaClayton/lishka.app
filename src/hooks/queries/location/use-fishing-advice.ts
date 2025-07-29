import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateTextWithAI } from "@/lib/ai";
import { log } from "@/lib/logging";
import { LocationData } from "./use-location-storage";

export interface FishingAdvice {
  inshore: string;
  offshore: string;
}

export interface CurrentConditions {
  temperature: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  waveHeight: number | null;
  swellWaveHeight: number | null;
  swellWavePeriod: number | null;
  weatherCondition: string;
}

export const fishingAdviceQueryKeys = {
  fishingAdvice: (
    location: LocationData | null,
    conditions: CurrentConditions | null
  ) =>
    [
      "fishing",
      "advice",
      location?.latitude || "null",
      location?.longitude || "null",
      location?.name || "null",
      conditions?.temperature || "null",
      conditions?.windSpeed || "null",
      conditions?.waveHeight || "null",
      conditions?.weatherCondition || "null",
    ] as const,
};

// Helper function to get wind direction as compass direction
const getWindDirection = (degrees: number) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

// Helper function to determine season based on hemisphere and month
const getSeason = (latitude: number, month: number) => {
  const isNorthernHemisphere = latitude >= 0;

  if (isNorthernHemisphere) {
    // Northern hemisphere seasons
    if (month >= 3 && month <= 5) return "spring";
    else if (month >= 6 && month <= 8) return "summer";
    else if (month >= 9 && month <= 11) return "autumn";
    else return "winter";
  } else {
    // Southern hemisphere seasons
    if (month >= 3 && month <= 5) return "autumn";
    else if (month >= 6 && month <= 8) return "winter";
    else if (month >= 9 && month <= 11) return "spring";
    else return "summer";
  }
};

// Function to fetch fishing advice from AI
const fetchFishingAdvice = async (
  location: LocationData,
  conditions: CurrentConditions
): Promise<FishingAdvice> => {
  if (!location || !conditions) {
    throw new Error("Location and conditions are required for fishing advice");
  }

  log("Fetching fishing advice for:", { location: location.name, conditions });

  // Get current season based on hemisphere
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const season = getSeason(location.latitude, month);

  // Create prompts for inshore and offshore fishing
  const inshorePrompt = `You are an expert fishing guide. Based on these weather conditions at ${location.name}, provide brief, practical inshore fishing advice (max 3 sentences):
  - Temperature: ${conditions.temperature !== null ? `${Math.round(conditions.temperature)}°C` : "Unknown"}
  - Wind: ${conditions.windSpeed !== null ? `${Math.round(conditions.windSpeed)} km/h ${conditions.windDirection !== null ? getWindDirection(conditions.windDirection) : ""}` : "Unknown"}
  - Wave height: ${conditions.waveHeight !== null ? `${conditions.waveHeight.toFixed(1)}m` : "Unknown"}
  - Season: ${season}
  - Weather: ${conditions.weatherCondition}
  
  Focus on inshore fishing tactics, best locations (general types like "sheltered bays" not specific names), and suitable species for these conditions.`;

  const offshorePrompt = `You are an expert fishing guide. Based on these weather conditions at ${location.name}, provide brief, practical offshore fishing advice (max 3 sentences):
  - Temperature: ${conditions.temperature !== null ? `${Math.round(conditions.temperature)}°C` : "Unknown"}
  - Wind: ${conditions.windSpeed !== null ? `${Math.round(conditions.windSpeed)} km/h ${conditions.windDirection !== null ? getWindDirection(conditions.windDirection) : ""}` : "Unknown"}
  - Wave height: ${conditions.waveHeight !== null ? `${conditions.waveHeight.toFixed(1)}m` : "Unknown"}
  - Swell height: ${conditions.swellWaveHeight !== null ? `${conditions.swellWaveHeight.toFixed(1)}m` : "Unknown"}
  - Swell period: ${conditions.swellWavePeriod !== null ? `${conditions.swellWavePeriod.toFixed(1)}s` : "Unknown"}
  - Season: ${season}
  - Weather: ${conditions.weatherCondition}
  
  Focus on offshore fishing tactics, suitable depths, and target species for these conditions.`;

  try {
    // Make API calls to OpenAI in parallel
    const [inshoreResponse, offshoreResponse] = await Promise.all([
      generateTextWithAI({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: inshorePrompt }],
        maxTokens: 150,
        temperature: 0.7,
      }),

      generateTextWithAI({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: offshorePrompt }],
        maxTokens: 150,
        temperature: 0.7,
      }),
    ]);

    const { text: inshoreData } = inshoreResponse;
    const { text: offshoreData } = offshoreResponse;

    // Extract advice text from responses
    const inshoreAdviceText =
      inshoreData?.trim() || "No inshore fishing advice available";
    const offshoreAdviceText =
      offshoreData?.trim() || "No offshore fishing advice available";

    return {
      inshore: inshoreAdviceText,
      offshore: offshoreAdviceText,
    };
  } catch (error) {
    log("Error fetching fishing advice:", error);
    throw new Error("Failed to generate fishing advice");
  }
};

export const useFishingAdvice = (
  location: LocationData | null,
  conditions: CurrentConditions | null
) => {
  const queryClient = useQueryClient();

  const fishingAdviceQuery = useQuery({
    queryKey: fishingAdviceQueryKeys.fishingAdvice(location, conditions),
    queryFn: () => {
      if (!location || !conditions) {
        throw new Error(
          "Location and conditions are required for fishing advice"
        );
      }
      return fetchFishingAdvice(location, conditions);
    },
    enabled:
      !!location && !!conditions && !!location.latitude && !!location.longitude,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Mutation for refreshing fishing advice
  const refreshFishingAdviceMutation = useMutation({
    mutationFn: async () => {
      if (!location || !conditions) {
        throw new Error(
          "Location and conditions are required for fishing advice refresh"
        );
      }
      return fetchFishingAdvice(location, conditions);
    },
    onSuccess: (newAdvice) => {
      // Update the fishing advice cache
      if (location && conditions) {
        queryClient.setQueryData(
          fishingAdviceQueryKeys.fishingAdvice(location, conditions),
          newAdvice
        );
      }
    },
  });

  return {
    // Query data
    fishingAdvice: fishingAdviceQuery.data,
    isLoading: fishingAdviceQuery.isLoading,
    error: fishingAdviceQuery.error,
    isError: fishingAdviceQuery.isError,

    // Refresh mutation
    refreshFishingAdvice: refreshFishingAdviceMutation.mutate,
    refreshFishingAdviceAsync: refreshFishingAdviceMutation.mutateAsync,
    isRefreshing: refreshFishingAdviceMutation.isPending,

    // Query info
    isFetching: fishingAdviceQuery.isFetching,
    isStale: fishingAdviceQuery.isStale,
    lastUpdated: fishingAdviceQuery.dataUpdatedAt,
  };
};
