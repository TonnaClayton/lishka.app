import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { log } from "@/lib/logging";

export interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  _timestamp?: number;
}

export const locationQueryKeys = {
  userLocation: () => ["location", "user"] as const,
  savedLocation: () => ["location", "saved"] as const,
  currentWeatherData: () => ["weather", "current"] as const,
};

// Hook for managing user location storage
export const useLocationStorage = () => {
  const queryClient = useQueryClient();

  // Query for getting saved location from localStorage
  const savedLocationQuery = useQuery({
    queryKey: locationQueryKeys.savedLocation(),
    queryFn: (): LocationData | null => {
      try {
        const savedLocation = localStorage.getItem("userLocationFull");
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          if (
            parsedLocation &&
            (parsedLocation.latitude || parsedLocation.lat)
          ) {
            return {
              latitude:
                parsedLocation.latitude || parsedLocation.lat || 35.8997,
              longitude:
                parsedLocation.longitude || parsedLocation.lng || 14.5146,
              name: parsedLocation.name || "Malta",
            };
          }
        }
        return null;
      } catch (err) {
        console.error("Error parsing user location:", err);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for saving location to localStorage
  const saveLocationMutation = useMutation({
    mutationFn: async (location: LocationData) => {
      localStorage.setItem("userLocation", location.name);
      localStorage.setItem("userLocationFull", JSON.stringify(location));
      log("Location saved to localStorage:", location);
      return location;
    },
    onSuccess: (savedLocation) => {
      // Invalidate and refetch saved location query
      queryClient.invalidateQueries({
        queryKey: locationQueryKeys.savedLocation(),
      });
      // Update the saved location cache
      queryClient.setQueryData(
        locationQueryKeys.savedLocation(),
        savedLocation
      );
    },
  });

  // Mutation for clearing location from localStorage
  const clearLocationMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("userLocation");
      localStorage.removeItem("userLocationFull");
      log("Location cleared from localStorage");
    },
    onSuccess: () => {
      // Invalidate and refetch saved location query
      queryClient.invalidateQueries({
        queryKey: locationQueryKeys.savedLocation(),
      });
      // Clear the saved location cache
      queryClient.setQueryData(locationQueryKeys.savedLocation(), null);
    },
  });

  return {
    savedLocation: savedLocationQuery.data,
    isLoading: savedLocationQuery.isLoading,
    error: savedLocationQuery.error,
    saveLocation: saveLocationMutation.mutate,
    saveLocationAsync: saveLocationMutation.mutateAsync,
    clearLocation: clearLocationMutation.mutate,
    clearLocationAsync: clearLocationMutation.mutateAsync,
    isSaving: saveLocationMutation.isPending,
    isClearing: clearLocationMutation.isPending,
  };
};
