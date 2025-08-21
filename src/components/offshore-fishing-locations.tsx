import React, { useState, useEffect, useCallback } from "react";
import OffshoreFishingCard from "./offshore-fishing-card";
import LoadingDots from "./loading-dots";
import {
  cacheApiResponse,
  getCachedApiResponse,
  generateEnhancedOffshoreFishingLocations,
  clearOffshoreFishingCache,
} from "@/lib/api-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { log } from "@/lib/logging";
import { useUserLocation } from "@/hooks/queries";

interface Coordinates {
  lat: number;
  lng: number;
}

interface OffshoreFishingLocation {
  name: string;
  coordinates: Coordinates;
  distance: number;
  depth: string;
  actualDepth: number;
  seabedType: string;
  structures: string[];
  probabilityScore: number;
  description: string;
  topographicFeatures?: string[];
  isShipwreck?: boolean;
  shipwreckInfo?: {
    name: string;
    type: string;
    fishingQuality: string;
  };
}

interface DebugInfo {
  totalGenerated: number;
  filteredOut: number;
  shipwrecksFound: number;
  averageDistance: number;
  depthRange: { min: number; max: number };
}

interface OffshoreFishingLocationsProps {
  userLocation: string;
  userCoordinates?: Coordinates;
}

const OffshoreFishingLocations: React.FC<
  OffshoreFishingLocationsProps
> = () => {
  const { location: userLocation } = useUserLocation();
  const [locations, setLocations] = useState<OffshoreFishingLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(15);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [lastFetchParams, setLastFetchParams] = useState<{
    lat: number;
    lng: number;
    radius: number;
  } | null>(null);

  // Enhanced fetch function with better error handling
  const fetchOffshoreFishingLocations = useCallback(
    async (forceRefresh: boolean = false) => {
      const currentParams = {
        lat: userLocation?.latitude,
        lng: userLocation?.longitude,
        radius: selectedRadius,
      };

      // Skip if same parameters and not forcing refresh
      if (
        !forceRefresh &&
        lastFetchParams &&
        lastFetchParams.lat === currentParams.lat &&
        lastFetchParams.lng === currentParams.lng &&
        lastFetchParams.radius === currentParams.radius
      ) {
        log("⏭️ Skipping fetch - same parameters");
        return;
      }

      setLoading(true);
      setError(null);
      setLastFetchParams(currentParams);

      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Enhanced cache key with version
        const cacheKey = `offshore_fishing_v3_${currentParams.lat.toFixed(4)}_${currentParams.lng.toFixed(4)}_${selectedRadius}NM_${currentYear}_${currentMonth}`;

        log(
          `🎣 Fetching fishing locations for ${currentParams.lat.toFixed(4)}, ${currentParams.lng.toFixed(4)} within ${selectedRadius}NM`,
        );

        // Check cache first (unless forcing refresh)
        if (!forceRefresh) {
          const cachedData = getCachedApiResponse(cacheKey);
          if (
            cachedData &&
            cachedData.locations &&
            Array.isArray(cachedData.locations)
          ) {
            log("📦 Using cached fishing locations data");
            setLocations(cachedData.locations);
            setDebugInfo(cachedData.debugInfo || null);
            setLoading(false);
            return;
          }
        }

        // Generate new locations
        log("🔄 Generating new fishing locations...");
        const result = await generateEnhancedOffshoreFishingLocations(
          currentParams.lat,
          currentParams.lng,
          selectedRadius,
          18, // Target 18 locations
        );

        if (!result.locations || result.locations.length === 0) {
          throw new Error(
            `No suitable offshore fishing locations found within ${selectedRadius} nautical miles. Try increasing the search radius or check if you're in a coastal area with limited offshore access.`,
          );
        }

        // Validate all locations are within radius
        const validLocations = result.locations.filter((location) => {
          return location.distance <= selectedRadius;
        });

        if (validLocations.length === 0) {
          throw new Error(
            `All generated locations were outside the ${selectedRadius}NM radius. This may indicate a technical issue.`,
          );
        }

        log(
          `✅ Successfully generated ${validLocations.length} fishing locations`,
        );
        log(`📊 Debug info:`, result.debugInfo);

        setLocations(validLocations);
        setDebugInfo(result.debugInfo);

        // Cache the results for 2 hours
        const cacheData = {
          locations: validLocations,
          debugInfo: result.debugInfo,
          timestamp: Date.now(),
        };
        cacheApiResponse(cacheKey, cacheData, 2 * 60 * 60 * 1000);
      } catch (err) {
        console.error("❌ Error generating fishing locations:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate offshore fishing locations. Please try again.",
        );
        setLocations([]);
        setDebugInfo(null);
      } finally {
        setLoading(false);
      }
    },
    [userLocation, selectedRadius, lastFetchParams],
  );

  // Effect to load locations when component mounts or dependencies change
  useEffect(() => {
    fetchOffshoreFishingLocations();
  }, [fetchOffshoreFishingLocations]);

  // Effect to manage debug state
  useEffect(() => {
    const debugPreference = localStorage.getItem("showLocationDebug");
    setShowDebug(debugPreference === "true");

    const handleDebugChange = () => {
      const newDebugPreference = localStorage.getItem("showLocationDebug");
      setShowDebug(newDebugPreference === "true");
    };

    window.addEventListener("locationDebugChanged", handleDebugChange);
    return () => {
      window.removeEventListener("locationDebugChanged", handleDebugChange);
    };
  }, []);

  // Handle radius change with immediate update
  const handleRadiusChange = useCallback((radius: number) => {
    log(`🎯 Radius changed to ${radius}NM`);
    setSelectedRadius(radius);
    setError(null);
    // The useEffect will trigger fetchOffshoreFishingLocations automatically
  }, []);

  // Handle location click
  const handleLocationClick = useCallback(
    (location: OffshoreFishingLocation) => {
      log("🎣 Selected offshore fishing location:", location);
      // Add any additional click handling here
    },
    [],
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    fetchOffshoreFishingLocations(true); // Force refresh
  }, [fetchOffshoreFishingLocations]);

  // Handle clear cache and retry
  const handleClearCacheAndRetry = useCallback(() => {
    clearOffshoreFishingCache();
    handleRetry();
  }, [handleRetry]);

  const radiusOptions = [5, 10, 15, 20, 25, 30];

  // Loading state
  if (loading && locations.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingDots />
        <p className="text-sm text-muted-foreground ml-2">
          Analyzing topography and generating fishing locations...
        </p>
      </div>
    );
  }

  // Error state
  if (error && locations.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium mb-2">
              Unable to generate offshore fishing locations
            </p>
            <p className="text-red-600 dark:text-red-300 text-xs mb-3">
              {error}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="text-xs px-3 py-1 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCacheAndRetry}
                className="text-xs px-3 py-1 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Clear Cache & Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Radius Selector */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Search Radius:
          </span>
          {debugInfo && (
            <Badge variant="outline" className="text-xs">
              {debugInfo.totalGenerated} locations found
            </Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {radiusOptions.map((radius) => (
            <Button
              key={radius}
              variant={selectedRadius === radius ? "default" : "outline"}
              size="sm"
              onClick={() => handleRadiusChange(radius)}
              className="text-xs px-3 py-1"
              disabled={loading}
            >
              {radius} NM
            </Button>
          ))}
        </div>
      </div>

      {/* Debug Section */}
      {showDebug && debugInfo && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              🎣 Fishing Locations Debug Info
            </span>
          </div>
          <div className="space-y-1 text-xs text-blue-600 dark:text-blue-300">
            <div className="font-mono">
              📍 Your Location: {userLocation?.latitude.toFixed(6)}°,{" "}
              {userLocation?.longitude.toFixed(6)}°
            </div>
            <div className="font-mono">
              🎯 Search Radius: {selectedRadius} NM
            </div>
            <div className="font-mono">
              ✅ Locations Generated: {debugInfo.totalGenerated}
            </div>
            <div className="font-mono">
              ❌ Locations Filtered Out: {debugInfo.filteredOut} (too close to
              shore)
            </div>
            <div className="font-mono">
              🚢 Shipwrecks Found: {debugInfo.shipwrecksFound}
            </div>
            <div className="font-mono">
              📏 Average Distance: {debugInfo.averageDistance} NM
            </div>
            <div className="font-mono">
              🌊 Depth Range: {debugInfo.depthRange.min}m -{" "}
              {debugInfo.depthRange.max}m
            </div>
          </div>
        </div>
      )}

      {/* Shipwreck Info */}
      {debugInfo && debugInfo.shipwrecksFound > 0 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🚢</span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Shipwreck Fishing Grounds Included
            </span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-300">
            Found {debugInfo.shipwrecksFound} historic shipwreck
            {debugInfo.shipwrecksFound > 1 ? "s" : ""} in your area. These
            artificial reefs are excellent fishing hotspots with high fish
            concentrations.
          </p>
        </div>
      )}

      {/* Locations Grid */}
      {locations.length > 0 ? (
        <>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {locations.map((location, index) => (
              <OffshoreFishingCard
                key={`offshore-${location.coordinates.lat}-${location.coordinates.lng}-${index}`}
                name={location.name}
                coordinates={location.coordinates}
                userCoordinates={location.coordinates}
                distance={location.distance}
                depth={location.depth}
                seabedType={location.seabedType}
                structures={location.structures}
                probabilityScore={location.probabilityScore}
                description={location.description}
                searchRadius={selectedRadius}
                actualDepth={location.actualDepth}
                onClick={() => handleLocationClick(location)}
                topographicFeatures={location.topographicFeatures}
              />
            ))}
          </div>

          {/* Summary Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Showing {locations.length} offshore fishing locations within{" "}
              {selectedRadius} NM
              {debugInfo?.shipwrecksFound
                ? ` • ${debugInfo.shipwrecksFound} shipwreck location${debugInfo.shipwrecksFound > 1 ? "s" : ""}`
                : ""}
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            No fishing locations available for {selectedRadius} NM radius.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">
            Try increasing the search radius or check if you're in a coastal
            area.
          </p>
        </div>
      )}
    </div>
  );
};

export default OffshoreFishingLocations;
