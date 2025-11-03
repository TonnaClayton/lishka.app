import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
    select: (data) => {
      // flatten pages
      const flat = data.pages.flat();

      // de-dupe by normalized scientific name (+ location if you include it in rows)
      const seen = new Set<string>();
      const unique = [];
      for (const f of flat) {
        const key = (f.scientific_name || "").toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(f);
        }
      }

      // keep the backend ordering (already popularity-ranked) intact
      return { ...data, pages: [unique] }; // consumers map over pages[0]
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

      log("[FISHING TIPS]", data);

      return data.data;
      //return fetchToxicFishData(location, userLatitude, userLongitude);
    },
    // enabled: !!query.temperature && !!query.windSpeed && !!query.waveHeight &&
    //   !!query.weatherCondition,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
  });
};
