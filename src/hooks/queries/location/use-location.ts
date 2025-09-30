import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { log } from "@/lib/logging";
import { LocationData, locationQueryKeys } from "./use-location-storage";
import { useAuth } from "@/contexts/auth-context";
import { captureEvent } from "@/lib/posthog";

// Default location (Malta)
const DEFAULT_LOCATION: LocationData = {
  latitude: 35.8997,
  longitude: 14.5146,
  name: "Malta",
};

export const useUserLocation = () => {
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null,
  );
  const { profile, loading: isLoadingProfile, updateProfile } = useAuth();
  const userLocation = useMemo(() => {
    const locationCoordinates = profile?.location_coordinates as any;

    return locationCoordinates
      ? {
          latitude: locationCoordinates.latitude,
          longitude: locationCoordinates.longitude,
          name: profile.location || "Unknown Location",
        }
      : null;
  }, [profile]);

  // Query for the current active location
  const locationQuery = useQuery({
    queryKey: locationQueryKeys.userLocation(),
    queryFn: (): LocationData => {
      let locationToUse: LocationData | null = null;

      // First priority: use the location passed as a prop
      if (userLocation) {
        log(
          `Using provided user location: ${userLocation.name} (${userLocation.latitude}, ${userLocation.longitude})`,
        );
        locationToUse = userLocation;
      } else {
        // Third priority: use default location
        log("No location found, setting Malta as default");
        locationToUse = DEFAULT_LOCATION;
      }

      return locationToUse;
    },
    enabled: !!userLocation, // Only run when saved location is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for updating location
  const updateLocationMutation = useMutation({
    mutationFn: async (newLocation: LocationData) => {
      log("Setting new location:", newLocation);

      // Check if location actually changed
      const locationChanged = !(
        currentLocation &&
        currentLocation.latitude === newLocation.latitude &&
        currentLocation.longitude === newLocation.longitude &&
        currentLocation.name === newLocation.name
      );

      if (!locationChanged) {
        return currentLocation;
      }

      // Save to localStorage
      await updateProfile({
        location_coordinates: newLocation as any,
        location: newLocation.name,
      });

      // Track location change event
      captureEvent("location_changed", {
        location_name: newLocation.name,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        country_code: newLocation.countryCode,
        state: newLocation.state,
        city: newLocation.city,
      });

      return newLocation;
    },
    onSuccess: (updatedLocation) => {
      // Update the current location cache
      queryClient.setQueryData(
        locationQueryKeys.userLocation(),
        updatedLocation,
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
        refreshedLocation,
      );
      setCurrentLocation(refreshedLocation);
    },
  });

  const clearLocation = useMutation({
    mutationFn: async () => {
      await updateProfile({
        location_coordinates: null,
        location: null,
      });
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
    isLoading: locationQuery.isLoading || isLoadingProfile,
    error: locationQuery.error,

    // Mutations
    updateLocation: updateLocationMutation.mutate,
    updateLocationAsync: updateLocationMutation.mutateAsync,
    refreshLocation: refreshLocationMutation.mutate,
    refreshLocationAsync: refreshLocationMutation.mutateAsync,
    clearLocation: clearLocation.mutate,
    clearLocationAsync: clearLocation.mutateAsync,

    // Loading states
    isUpdating: updateLocationMutation.isPending,
    isRefreshing: refreshLocationMutation.isPending,

    // Helper functions
    hasLocation: !!currentLocation,
    isDefaultLocation: currentLocation?.name === DEFAULT_LOCATION.name,
  };
};
