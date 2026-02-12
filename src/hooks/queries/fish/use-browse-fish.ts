import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../api";
import {
  getHabitatDescription,
  getDifficultyFromProfile,
} from "@/lib/fish-categories";

// ---------------------------------------------------------------------------
// Types — match the backend GET /fish/browse response shape
// ---------------------------------------------------------------------------

/** Raw item returned by the backend API */
interface BrowseFishApiItem {
  scientificName: string;
  commonName: string;
  specCode: number;
  waterType: string | null;
  image: string | null;
  family: string | null;
  isToxic: boolean;
  isRecreationallyAccessible: boolean;
  habitats: string[];
  depthBands: string[];
  techniques: string[];
  catchProfile: string | null;
  catchRarity: string | null;
  feedingStyles: string[];
}

interface BrowseFishApiResponse {
  data: BrowseFishApiItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Item consumed by frontend components (FishCard-compatible) */
export interface BrowseFishItem {
  name: string;
  scientificName: string;
  habitat: string;
  difficulty: string;
  image?: string;
  slug: string;
  isToxic: boolean;
  dangerType?: string;
  habitats: string[];
  depthBands: string[];
  techniques: string[];
  catchProfile: string | null;
  catchRarity: string | null;
  feedingStyles: string[];
  freshwaterHabitats: string[];
}

export interface BrowseFilters {
  habitats?: string;
  depthBands?: string;
  techniques?: string;
  catchProfile?: string;
  catchRarity?: string;
  feedingStyles?: string;
  freshwaterHabitats?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(scientificName: string): string {
  return scientificName.toLowerCase().replace(/\s+/g, "-");
}

function mapApiItemToFishItem(item: BrowseFishApiItem): BrowseFishItem {
  const { label: difficulty } = getDifficultyFromProfile(item.catchProfile);
  const habitat = getHabitatDescription(item.habitats) || item.waterType || "";

  return {
    name: item.commonName || item.scientificName,
    scientificName: item.scientificName,
    habitat,
    difficulty,
    image: item.image || undefined,
    slug: generateSlug(item.scientificName),
    isToxic: item.isToxic,
    dangerType: undefined,
    habitats: item.habitats,
    depthBands: item.depthBands,
    techniques: item.techniques,
    catchProfile: item.catchProfile,
    catchRarity: item.catchRarity,
    feedingStyles: item.feedingStyles,
    freshwaterHabitats: [],
  };
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const browseQueryKeys = {
  browse: (filters: BrowseFilters) => ["browseFish", filters] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches fish from the GET /fish/browse endpoint with category-based filters.
 * Supports infinite scroll pagination.
 */
export const useBrowseFish = (filters: BrowseFilters) => {
  const queryKey = browseQueryKeys.browse(filters);

  const hasActiveFilter = Object.values(filters).some(
    (v) => v !== undefined && v !== "",
  );

  return useInfiniteQuery<BrowseFishItem[]>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        pageSize: "20",
      });

      // Append category filters
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          params.set(key, value);
        }
      }

      const res = await api<BrowseFishApiResponse>(
        `fish/browse?${params.toString()}`,
        { method: "GET" },
      );

      return res.data.map(mapApiItemToFishItem);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    select: (data) => {
      const flat = data.pages.flat();

      // De-duplicate by scientific name
      const seen = new Set<string>();
      const unique: BrowseFishItem[] = [];
      for (const fish of flat) {
        const key = fish.scientificName.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(fish);
        }
      }

      return { ...data, pages: [unique] };
    },
    initialPageParam: 1,
    enabled: hasActiveFilter,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};
