import { useQuery } from "@tanstack/react-query";
import { log } from "@/lib/logging";
import { api } from "../api";
import { fishSchema } from "./type";
import z from "zod";
import { FishData } from "./use-fish-data";

/**
 * Schema for FAO fish API response
 */
const faoFishResponseSchema = z.object({
  user_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    location_name: z.string().optional(),
  }),
  fao_areas: z.array(
    z.object({
      fao_code: z.string(),
      major_code: z.string(),
      fao_name: z.string(),
    })
  ),
  fish_count: z.number(),
  fish: z.array(fishSchema),
  metadata: z.object({
    queried_at: z.string(),
    detection_method: z.string(),
    note: z.string().optional(),
  }),
});

export const faoFishQueryKeys = {
  faoFishData: (latitude?: number, longitude?: number, limit?: number, offset?: number) =>
    [
      "faoFishData",
      typeof latitude === "number" ? latitude : null,
      typeof longitude === "number" ? longitude : null,
      limit,
      offset,
    ] as const,
};

/**
 * Hook to fetch fish data using FAO areas (PostGIS-based)
 * Uses authenticated user's location by default, or provided coordinates
 */
export const useFAOFishData = (
  options?: {
    latitude?: number;
    longitude?: number;
    limit?: number;
    offset?: number;
    enabled?: boolean;
  }
) => {
  const { latitude, longitude, limit = 100, offset = 0, enabled = true } = options || {};

  const queryKey = faoFishQueryKeys.faoFishData(latitude, longitude, limit, offset);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const queryParams = new URLSearchParams();

      if (typeof latitude === "number") {
        queryParams.set("latitude", String(latitude));
      }

      if (typeof longitude === "number") {
        queryParams.set("longitude", String(longitude));
      }

      if (limit) {
        queryParams.set("limit", String(limit));
      }

      if (offset) {
        queryParams.set("offset", String(offset));
      }

      const data = await api<z.infer<typeof faoFishResponseSchema>>(
        `fao/fish?${queryParams.toString()}`,
        {
          method: "GET",
        }
      );

      log("[FAO FISH DATA]", data);

      // Transform to FishData format
      const transformedFish: FishData[] = data.fish.map((f) => ({
        name: f.name || f.scientific_name || "",
        scientificName: f.scientific_name || "",
        localName: f.local_name || undefined,
        habitat: f.habitat || "",
        difficulty: (f.difficulty as any) || "Easy",
        season: f.season || "",
        isToxic: f.is_toxic || false,
        dangerType: f.danger_type || undefined,
        image: f.image || undefined,
        slug: f.slug || undefined,
        probabilityScore: f.probability_score || undefined,
      }));

      return {
        ...data,
        fish: transformedFish,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

