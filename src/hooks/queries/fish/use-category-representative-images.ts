import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

// ---------------------------------------------------------------------------
// Types — match the backend GET /fish/categories/representative-images response
// ---------------------------------------------------------------------------

interface CategoryRepresentativeImageItem {
  filterKey: string;
  categoryId: string;
  imageUrl: string | null;
}

interface CategoryRepresentativeImagesResponse {
  images: CategoryRepresentativeImageItem[];
}

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const categoryRepresentativeImagesQueryKeys = {
  all: ["categoryRepresentativeImages"] as const,
  byLocation: (latitude: number, longitude: number) =>
    [
      ...categoryRepresentativeImagesQueryKeys.all,
      latitude,
      longitude,
    ] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches representative fish image URLs per category for the user's region.
 * Used by the homepage Discover section to show region-specific category images.
 * Returns a Map keyed by `${filterKey}:${categoryId}`; only non-null imageUrl entries are included.
 * Disabled when latitude or longitude is missing.
 */
export function useCategoryRepresentativeImages(
  latitude: number | undefined,
  longitude: number | undefined,
) {
  const enabled =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const query = useQuery({
    queryKey: categoryRepresentativeImagesQueryKeys.byLocation(
      latitude ?? 0,
      longitude ?? 0,
    ),
    queryFn: async (): Promise<Map<string, string>> => {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
      });
      const res = await api<CategoryRepresentativeImagesResponse>(
        `fish/categories/representative-images?${params.toString()}`,
        { method: "GET" },
      );
      const map = new Map<string, string>();
      for (const item of res.images) {
        if (item.imageUrl) {
          map.set(`${item.filterKey}:${item.categoryId}`, item.imageUrl);
        }
      }
      return map;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,
  };
}
