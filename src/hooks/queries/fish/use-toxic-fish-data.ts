import { useQuery } from "@tanstack/react-query";
import { FishData, fishQueryKeys } from "./use-fish-data";
import { api } from "../api";
import z from "zod";
import { fishSchema } from "./type";

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

export const useToxicFishData = (
  location: string,
  userLatitude?: number,
  userLongitude?: number,
) => {
  const queryKey = fishQueryKeys.toxicFishData(
    location,
    userLatitude,
    userLongitude,
  );

  return useQuery({
    queryKey,
    queryFn: async () => {
      const queryParams = new URLSearchParams();

      if (location) {
        queryParams.set("location", location);
      }

      if (typeof userLatitude === "number") {
        queryParams.set("latitude", String(userLatitude));
      }

      if (typeof userLongitude === "number") {
        queryParams.set("longitude", String(userLongitude));
      }

      const queryString = queryParams.toString();

      const data = await api<{
        data: z.infer<typeof fishSchema>[];
      }>(`fish/toxic${queryString ? `?${queryString}` : ""}`, {
        method: "GET",
      });

      return data.data.filter((fish) => fish.is_toxic);
      //return fetchToxicFishData(location, userLatitude, userLongitude);
    },
    enabled: !!location,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};
