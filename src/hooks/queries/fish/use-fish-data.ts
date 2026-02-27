import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { log } from "@/lib/logging";
import { api } from "../api";
import { fishSchema } from "./type";
import z from "zod";
import { DEFAULT_LOCATION } from "@/lib/const";

export interface FishData {
  id?: string;
  name: string;
  scientificName: string;
  localName?: string;
  habitat: string;
  difficulty: "Easy" | "Intermediate" | "Hard" | "Advanced" | "Expert";
  season: string;
  isToxic: boolean;
  dangerType?: string;
  riskBadge?: string | null;
  image?: string;
  slug?: string;
  probabilityScore?: number;
  flaggedForReview?: boolean;
}

export const fishQueryKeys = {
  fishData: (
    location: string,
    page: number,
    userLatitude?: number,
    userLongitude?: number,
  ) => ["fishData", location, page, userLatitude, userLongitude] as const,
  fishDataInfinite: (
    location?: string,
    userLatitude?: number,
    userLongitude?: number,
  ) =>
    [
      "fishDataInfinite",
      location ?? "",
      typeof userLatitude === "number" ? userLatitude : null,
      typeof userLongitude === "number" ? userLongitude : null,
    ] as const,
  toxicFishData: (
    location?: string,
    userLatitude?: number,
    userLongitude?: number,
  ) =>
    [
      "toxicFishData",
      location ?? "",
      typeof userLatitude === "number" ? userLatitude : null,
      typeof userLongitude === "number" ? userLongitude : null,
    ] as const,
  fishingTips: (query: {
    temperature?: number;
    windSpeed?: number;
    waveHeight?: number;
    weatherCondition?: string;
  }) => ["fishingTips", query] as const,
};

export const useFishDataInfinite = (
  location: string,
  userLatitude?: number,
  userLongitude?: number,
) => {
  const queryKey = fishQueryKeys.fishDataInfinite(
    location,
    userLatitude,
    userLongitude,
  );

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      let data: { data: z.infer<typeof fishSchema>[] } = { data: [] };

      if (location === DEFAULT_LOCATION.name) {
        data = { data: [] };
      } else {
        const queryParams = new URLSearchParams({
          page: String(pageParam),
          pageSize: "16",
        });

        if (location) {
          queryParams.set("location", location);
        }

        if (typeof userLatitude === "number") {
          queryParams.set("latitude", String(userLatitude));
        }

        if (typeof userLongitude === "number") {
          queryParams.set("longitude", String(userLongitude));
        }

        data = await api<{
          data: z.infer<typeof fishSchema>[];
        }>(`fish?${queryParams.toString()}`, {
          method: "GET",
        });
      }

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
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
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
