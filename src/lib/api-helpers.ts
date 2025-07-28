/**
 * Enhanced API Helper functions for offshore fishing locations
 * Completely rewritten for better reliability and consistency
 */

import { log } from "./logging";

// Simple exponential backoff implementation
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Enhanced coordinate validation and distance calculation
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Enhanced coastline detection with comprehensive global coverage
 */
function isLocationOffshore(
  lat: number,
  lng: number,
  minDistanceKm: number = 3.0,
): boolean {
  // Comprehensive coastline database with major fishing regions
  const coastlineRegions = [
    // Mediterranean Sea (Enhanced)
    {
      name: "Mediterranean",
      bounds: { north: 46, south: 30, east: 42, west: -6 },
      coastlines: [
        // Malta and surrounding waters (Ultra-detailed)
        { lat: 35.95, lng: 14.38, tolerance: 3.0 },
        { lat: 36.04, lng: 14.34, tolerance: 3.0 },
        { lat: 35.83, lng: 14.51, tolerance: 3.0 },
        { lat: 36.06, lng: 14.29, tolerance: 3.0 },
        { lat: 35.65, lng: 14.75, tolerance: 3.0 },

        // Sicily (Detailed)
        { lat: 36.7, lng: 15.1, tolerance: 2.5 },
        { lat: 36.9, lng: 14.9, tolerance: 2.5 },
        { lat: 37.1, lng: 14.7, tolerance: 2.5 },
        { lat: 36.5, lng: 15.3, tolerance: 2.5 },

        // Italian mainland
        { lat: 44.4, lng: 8.9, tolerance: 2.0 },
        { lat: 43.8, lng: 10.3, tolerance: 2.0 },
        { lat: 42.4, lng: 11.2, tolerance: 2.0 },
        { lat: 41.9, lng: 12.5, tolerance: 2.0 },
        { lat: 40.8, lng: 14.3, tolerance: 2.0 },

        // Spanish coast
        { lat: 43.4, lng: 3.2, tolerance: 2.0 },
        { lat: 42.0, lng: 2.5, tolerance: 2.0 },
        { lat: 40.8, lng: 0.8, tolerance: 2.0 },
        { lat: 39.5, lng: 0.2, tolerance: 2.0 },
        { lat: 38.0, lng: -0.5, tolerance: 2.0 },

        // French coast
        { lat: 43.7, lng: 7.3, tolerance: 2.0 },
        { lat: 43.5, lng: 6.9, tolerance: 2.0 },
        { lat: 43.3, lng: 5.4, tolerance: 2.0 },

        // Greek islands
        { lat: 39.6, lng: 19.9, tolerance: 2.0 },
        { lat: 38.4, lng: 20.7, tolerance: 2.0 },
        { lat: 37.7, lng: 21.0, tolerance: 2.0 },
        { lat: 38.0, lng: 23.7, tolerance: 2.0 },
        { lat: 37.4, lng: 25.4, tolerance: 2.0 },
        { lat: 35.5, lng: 24.0, tolerance: 2.0 },
        { lat: 35.3, lng: 25.1, tolerance: 2.0 },
        { lat: 35.2, lng: 26.1, tolerance: 2.0 },

        // North African coast
        { lat: 37.0, lng: 10.2, tolerance: 2.0 },
        { lat: 36.8, lng: 10.3, tolerance: 2.0 },
        { lat: 36.4, lng: 2.4, tolerance: 2.0 },
        { lat: 35.7, lng: -0.6, tolerance: 2.0 },
        { lat: 32.3, lng: 22.6, tolerance: 2.0 },
        { lat: 31.2, lng: 29.9, tolerance: 2.0 },

        // Turkey and Cyprus
        { lat: 36.2, lng: 29.6, tolerance: 2.0 },
        { lat: 36.5, lng: 31.0, tolerance: 2.0 },
        { lat: 35.2, lng: 33.4, tolerance: 1.5 },
        { lat: 34.7, lng: 32.4, tolerance: 1.5 },
      ],
    },
    // Atlantic Ocean
    {
      name: "Atlantic",
      bounds: { north: 70, south: -60, east: 20, west: -80 },
      coastlines: [
        // Western Europe
        { lat: 48.4, lng: -4.5, tolerance: 3.0 },
        { lat: 47.3, lng: -2.8, tolerance: 3.0 },
        { lat: 46.2, lng: -1.2, tolerance: 3.0 },
        { lat: 43.5, lng: -1.5, tolerance: 3.0 },
        { lat: 42.4, lng: -8.8, tolerance: 3.0 },
        { lat: 41.1, lng: -8.7, tolerance: 3.0 },
        { lat: 39.4, lng: -9.4, tolerance: 3.0 },
        { lat: 37.0, lng: -8.9, tolerance: 3.0 },

        // UK and Ireland
        { lat: 58.6, lng: -3.1, tolerance: 4.0 },
        { lat: 56.0, lng: -5.1, tolerance: 4.0 },
        { lat: 55.9, lng: -3.2, tolerance: 3.0 },
        { lat: 54.6, lng: -1.6, tolerance: 3.0 },
        { lat: 53.4, lng: -3.0, tolerance: 3.0 },
        { lat: 51.5, lng: 0.1, tolerance: 3.0 },
        { lat: 50.8, lng: -1.1, tolerance: 3.0 },
        { lat: 53.3, lng: -6.3, tolerance: 3.0 },
        { lat: 51.9, lng: -8.5, tolerance: 3.0 },

        // North American East Coast
        { lat: 47.6, lng: -52.7, tolerance: 4.0 },
        { lat: 44.6, lng: -63.6, tolerance: 3.0 },
        { lat: 42.4, lng: -71.0, tolerance: 3.0 },
        { lat: 40.7, lng: -74.0, tolerance: 3.0 },
        { lat: 39.3, lng: -76.6, tolerance: 3.0 },
        { lat: 36.8, lng: -76.3, tolerance: 3.0 },
        { lat: 32.8, lng: -79.9, tolerance: 3.0 },
        { lat: 25.8, lng: -80.2, tolerance: 3.0 },
      ],
    },
  ];

  // Find the relevant region
  const region = coastlineRegions.find(
    (r) =>
      lat >= r.bounds.south &&
      lat <= r.bounds.north &&
      lng >= r.bounds.west &&
      lng <= r.bounds.east,
  );

  if (!region) {
    // For unknown regions, use conservative land mass check
    const majorLandmasses = [
      { lat: 40.0, lng: 0.0, tolerance: 20.0 }, // Europe
      { lat: 35.0, lng: 15.0, tolerance: 15.0 }, // Mediterranean
      { lat: 30.0, lng: 0.0, tolerance: 20.0 }, // North Africa
      { lat: 45.0, lng: 10.0, tolerance: 15.0 }, // Northern Italy/Alps
      { lat: 38.0, lng: 20.0, tolerance: 12.0 }, // Greece/Balkans
      { lat: 36.0, lng: 28.0, tolerance: 12.0 }, // Turkey/Cyprus
    ];

    for (const landmass of majorLandmasses) {
      const distance = calculateDistance(lat, lng, landmass.lat, landmass.lng);
      const distanceKm = distance * 1.852;
      if (distanceKm < landmass.tolerance) {
        return false; // Too close to major landmass
      }
    }
    return true; // Assume offshore if not near known landmasses
  }

  // Check distance to all known coastline points in the region
  for (const coastPoint of region.coastlines) {
    const distance = calculateDistance(
      lat,
      lng,
      coastPoint.lat,
      coastPoint.lng,
    );
    const distanceKm = distance * 1.852; // Convert NM to KM

    if (distanceKm < coastPoint.tolerance + minDistanceKm) {
      return false; // Too close to coastline
    }
  }

  return true; // Safely offshore
}

/**
 * Enhanced shipwreck database with known fishing hotspots
 */
interface Shipwreck {
  name: string;
  lat: number;
  lng: number;
  depth: number;
  type: string;
  fishingQuality: "excellent" | "good" | "fair";
}

const KNOWN_SHIPWRECKS: Shipwreck[] = [
  // Mediterranean shipwrecks
  {
    name: "HMS Maori Wreck",
    lat: 35.8833,
    lng: 14.5167,
    depth: 16,
    type: "WWII Destroyer",
    fishingQuality: "excellent",
  },
  {
    name: "Um El Faroud Wreck",
    lat: 35.8167,
    lng: 14.4333,
    depth: 36,
    type: "Oil Tanker",
    fishingQuality: "excellent",
  },
  {
    name: "P29 Patrol Boat",
    lat: 35.9167,
    lng: 14.3833,
    depth: 35,
    type: "Patrol Vessel",
    fishingQuality: "good",
  },
  {
    name: "Rozi Wreck",
    lat: 35.9333,
    lng: 14.3667,
    depth: 36,
    type: "Tugboat",
    fishingQuality: "good",
  },
  {
    name: "Imperial Eagle Wreck",
    lat: 35.85,
    lng: 14.4667,
    depth: 42,
    type: "Ferry",
    fishingQuality: "excellent",
  },
  // Add more shipwrecks for other regions as needed
];

/**
 * Find shipwrecks within radius of a location
 */
function findNearbyShipwrecks(
  centerLat: number,
  centerLng: number,
  radiusNM: number,
): Shipwreck[] {
  return KNOWN_SHIPWRECKS.filter((wreck) => {
    const distance = calculateDistance(
      centerLat,
      centerLng,
      wreck.lat,
      wreck.lng,
    );
    return distance <= radiusNM;
  });
}

/**
 * Enhanced topographic analysis for fishing locations
 */
interface TopographicFeature {
  type:
    | "seamount"
    | "ridge"
    | "drop-off"
    | "plateau"
    | "canyon"
    | "reef"
    | "bank";
  description: string;
  fishingPotential: number; // 0-1 score
}

function analyzeTopography(
  lat: number,
  lng: number,
  depth: number,
): TopographicFeature[] {
  const features: TopographicFeature[] = [];

  // Simulate topographic analysis based on depth and location
  if (depth > 100) {
    features.push({
      type: "drop-off",
      description: "Deep water drop-off zone",
      fishingPotential: 0.9,
    });
  }

  if (depth >= 30 && depth <= 80) {
    features.push({
      type: "plateau",
      description: "Underwater plateau formation",
      fishingPotential: 0.8,
    });
  }

  if (depth < 50) {
    features.push({
      type: "bank",
      description: "Shallow fishing bank",
      fishingPotential: 0.85,
    });
  }

  // Add ridge features based on coordinates (simplified)
  const ridgeSeed = Math.sin(lat * 100) * Math.cos(lng * 100);
  if (ridgeSeed > 0.6) {
    features.push({
      type: "ridge",
      description: "Underwater ridge system",
      fishingPotential: 0.9,
    });
  }

  return features;
}

/**
 * Main function to generate enhanced offshore fishing locations
 */
export async function generateEnhancedOffshoreFishingLocations(
  centerLat: number,
  centerLng: number,
  radiusNM: number,
  targetCount: number = 18,
): Promise<{
  locations: Array<{
    name: string;
    coordinates: { lat: number; lng: number };
    distance: number;
    depth: string;
    actualDepth: number;
    seabedType: string;
    structures: string[];
    probabilityScore: number;
    description: string;
    aiAnalysis?: string;
    topographicFeatures?: string[];
    isShipwreck?: boolean;
    shipwreckInfo?: {
      name: string;
      type: string;
      fishingQuality: string;
    };
  }>;
  debugInfo: {
    totalGenerated: number;
    filteredOut: number;
    shipwrecksFound: number;
    averageDistance: number;
    depthRange: { min: number; max: number };
  };
}> {
  log(
    `🎣 Generating ${targetCount} enhanced offshore fishing locations within ${radiusNM}NM`,
  );

  const locations = [];
  const filteredOut = [];
  let attempts = 0;
  const maxAttempts = targetCount * 5; // Allow more attempts for better coverage

  // Find nearby shipwrecks first
  const nearbyShipwrecks = findNearbyShipwrecks(centerLat, centerLng, radiusNM);
  log(`🚢 Found ${nearbyShipwrecks.length} shipwrecks in area`);

  // Add shipwreck locations first (they're guaranteed good fishing spots)
  for (const wreck of nearbyShipwrecks) {
    const distance = calculateDistance(
      centerLat,
      centerLng,
      wreck.lat,
      wreck.lng,
    );

    // Ensure shipwreck is offshore
    if (isLocationOffshore(wreck.lat, wreck.lng, 2.0)) {
      const topographicFeatures = analyzeTopography(
        wreck.lat,
        wreck.lng,
        wreck.depth,
      );

      locations.push({
        name: `${wreck.name} Fishing Ground`,
        coordinates: { lat: wreck.lat, lng: wreck.lng },
        distance: parseFloat(distance.toFixed(1)),
        depth: `${Math.max(10, wreck.depth - 5)}-${wreck.depth + 10}m`,
        actualDepth: wreck.depth,
        seabedType: "artificial reef (shipwreck)",
        structures: ["shipwreck", "artificial reef", "structure"],
        probabilityScore:
          wreck.fishingQuality === "excellent"
            ? 0.95
            : wreck.fishingQuality === "good"
              ? 0.88
              : 0.75,
        description: `Historic ${wreck.type.toLowerCase()} wreck site creating excellent artificial reef habitat for diverse marine life.`,
        topographicFeatures: topographicFeatures.map((f) => f.description),
        isShipwreck: true,
        shipwreckInfo: {
          name: wreck.name,
          type: wreck.type,
          fishingQuality: wreck.fishingQuality,
        },
      });
    }
  }

  // Generate additional natural fishing locations
  const naturalLocationsNeeded = targetCount - locations.length;

  const locationNames = [
    "Deep Blue Ridge",
    "Neptune's Drop",
    "Coral Gardens",
    "The Abyss",
    "Seamount Peak",
    "Canyon Edge",
    "Reef Plateau",
    "Drop-off Point",
    "Deep Channel",
    "Rocky Outcrop",
    "Underwater Mesa",
    "Marine Shelf",
    "Fishing Banks",
    "Deep Structure",
    "Continental Slope",
    "Tuna Alley",
    "Marlin Point",
    "Grouper Grounds",
    "Pelagic Zone",
    "Blue Water Banks",
    "Deep Sea Ridge",
    "Ocean Plateau",
    "Fishing Paradise",
    "Deep Water Haven",
    "Marine Sanctuary",
  ];

  const seabedTypes = [
    "rocky reef with sand patches",
    "mixed bottom with coral formations",
    "deep water drop-off",
    "underwater seamount",
    "continental shelf edge",
    "rocky outcrop with caves",
    "sandy bottom with structure",
    "coral reef system",
    "underwater ridge formation",
    "deep channel with current",
  ];

  const structureTypes = [
    ["reef", "coral formations", "fish aggregation"],
    ["drop-off", "deep water", "pelagic zone"],
    ["seamount", "rocky outcrops", "pinnacle"],
    ["ridge", "underwater peaks", "structure"],
    ["plateau", "flat seabed", "feeding ground"],
    ["canyon", "deep channels", "current flow"],
    ["bank", "shallow rise", "feeding area"],
    ["ledge", "underwater cliff", "ambush point"],
  ];

  while (locations.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // Generate location using improved algorithm
    const angle = (attempts * 137.5) % 360; // Golden angle for better distribution
    const normalizedRadius = Math.sqrt(Math.random()); // Better radial distribution
    const distance = radiusNM * 0.3 + normalizedRadius * radiusNM * 0.65; // 30% to 95% of radius

    // Convert to coordinates
    const angleRad = (angle * Math.PI) / 180;
    const distanceRad = distance / 60;

    const lat = centerLat + distanceRad * Math.cos(angleRad);
    const lng =
      centerLng +
      (distanceRad * Math.sin(angleRad)) /
        Math.cos((centerLat * Math.PI) / 180);

    // Validate location is offshore
    if (!isLocationOffshore(lat, lng, 3.0)) {
      filteredOut.push({ lat, lng, reason: "too close to shore" });
      continue;
    }

    // Ensure location is within radius (double-check)
    const actualDistance = calculateDistance(centerLat, centerLng, lat, lng);
    if (actualDistance > radiusNM) {
      filteredOut.push({ lat, lng, reason: "outside radius" });
      continue;
    }

    // Generate realistic depth based on distance from shore
    const baseDepth = 25 + actualDistance * 8 + Math.random() * 40;
    const actualDepth = Math.round(Math.max(20, Math.min(200, baseDepth)));
    const depthVariation = Math.round(actualDepth * 0.2);
    const minDepth = Math.max(15, actualDepth - depthVariation);
    const maxDepth = actualDepth + depthVariation;

    // Analyze topography
    const topographicFeatures = analyzeTopography(lat, lng, actualDepth);
    const avgFishingPotential =
      topographicFeatures.reduce((sum, f) => sum + f.fishingPotential, 0) /
      topographicFeatures.length;

    // Select seabed type and structures based on depth and features
    const seabedIndex = Math.floor((lat * lng * 1000) % seabedTypes.length);
    const structureIndex = Math.floor(
      (lat * lng * 1500) % structureTypes.length,
    );

    // Calculate probability score
    let probabilityScore = 0.7 + avgFishingPotential * 0.2;

    // Bonus for optimal depth range
    if (actualDepth >= 40 && actualDepth <= 120) probabilityScore += 0.1;

    // Bonus for good distance from shore
    if (actualDistance >= radiusNM * 0.4 && actualDistance <= radiusNM * 0.8)
      probabilityScore += 0.05;

    // Ensure score is within bounds
    probabilityScore = Math.min(0.92, Math.max(0.65, probabilityScore));

    const locationIndex = locations.length % locationNames.length;

    locations.push({
      name: locationNames[locationIndex],
      coordinates: {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
      },
      distance: parseFloat(actualDistance.toFixed(1)),
      depth: `${minDepth}-${maxDepth}m`,
      actualDepth,
      seabedType: seabedTypes[seabedIndex],
      structures: structureTypes[structureIndex],
      probabilityScore: parseFloat(probabilityScore.toFixed(2)),
      description: generateLocationDescription(
        seabedTypes[seabedIndex],
        actualDepth,
        topographicFeatures,
      ),
      topographicFeatures: topographicFeatures.map((f) => f.description),
      isShipwreck: false,
    });
  }

  // Sort by probability score and distance
  locations.sort((a, b) => {
    const scoreDiff = b.probabilityScore - a.probabilityScore;
    if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
    return a.distance - b.distance;
  });

  // Calculate debug info
  const distances = locations.map((l) => l.distance);
  const depths = locations.map((l) => l.actualDepth);

  const debugInfo = {
    totalGenerated: locations.length,
    filteredOut: filteredOut.length,
    shipwrecksFound: nearbyShipwrecks.length,
    averageDistance: parseFloat(
      (distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(1),
    ),
    depthRange: {
      min: Math.min(...depths),
      max: Math.max(...depths),
    },
  };

  log(`✅ Generated ${locations.length} offshore fishing locations`);
  log(`📊 Debug info:`, debugInfo);

  return { locations, debugInfo };
}

function generateLocationDescription(
  seabedType: string,
  depth: number,
  topographicFeatures: TopographicFeature[],
): string {
  let description = `${seabedType.charAt(0).toUpperCase() + seabedType.slice(1)} fishing area`;

  if (depth > 80) {
    description +=
      " in deep waters, excellent for pelagic species like tuna and marlin";
  } else if (depth > 40) {
    description +=
      " in mid-depth waters, ideal for grouper, snapper, and reef fish";
  } else {
    description +=
      " in productive shallow waters, perfect for a variety of coastal species";
  }

  if (topographicFeatures.length > 0) {
    const bestFeature = topographicFeatures.reduce((best, current) =>
      current.fishingPotential > best.fishingPotential ? current : best,
    );
    description += `. Features ${bestFeature.description.toLowerCase()} that attracts and concentrates fish.`;
  }

  return description;
}

/**
 * Simple cache implementation
 */
export function cacheApiResponse(
  key: string,
  data: any,
  ttlMs: number = 3600000,
): void {
  try {
    const cacheItem = {
      data,
      expiry: Date.now() + ttlMs,
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error("Error caching API response:", error);
  }
}

export function getCachedApiResponse(key: string): any {
  try {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;

    const { data, expiry } = JSON.parse(cachedItem);

    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error retrieving cached API response:", error);
    return null;
  }
}

export function clearOffshoreFishingCache(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes("offshore_fishing_")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    log(`Cleared ${keysToRemove.length} offshore fishing cache entries`);
  } catch (error) {
    console.error("Error clearing offshore fishing cache:", error);
  }
}

/**
 * Enhanced API request with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 2,
  initialDelay: number = 1000,
): Promise<Response> {
  let lastError: Error;
  let delay = initialDelay;

  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429 || response.status >= 500) {
        if (retryCount === maxRetries) {
          return response;
        }
        await sleep(delay);
        delay *= 2;
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (retryCount === maxRetries) {
        throw lastError;
      }
      await sleep(delay);
      delay *= 2;
    }
  }

  throw lastError!;
}
