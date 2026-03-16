import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

interface FreshwaterFeature {
  type: string;
  name?: string;
}

interface FreshwaterNearbyResponse {
  hasFreshwater: boolean;
  features: FreshwaterFeature[];
}

/**
 * Check whether freshwater bodies (rivers, lakes, etc.) exist near
 * the given coordinates. Uses the backend `/location/freshwater-nearby`
 * endpoint which queries OpenStreetMap's Overpass API.
 *
 * When countryCode is provided, the backend may force hasFreshwater: false
 * for marine-only countries (e.g. MT, CY) without querying Overpass.
 *
 * The result is cached for 1 hour per coordinate pair and country (rounded to 2 dp)
 * so repeated renders don't re-fetch.
 */
export function useFreshwaterNearby(
  latitude?: number,
  longitude?: number,
  countryCode?: string,
) {
  // Round to 2 decimal places (~1 km precision) for cache key stability
  const roundedLat = latitude != null ? Math.round(latitude * 100) / 100 : null;
  const roundedLon =
    longitude != null ? Math.round(longitude * 100) / 100 : null;
  const normalizedCountry = countryCode?.trim() || undefined;

  return useQuery<FreshwaterNearbyResponse>({
    queryKey: ["freshwater-nearby", roundedLat, roundedLon, normalizedCountry],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roundedLat != null) params.set("latitude", String(roundedLat));
      if (roundedLon != null) params.set("longitude", String(roundedLon));
      if (normalizedCountry) params.set("countryCode", normalizedCountry);

      return api<FreshwaterNearbyResponse>(
        `location/freshwater-nearby?${params.toString()}`,
      );
    },
    enabled: roundedLat != null && roundedLon != null,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 1,
    // Default to false while loading so the section stays hidden
    placeholderData: { hasFreshwater: false, features: [] },
  });
}
