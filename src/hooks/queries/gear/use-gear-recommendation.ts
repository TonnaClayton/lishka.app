import { api } from "../api";
import { useQuery } from "@tanstack/react-query";

type GearRecommendationQuery = {
  temperature: number;
  wind_speed: number;
  wave_height: number;
  swell_wave_height: number;
  swell_wave_period: number;
  weather_condition: string;
};

export const gearRecommendationQueryKeys = {
  gearRecommendation: (query?: GearRecommendationQuery) =>
    [
      "gear",
      "recommendation",
      query?.temperature || "null",
      query?.wind_speed || "null",
      query?.wave_height || "null",
      query?.swell_wave_height || "null",
      query?.swell_wave_period || "null",
      query?.weather_condition || "null",
    ] as const,
};

// Weather summary data hook
export const useGetGearRecommendation = (query?: GearRecommendationQuery) => {
  return useQuery({
    queryKey: gearRecommendationQueryKeys.gearRecommendation(query),
    queryFn: async () => {
      if (!query) {
        throw new Error("No query provided");
      }

      const data = await api<{
        data: {
          gear_id: string;
          score: number;
          reasoning: string;
          suitability_for_conditions: string;
        }[];
      }>(
        `gear/recommendation?temperature=${query.temperature}&wind_speed=${query.wind_speed}&wave_height=${query.wave_height}&swell_wave_height=${query.swell_wave_height}&swell_wave_period=${query.swell_wave_period}&weather_condition=${query.weather_condition}`,
        {
          method: "GET",
        },
      );

      return data.data;
    },
    enabled: !!query,
  });
};
