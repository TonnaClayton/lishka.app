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

      let queryString = "";

      if (query.temperature) {
        queryString += `temperature=${query.temperature}`;
      }
      if (query.wind_speed) {
        queryString += `&wind_speed=${query.wind_speed}`;
      }
      if (query.wave_height) {
        queryString += `&wave_height=${query.wave_height}`;
      }
      if (query.swell_wave_height) {
        queryString += `&swell_wave_height=${query.swell_wave_height}`;
      }
      if (query.swell_wave_period) {
        queryString += `&swell_wave_period=${query.swell_wave_period}`;
      }
      if (query.weather_condition) {
        queryString += `&weather_condition=${query.weather_condition}`;
      }

      const data = await api<{
        data: {
          gear_id: string;
          score: number;
          reasoning: string;
          suitability_for_conditions: string;
        }[];
      }>(`gear/recommendation?${queryString}`, {
        method: "GET",
      });

      return data.data;
    },
    enabled: !!query,
  });
};
