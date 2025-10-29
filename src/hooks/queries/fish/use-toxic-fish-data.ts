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
  return useQuery({
    queryKey: fishQueryKeys.toxicFishData(
      location,
      userLatitude,
      userLongitude,
    ),
    queryFn: async () => {
      const data = await api<{
        data: z.infer<typeof fishSchema>[];
      }>("fish/toxic", {
        method: "GET",
      });

      return data.data.filter((fish) => fish.is_toxic);
      //return fetchToxicFishData(location, userLatitude, userLongitude);
    },
    enabled: !!location,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
  });
};
