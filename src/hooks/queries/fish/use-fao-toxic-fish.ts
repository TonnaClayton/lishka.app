import { useQuery } from "@tanstack/react-query";
import { log } from "@/lib/logging";
import { api } from "../api";
import { fishSchema } from "./type";
import z from "zod";
import { FishData } from "./use-fish-data";

/**
 * Schema for FAO toxic fish API response
 */
const faoToxicFishResponseSchema = z.object({
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
  toxic_fish_count: z.number(),
  toxic_fish: z.array(fishSchema),
  metadata: z.object({
    queried_at: z.string(),
    detection_method: z.string(),
    note: z.string().optional(),
  }),
});

export const faoToxicFishQueryKeys = {
  faoToxicFishData: (latitude?: number, longitude?: number) =>
    [
      "faoToxicFishData",
      typeof latitude === "number" ? latitude : null,
      typeof longitude === "number" ? longitude : null,
    ] as const,
};

/**
 * Hook to fetch toxic fish data using FAO areas (PostGIS-based)
 * Uses authenticated user's location by default, or provided coordinates
 */
export const useFAOToxicFishData = (
  options?: {
    latitude?: number;
    longitude?: number;
    enabled?: boolean;
  }
) => {
  const { latitude, longitude, enabled = true } = options || {};

  const queryKey = faoToxicFishQueryKeys.faoToxicFishData(latitude, longitude);

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

      const data = await api<z.infer<typeof faoToxicFishResponseSchema>>(
        `fao/fish/toxic?${queryParams.toString()}`,
        {
          method: "GET",
        }
      );

      log("[FAO TOXIC FISH DATA]", data);

      // Transform to FishData format
      const transformedFish: FishData[] = data.toxic_fish.map((f) => ({
        name: f.name || f.scientific_name || "",
        scientificName: f.scientific_name || "",
        localName: f.local_name || undefined,
        habitat: f.habitat || "",
        difficulty: (f.difficulty as any) || "Easy",
        season: f.season || "",
        isToxic: f.is_toxic || true, // All fish from toxic endpoint are toxic
        dangerType: f.danger_type || "Toxic - handle with caution",
        image: f.image || undefined,
        slug: f.slug || undefined,
        probabilityScore: f.probability_score || undefined,
      }));

      return {
        ...data,
        toxic_fish: transformedFish,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

