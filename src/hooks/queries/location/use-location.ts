import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { log } from "@/lib/logging";
import {
  useLocationStorage,
  LocationData,
  locationQueryKeys,
} from "./use-location-storage";

// Default location (Malta)
const DEFAULT_LOCATION: LocationData = {
  latitude: 35.8997,
  longitude: 14.5146,
  name: "Malta",
};

export const useLocation = (userLocation?: LocationData) => {
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );

  const {
    savedLocation,
    isLoading: isLoadingSaved,
    error: savedLocationError,
    saveLocation,
    saveLocationAsync,
    clearLocation,
    clearLocationAsync,
    isSaving,
    isClearing,
  } = useLocationStorage();

  // Query for the current active location
  const locationQuery = useQuery({
    queryKey: locationQueryKeys.userLocation(),
    queryFn: (): LocationData => {
      let locationToUse: LocationData | null = null;

      // First priority: use the location passed as a prop
      if (userLocation) {
        log(
          `Using provided user location: ${userLocation.name} (${userLocation.latitude}, ${userLocation.longitude})`
        );
        locationToUse = userLocation;
      } else if (savedLocation) {
        // Second priority: use saved location from localStorage
        log(
          `Using saved location: ${savedLocation.name} (${savedLocation.latitude}, ${savedLocation.longitude})`
        );
        locationToUse = savedLocation;
      } else {
        // Third priority: use default location
        log("No location found, setting Malta as default");
        locationToUse = DEFAULT_LOCATION;
        // Also save to localStorage
        saveLocation(DEFAULT_LOCATION);
      }

      return locationToUse;
    },
    enabled: !isLoadingSaved, // Only run when saved location is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for updating location
  const updateLocationMutation = useMutation({
    mutationFn: async (newLocation: LocationData) => {
      log("Setting new location:", newLocation);

      // Check if location actually changed
      if (
        currentLocation &&
        currentLocation.latitude === newLocation.latitude &&
        currentLocation.longitude === newLocation.longitude &&
        currentLocation.name === newLocation.name
      ) {
        return currentLocation;
      }

      // Save to localStorage
      await saveLocationAsync(newLocation);

      return newLocation;
    },
    onSuccess: (updatedLocation) => {
      // Update the current location cache
      queryClient.setQueryData(
        locationQueryKeys.userLocation(),
        updatedLocation
      );
      setCurrentLocation(updatedLocation);
    },
  });

  // Mutation for refreshing location (forces refetch)
  const refreshLocationMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) {
        throw new Error("No location to refresh");
      }

      // Add timestamp to force refresh
      const refreshedLocation = {
        ...currentLocation,
        _timestamp: Date.now(),
      };

      log("Forcing refresh with new location object:", refreshedLocation);
      return refreshedLocation;
    },
    onSuccess: (refreshedLocation) => {
      // Update the current location cache
      queryClient.setQueryData(
        locationQueryKeys.userLocation(),
        refreshedLocation
      );
      setCurrentLocation(refreshedLocation);
    },
  });

  // Effect to sync current location with query data
  useEffect(() => {
    if (locationQuery.data && locationQuery.data !== currentLocation) {
      setCurrentLocation(locationQuery.data);
    }
  }, [locationQuery.data, currentLocation]);

  // Effect to handle storage changes from other components
  useEffect(() => {
    const handleStorageChange = () => {
      queryClient.invalidateQueries({
        queryKey: locationQueryKeys.savedLocation(),
      });
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [queryClient]);

  return {
    // Current location state
    location: currentLocation,
    isLoading: locationQuery.isLoading || isLoadingSaved,
    error: locationQuery.error || savedLocationError,

    // Saved location state
    savedLocation,
    isLoadingSaved,
    savedLocationError,

    // Mutations
    updateLocation: updateLocationMutation.mutate,
    updateLocationAsync: updateLocationMutation.mutateAsync,
    refreshLocation: refreshLocationMutation.mutate,
    refreshLocationAsync: refreshLocationMutation.mutateAsync,
    clearLocation,
    clearLocationAsync,

    // Loading states
    isUpdating: updateLocationMutation.isPending,
    isRefreshing: refreshLocationMutation.isPending,
    isSaving,
    isClearing,

    // Helper functions
    hasLocation: !!currentLocation,
    isDefaultLocation: currentLocation?.name === DEFAULT_LOCATION.name,
  };
};
