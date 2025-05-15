import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Navigation,
  Layers,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import BottomNav from "./BottomNav";
import { getFishImageUrl, getLocalFishName } from "@/lib/fishbase-api";
import FishCard from "./FishCard";
import FishCardWithLocalName from "@/components/FishCardWithLocalName";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import LoadingDots from "./LoadingDots";
// @ts-ignore - Fixing import issue
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  LayersControl,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface Fish {
  id: string;
  name: string;
  scientificName?: string;
  localName?: string;

  image: string;
  habitat: string;
  difficulty: "Easy" | "Intermediate" | "Advanced" | "Expert";
  season: string;
  toxic: boolean;
  fromBroaderRegion?: boolean;
}

interface HomePageProps {
  location?: string;
  onLocationChange?: (location: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  location = "San Francisco Bay",
  onLocationChange = () => {},
}) => {
  const navigate = useNavigate();
  const [fish, setFish] = useState<Fish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: number } | null>(
    null,
  );
  const [apiStatus, setApiStatus] = useState<{
    connected: boolean;
    model: string;
  }>({ connected: false, model: "" });
  const [currentMonth] = useState(
    new Date().toLocaleString("default", { month: "long" }),
  );
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<
    [number, number] | null
  >(null);
  const [locationName, setLocationName] = useState("");
  const [userCoordinates, setUserCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Get stored location coordinates from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        if (parsedLocation && (parsedLocation.latitude || parsedLocation.lat)) {
          setUserCoordinates({
            lat: parsedLocation.latitude || parsedLocation.lat,
            lng: parsedLocation.longitude || parsedLocation.lng,
          });
        }
      } catch (err) {
        console.error("Error parsing user location:", err);
      }
    }
  }, []);

  // Store fish data in localStorage to avoid unnecessary API calls
  const cacheKey = `fish_data_${location}_${currentMonth}`;

  // Function to clear all fish data cache
  const clearFishDataCache = () => {
    console.log("Clearing all fish data cache");
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("fish_data_")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      console.log("Removing cached data for key:", key);
      localStorage.removeItem(key);
    });

    return keysToRemove.length; // Return number of cache entries cleared
  };

  // Reset fish data when location changes or language preference changes
  useEffect(() => {
    // Include preferred language in the cache key to ensure we refresh when language changes
    const preferredLanguage = localStorage.getItem("preferredLanguage");
    const languageAwareCacheKey = `${cacheKey}_${preferredLanguage || "default"}`;
    console.log("Checking for cached data with key:", languageAwareCacheKey);

    // Check if we have cached data for this location, month, and language
    const cachedData = localStorage.getItem(languageAwareCacheKey);

    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        setFish(parsedData);
        setLoading(false);
        setError(null);
        console.log(
          "Using cached fish data for",
          location,
          currentMonth,
          "with language:",
          preferredLanguage || "default",
        );
      } catch (err) {
        // If there's an error parsing the cached data, reset and fetch fresh data
        console.error("Error parsing cached fish data:", err);
        setFish([]);
        setLoading(true);
        setError(null);
      }
    } else {
      // No cached data, reset and fetch fresh data
      console.log("No cached data found, will fetch fresh data");
      setFish([]);
      setLoading(true);
      setError(null);
    }
  }, [location, cacheKey]);

  // Listen for changes to the preferred language
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log(
        "Language change detected, clearing cache and refreshing data",
      );
      // Use the clearFishDataCache function to clear all fish cache entries
      const entriesCleared = clearFishDataCache();
      console.log(
        `Cleared ${entriesCleared} cache entries due to language change`,
      );

      // Force refresh of fish data
      setFish([]);
      setLoading(true);
      setError(null);
    };

    // Add event listener for language changes
    window.addEventListener("languageChanged", handleLanguageChange);

    // Clean up
    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    // Fetch fish data from OpenAI based on location and month
    const fetchFishData = async () => {
      // Check if we already have cached data
      const preferredLanguage = localStorage.getItem("preferredLanguage");
      const languageAwareCacheKey = `${cacheKey}_${preferredLanguage || "default"}`;
      const cachedData = localStorage.getItem(languageAwareCacheKey);

      // If we have valid cached data, don't make the API call
      if (cachedData && !loading) {
        console.log("Using existing cached data, skipping API call");
        return;
      }

      setLoading(true);
      setError(null);
      if (!cachedData) {
        setFish([]);
      }

      try {
        // Check if API key is available
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        console.log("API Key available:", !!apiKey);
        if (!apiKey) {
          throw {
            message:
              "OpenAI API key is missing. Please add it in project settings.",
            code: 401,
          };
        }

        // Make actual OpenAI API call
        console.log("Fetching fish data for:", location, currentMonth);
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a fishing expert AI that provides information about fish species in specific locations.",
                },
                {
                  role: "user",
                  content: `List 16 fish species that are ONLY native to or commonly found in ${location} waters and can be caught during ${currentMonth}. Do NOT include any fish species that are not actually found in this specific location. For each fish, provide: name, scientific name, habitat, difficulty level (Easy, Intermediate, Advanced, or Expert), season availability, and whether it's toxic (true only if the fish is actually toxic/poisonous to eat, otherwise false). 

Format as JSON with a 'fish' array containing objects with these properties.`,
                },
              ],
              response_format: { type: "json_object" },
            }),
          },
        );
        console.log("API response status:", response.status);

        if (!response.ok) {
          const errorCodes = {
            400: "Bad request - Check your query parameters",
            401: "Unauthorized - Invalid API key",
            403: "Forbidden - You don't have access to this resource",
            404: "Not found - The requested resource doesn't exist",
            429: "Too many requests - Rate limit exceeded",
            500: "Server error - Something went wrong on OpenAI's end",
            502: "Bad gateway - OpenAI is down or being upgraded",
            503: "Service unavailable - OpenAI is overloaded or down for maintenance",
            504: "Gateway timeout - The request took too long to process",
          };

          const errorMessage =
            errorCodes[response.status] ||
            `OpenAI API error: ${response.status}`;
          throw { message: errorMessage, code: response.status };
        }

        const data = await response.json();
        console.log("API response data:", data);

        // Update API status
        // No language detection needed

        setApiStatus({
          connected: true,
          model: data.model || "gpt-3.5-turbo",
        });

        let fishData;
        try {
          const parsedContent = JSON.parse(data.choices[0].message.content);
          console.log("Parsed content:", parsedContent);
          fishData = parsedContent.fish || [];

          if (!Array.isArray(fishData)) {
            console.error("Fish data is not an array:", fishData);
            throw { message: "Invalid fish data format", code: 422 };
          }

          if (fishData.length === 0) {
            throw {
              message: "No fish data returned for this location and season",
              code: 204,
            };
          }
        } catch (parseError) {
          console.error(
            "Error parsing fish data:",
            parseError,
            data.choices[0].message.content,
          );
          throw {
            message: "Failed to parse fish data from API response",
            code: 422,
          };
        }

        // Map the OpenAI response to our Fish interface
        const fishWithImages: Fish[] = fishData.map(
          (fish: any, index: number) => {
            const scientificName =
              fish.scientificName || fish.scientific_name || "";

            return {
              id: String(index + 1),
              name: fish.name,
              scientificName: scientificName,
              // Use our utility function to get the image URL
              image: getFishImageUrl(fish.name, scientificName),
              habitat: fish.habitat,
              difficulty: fish.difficulty,
              season: fish.season,
              toxic: fish.toxic === true, // Explicitly check for true to fix toxic fish issue
              localName: null, // Will be populated later
            };
          },
        );

        // Get country code from user location
        const userLocationData = localStorage.getItem("userLocation");
        let countryCode = "es"; // Default to Spanish for testing
        if (userLocationData) {
          try {
            const parsedLocation = JSON.parse(userLocationData);
            countryCode = parsedLocation.countryCode || "es";
            console.log("Found country code in user location:", countryCode);
          } catch (err) {
            console.error("Error parsing user location:", err);
          }
        }
        console.log("Using country code for local names:", countryCode);

        // Skip fetching local names
        console.log("Skipping local name translations");
        setFish(fishWithImages);

        setLoading(false);

        // Cache the fish data for this location, month, and language
        try {
          const preferredLanguage = localStorage.getItem("preferredLanguage");
          const languageAwareCacheKey = `${cacheKey}_${preferredLanguage || "default"}`;
          localStorage.setItem(
            languageAwareCacheKey,
            JSON.stringify(fishWithImages),
          );
          console.log(
            "Cached fish data for",
            location,
            currentMonth,
            "with language:",
            preferredLanguage || "default",
          );
        } catch (err) {
          console.error("Error caching fish data:", err);
        }
      } catch (err) {
        console.error("Error fetching fish data:", err);
        setError({
          message: err.message || "Failed to fetch fish data",
          code: err.code || 500,
        });
        setLoading(false);
      }
    };

    // Only fetch data if we don't have cached data
    const preferredLanguage = localStorage.getItem("preferredLanguage");
    const languageAwareCacheKey = `${cacheKey}_${preferredLanguage || "default"}`;
    const cachedData = localStorage.getItem(languageAwareCacheKey);

    if (!cachedData) {
      console.log("No cached data found, fetching from API");
      fetchFishData();
    } else {
      console.log("Using cached data, no need to fetch from API");
    }
  }, [location, currentMonth, cacheKey]);

  const handleLoadMore = () => {
    // Set loading state but don't reset fish data
    setLoading(true);
    setError(null);

    // Fetch more fish data from OpenAI
    const fetchMoreFish = async () => {
      try {
        // Check if API key is available
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        console.log("API Key available for load more:", !!apiKey);
        if (!apiKey) {
          throw {
            message:
              "OpenAI API key is missing. Please add it in project settings.",
            code: 401,
          };
        }

        // Get current fish names to avoid duplicates
        const existingFishNames = fish.map((f) => f.name.toLowerCase());

        console.log("Fetching more fish data for:", location, currentMonth);
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a fishing expert AI that provides information about fish species in specific locations.",
                },
                {
                  role: "user",
                  content: `List EXACTLY 10 more uncommon fish species that are ONLY native to or commonly found in ${location} waters and can be caught during ${currentMonth} that are different from what I might have already seen. Do NOT include any fish species that are not actually found in this specific location. IMPORTANT: Do NOT include any of these fish species that I've already seen: ${existingFishNames.join(", ")}. For each fish, provide: name, scientific name, habitat, difficulty level (Easy, Intermediate, Advanced, or Expert), season availability, and whether it's toxic (true only if the fish is actually toxic/poisonous to eat, otherwise false). 

Format as JSON with a 'fish' array containing objects with these properties.`,
                },
              ],
              response_format: { type: "json_object" },
            }),
          },
        );
        console.log("More fish API response status:", response.status);

        if (!response.ok) {
          const errorCodes = {
            400: "Bad request - Check your query parameters",
            401: "Unauthorized - Invalid API key",
            403: "Forbidden - You don't have access to this resource",
            404: "Not found - The requested resource doesn't exist",
            429: "Too many requests - Rate limit exceeded",
            500: "Server error - Something went wrong on OpenAI's end",
            502: "Bad gateway - OpenAI is down or being upgraded",
            503: "Service unavailable - OpenAI is overloaded or down for maintenance",
            504: "Gateway timeout - The request took too long to process",
          };

          const errorMessage =
            errorCodes[response.status] ||
            `OpenAI API error: ${response.status}`;
          throw { message: errorMessage, code: response.status };
        }

        const data = await response.json();
        console.log("More fish API response data:", data);

        let moreFishData;
        try {
          const parsedContent = JSON.parse(data.choices[0].message.content);
          console.log("More fish parsed content:", parsedContent);
          moreFishData = parsedContent.fish || [];
          console.log(
            "Number of additional fish returned:",
            moreFishData.length,
          );

          if (!Array.isArray(moreFishData)) {
            console.error("More fish data is not an array:", moreFishData);
            throw { message: "Invalid more fish data format", code: 422 };
          }

          if (moreFishData.length === 0) {
            console.log(
              "No additional local fish found, will try broader sea region",
            );
            // Instead of throwing an error, we'll try to get fish from the broader sea region
            return { noLocalFish: true };
          }
        } catch (parseError) {
          console.error(
            "Error parsing more fish data:",
            parseError,
            data.choices[0].message.content,
          );
          throw {
            message: "Failed to parse additional fish data from API response",
            code: 422,
          };
        }

        // Check if we need to fetch from broader sea region instead
        if (moreFishData.length === 0) {
          return { noLocalFish: true };
        }

        // Map the OpenAI response to our Fish interface and filter out any duplicates
        const additionalFish: Fish[] = moreFishData
          .filter((fishItem: any) => {
            // Filter out any fish that already exist in our list
            return !existingFishNames.includes(fishItem.name.toLowerCase());
          })
          .map((fishItem: any, index: number) => {
            const scientificName =
              fishItem.scientificName || fishItem.scientific_name || "";

            return {
              id: String(fish.length + index + 1),
              name: fishItem.name,
              scientificName: scientificName,
              // Use our utility function to get the image URL
              image: getFishImageUrl(fishItem.name, scientificName),
              habitat: fishItem.habitat,
              difficulty: fishItem.difficulty,
              season: fishItem.season,
              toxic: fishItem.toxic === true, // Explicitly check for true to fix toxic fish issue
              localName: null, // Will be populated later
            };
          });

        console.log(
          `Filtered out ${moreFishData.length - additionalFish.length} duplicate fish`,
        );

        // Get country code from user location
        const userLocationData = localStorage.getItem("userLocation");
        let countryCode = "es"; // Default to Spanish for testing
        if (userLocationData) {
          try {
            const parsedLocation = JSON.parse(userLocationData);
            countryCode = parsedLocation.countryCode || "es";
            console.log("Found country code in user location:", countryCode);
          } catch (err) {
            console.error("Error parsing user location:", err);
          }
        }
        console.log("Using country code for local names:", countryCode);

        // Always fetch local names for additional fish
        // This ensures translations are shown even if country code is missing
        console.log(
          "Fetching local fish names for additional fish with country code:",
          countryCode,
        );

        // Get preferred language from localStorage
        const preferredLanguage = localStorage.getItem("preferredLanguage");
        console.log(
          "Current preferred language for additional fish translations:",
          preferredLanguage || "Not set, using country code",
        );

        // Create an array of promises for fetching local names
        const localNamePromises = additionalFish.map(async (fishItem) => {
          if (fishItem.scientificName) {
            try {
              console.log(
                `Fetching local name for additional fish ${fishItem.name} with scientific name ${fishItem.scientificName}`,
              );
              // Get preferred language from localStorage
              const preferredLanguage =
                localStorage.getItem("preferredLanguage") || countryCode;
              console.log(
                `Using language code for additional fish translation: ${preferredLanguage}`,
              );

              const localName = await getLocalFishName(
                fishItem.scientificName,
                preferredLanguage, // Use preferred language instead of countryCode
              );
              console.log(
                `Result for additional fish ${fishItem.name}: ${localName || "No translation found"}`,
              );
              if (localName) {
                console.log(
                  `Found local name for ${fishItem.name}: ${localName}`,
                );
                return { ...fishItem, localName };
              }
            } catch (error) {
              console.error(
                `Error getting local name for additional fish ${fishItem.name}:`,
                error,
              );
            }
          } else {
            console.log(
              `No scientific name for additional fish ${fishItem.name}, skipping translation`,
            );
          }
          return fishItem;
        });

        // Wait for all local name requests to complete
        const fishWithLocalNames = await Promise.all(localNamePromises);
        const updatedFishList = [...fish, ...fishWithLocalNames];
        setFish(updatedFishList);
        setLoading(false);

        // If we got less than 10 new fish, set a flag to indicate we might be running out of local fish
        if (fishWithLocalNames.length < 10) {
          console.log(
            `Got fewer fish than expected (${fishWithLocalNames.length}/10), might be running out of local fish`,
          );
        }

        // Update the cached fish data with the new fish
        try {
          const preferredLanguage = localStorage.getItem("preferredLanguage");
          const languageAwareCacheKey = `${cacheKey}_${preferredLanguage || "default"}`;
          localStorage.setItem(
            languageAwareCacheKey,
            JSON.stringify(updatedFishList),
          );
          console.log(
            "Updated cached fish data for",
            location,
            currentMonth,
            "with language:",
            preferredLanguage || "default",
          );
        } catch (err) {
          console.error("Error updating cached fish data:", err);
        }
      } catch (err) {
        console.error("Error fetching more fish data:", err);

        // Check if this is our special case for no more local fish
        if (err.noLocalFish) {
          console.log(
            "No more local fish available, fetching from broader sea region",
          );
          fetchBroaderSeaRegionFish();
          return;
        }

        setError({
          message: err.message || "Failed to fetch additional fish data",
          code: err.code || 500,
        });
        setLoading(false);
      }
    };

    fetchMoreFish();
  };

  // Function to fetch fish from the broader sea region when no more local fish are available
  const fetchBroaderSeaRegionFish = async () => {
    try {
      // Check if API key is available
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw {
          message:
            "OpenAI API key is missing. Please add it in project settings.",
          code: 401,
        };
      }

      // Determine the broader sea region based on the current location
      let broaderSeaRegion = "";

      // Extract country or region from location
      const locationLower = location.toLowerCase();

      // Map locations to broader sea regions
      if (
        locationLower.includes("malta") ||
        locationLower.includes("italy") ||
        locationLower.includes("greece") ||
        locationLower.includes("spain") ||
        (locationLower.includes("france") &&
          locationLower.includes("mediterranean"))
      ) {
        broaderSeaRegion = "Mediterranean Sea";
      } else if (
        locationLower.includes("atlantic") ||
        locationLower.includes("portugal") ||
        locationLower.includes("ireland") ||
        locationLower.includes("uk") ||
        locationLower.includes("united kingdom")
      ) {
        broaderSeaRegion = "Atlantic Ocean";
      } else if (
        locationLower.includes("pacific") ||
        locationLower.includes("california") ||
        locationLower.includes("oregon") ||
        locationLower.includes("washington")
      ) {
        broaderSeaRegion = "Pacific Ocean";
      } else if (
        locationLower.includes("caribbean") ||
        locationLower.includes("florida") ||
        locationLower.includes("bahamas")
      ) {
        broaderSeaRegion = "Caribbean Sea";
      } else if (
        locationLower.includes("gulf") ||
        locationLower.includes("texas") ||
        locationLower.includes("louisiana")
      ) {
        broaderSeaRegion = "Gulf of Mexico";
      } else if (
        locationLower.includes("indian") ||
        locationLower.includes("india") ||
        (locationLower.includes("australia") && locationLower.includes("west"))
      ) {
        broaderSeaRegion = "Indian Ocean";
      } else if (
        locationLower.includes("baltic") ||
        locationLower.includes("sweden") ||
        locationLower.includes("finland")
      ) {
        broaderSeaRegion = "Baltic Sea";
      } else if (
        locationLower.includes("north sea") ||
        locationLower.includes("norway") ||
        locationLower.includes("denmark")
      ) {
        broaderSeaRegion = "North Sea";
      } else {
        // Default to a generic sea region if we can't determine one
        broaderSeaRegion = "nearby waters";
      }

      // Get current fish names to avoid duplicates
      const existingFishNames = fish.map((f) => f.name.toLowerCase());

      console.log(`Fetching fish from broader region: ${broaderSeaRegion}`);
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a fishing expert AI that provides information about fish species in specific locations.",
              },
              {
                role: "user",
                content: `List EXACTLY 10 interesting fish species that are commonly found in the ${broaderSeaRegion} but might not be specifically found in ${location}. These should be fish that an angler might encounter in the broader region during ${currentMonth}. IMPORTANT: Do NOT include any of these fish species that I've already seen: ${existingFishNames.join(", ")}. For each fish, provide: name, scientific name, habitat, difficulty level (Easy, Intermediate, Advanced, or Expert), season availability, and whether it's toxic (true only if the fish is actually toxic/poisonous to eat, otherwise false). 

Format as JSON with a 'fish' array containing objects with these properties.`,
              },
            ],
            response_format: { type: "json_object" },
          }),
        },
      );

      if (!response.ok) {
        throw {
          message: `OpenAI API error: ${response.status}`,
          code: response.status,
        };
      }

      const data = await response.json();
      console.log("Broader sea region fish API response data:", data);

      let broaderSeaFishData;
      try {
        const parsedContent = JSON.parse(data.choices[0].message.content);
        console.log("Broader sea region fish parsed content:", parsedContent);
        broaderSeaFishData = parsedContent.fish || [];

        if (!Array.isArray(broaderSeaFishData)) {
          throw {
            message: "Invalid broader sea region fish data format",
            code: 422,
          };
        }

        if (broaderSeaFishData.length === 0) {
          throw {
            message: "No fish data returned for the broader sea region",
            code: 204,
          };
        }

        // Map the OpenAI response to our Fish interface and filter out any duplicates
        const additionalFish: Fish[] = broaderSeaFishData
          .filter((fishItem: any) => {
            // Filter out any fish that already exist in our list
            return !existingFishNames.includes(fishItem.name.toLowerCase());
          })
          .map((fishItem: any, index: number) => {
            const scientificName =
              fishItem.scientificName || fishItem.scientific_name || "";

            return {
              id: String(fish.length + index + 1),
              name: fishItem.name,
              scientificName: scientificName,
              image: getFishImageUrl(fishItem.name, scientificName),
              habitat: fishItem.habitat,
              difficulty: fishItem.difficulty,
              season: fishItem.season,
              toxic: fishItem.toxic === true,
              localName: null,
              fromBroaderRegion: true, // Mark these fish as from the broader region
            };
          });

        console.log(
          `Found ${additionalFish.length} fish from the broader sea region`,
        );

        // Get preferred language from localStorage
        const preferredLanguage = localStorage.getItem("preferredLanguage");
        const userLocationData = localStorage.getItem("userLocation");
        let countryCode = "es"; // Default to Spanish for testing
        if (userLocationData) {
          try {
            const parsedLocation = JSON.parse(userLocationData);
            countryCode = parsedLocation.countryCode || "es";
          } catch (err) {
            console.error("Error parsing user location:", err);
          }
        }

        // Create an array of promises for fetching local names
        const localNamePromises = additionalFish.map(async (fishItem) => {
          if (fishItem.scientificName) {
            try {
              const preferredLanguage =
                localStorage.getItem("preferredLanguage") || countryCode;
              const localName = await getLocalFishName(
                fishItem.scientificName,
                preferredLanguage,
              );
              if (localName) {
                return { ...fishItem, localName };
              }
            } catch (error) {
              console.error(
                `Error getting local name for fish ${fishItem.name}:`,
                error,
              );
            }
          }
          return fishItem;
        });

        // Wait for all local name requests to complete
        const fishWithLocalNames = await Promise.all(localNamePromises);

        // Set a flag to indicate these fish are from the broader region
        // and store the broader sea region name
        localStorage.setItem("broaderSeaRegion", broaderSeaRegion);

        // Add the broader sea region fish to the existing list
        const updatedFishList = [...fish, ...fishWithLocalNames];
        setFish(updatedFishList);
        setLoading(false);

        // Update the cached fish data with the new fish
        try {
          const preferredLanguage = localStorage.getItem("preferredLanguage");
          const languageAwareCacheKey = `${cacheKey}_${preferredLanguage || "default"}`;
          localStorage.setItem(
            languageAwareCacheKey,
            JSON.stringify(updatedFishList),
          );
        } catch (err) {
          console.error("Error updating cached fish data:", err);
        }
      } catch (parseError) {
        console.error(
          "Error parsing broader sea region fish data:",
          parseError,
        );
        throw {
          message:
            "Failed to parse broader sea region fish data from API response",
          code: 422,
        };
      }
    } catch (err) {
      console.error("Error fetching broader sea region fish data:", err);
      setError({
        message: err.message || "Failed to fetch broader sea region fish data",
        code: err.code || 500,
      });
      setLoading(false);
    }
  };

  const handleLocationChange = (newLocation: string) => {
    // Only reset if the location actually changed
    if (newLocation !== location) {
      // Reset fish data and API status when location changes
      setFish([]);
      setLoading(true);
      setError(null);
      setApiStatus((prev) => ({ ...prev }));

      onLocationChange(newLocation);
    }

    setMapDialogOpen(false);
  };

  // Fix Leaflet icon issue
  useEffect(() => {
    // Fix Leaflet icon issue without using _getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  const handleMapLocationSelect = (selectedLocation: {
    lat: number;
    lng: number;
    name: string;
    countryCode?: string;
  }) => {
    // Update coordinates in state and localStorage
    setUserCoordinates({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    });

    // Store the full location object in localStorage
    const locationToStore = {
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      name: selectedLocation.name,
      countryCode: selectedLocation.countryCode,
    };
    localStorage.setItem("userLocation", JSON.stringify(locationToStore));

    // Only reset if the location name actually changed
    if (selectedLocation.name !== location) {
      // Reset fish data and API status when location changes
      setFish([]);
      setLoading(true);
      setError(null);
      setApiStatus((prev) => ({ ...prev }));

      onLocationChange(selectedLocation.name);
    }

    setMapDialogOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-card p-4 w-full lg:hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/">
              <img
                src="/logo-dark.svg"
                alt="Fishing AI Logo"
                className="h-7 shrink-0 grow-0 hidden dark:block"
              />
              <img
                src="/logo-light.svg"
                alt="Fishing AI Logo"
                className="h-7 shrink-0 grow-0 dark:hidden"
              />
            </Link>
          </div>
          <img
            src="https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746801732510-image.png"
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <h1 className="font-inter font-bold text-2xl mb-1 dark:text-white">
            What's Biting in {currentMonth}
          </h1>
          <p className="font-inter text-sm text-gray-600 dark:text-gray-300">
            Fish most active in{" "}
            <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-[#0251FB] dark:text-blue-400 underline">
                  {userCoordinates && location.includes(",")
                    ? `${userCoordinates.lat.toFixed(6)}, ${userCoordinates.lng.toFixed(6)}`
                    : location}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] w-[90%] rounded-lg max-h-[80vh] shadow-xl dark:bg-card dark:border-border/30">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">
                    Select Your Location
                  </DialogTitle>
                </DialogHeader>
                <div className="w-full rounded-md overflow-hidden h-[500px]">
                  <MapSelection
                    onLocationSelect={handleMapLocationSelect}
                    currentLocation={
                      userCoordinates
                        ? {
                            lat: userCoordinates.lat,
                            lng: userCoordinates.lng,
                            name: location,
                          }
                        : location
                          ? { lat: 37.7749, lng: -122.4194, name: location }
                          : null
                    }
                  />
                </div>
              </DialogContent>
            </Dialog>
          </p>
        </div>

        {/* API Status Message */}
        {apiStatus.connected && (
          <Alert variant="success" className="mb-4">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle className="dark:text-white">
              Connected to OpenAI
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-1">
                <p className="dark:text-gray-300">
                  Using model: {apiStatus.model}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Fish species found: {fish.length}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 dark:text-red-400" />
            <AlertTitle className="dark:text-white">
              Error {error.code}
            </AlertTitle>
            <AlertDescription className="dark:text-gray-300">
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading Indicator - Only show when there are no fish yet */}
        {loading && fish.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 text-center text-gray-600 dark:text-gray-300">
              <p className="mb-2">Searching for fish in {location}...</p>
              <LoadingDots color="#0251FB" size={6} />
            </div>
          </div>
        )}

        {/* Fish Cards Grid - Always show when there are fish */}
        {fish.length > 0 && (
          <>
            {/* Local fish section */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 px-1">
              {fish
                .filter((fishItem) => !fishItem.fromBroaderRegion)
                .map((fishItem) => (
                  <FishCardWithLocalName
                    key={fishItem.id}
                    name={fishItem.name}
                    scientificName={fishItem.scientificName}
                    localName={undefined}
                    image={fishItem.image}
                    habitat={fishItem.habitat}
                    difficulty={fishItem.difficulty}
                    season={fishItem.season}
                    isToxic={fishItem.toxic}
                    onClick={() => {
                      console.log("Navigating with image:", fishItem.image);
                      navigate(`/fish/${encodeURIComponent(fishItem.name)}`, {
                        state: {
                          image: fishItem.image,
                        },
                      });
                    }}
                  />
                ))}
            </div>

            {/* Broader sea region fish section */}
            {fish.some((fishItem) => fishItem.fromBroaderRegion) && (
              <>
                <div className="mt-8 mb-4">
                  <h2 className="font-['Inter'] font-black text-xl dark:text-white">
                    Also Found in{" "}
                    {localStorage.getItem("broaderSeaRegion") ||
                      "Nearby Waters"}
                  </h2>
                  <p className="font-inter text-sm text-gray-600 dark:text-gray-300">
                    These fish might not be found directly in {location} but can
                    be caught in the broader region
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 px-1">
                  {fish
                    .filter((fishItem) => fishItem.fromBroaderRegion)
                    .map((fishItem) => (
                      <FishCardWithLocalName
                        key={fishItem.id}
                        name={fishItem.name}
                        scientificName={fishItem.scientificName}
                        localName={undefined}
                        image={fishItem.image}
                        habitat={fishItem.habitat}
                        difficulty={fishItem.difficulty}
                        season={fishItem.season}
                        isToxic={fishItem.toxic}
                        onClick={() => {
                          console.log("Navigating with image:", fishItem.image);
                          navigate(
                            `/fish/${encodeURIComponent(fishItem.name)}`,
                            {
                              state: {
                                image: fishItem.image,
                              },
                            },
                          );
                        }}
                      />
                    ))}
                </div>
              </>
            )}
          </>
        )}

        {/* No Results Message */}
        {!loading && fish.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">
              No fish found for this location and season.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {fish.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleLoadMore}
              disabled={loading}
              className="rounded-full bg-[#0251FB] dark:bg-blue-700 hover:bg-[#0251FB]/90 dark:hover:bg-blue-600"
            >
              {loading ? (
                <span className="flex items-center">
                  Loading <LoadingDots color="#ffffff" size={4} />
                </span>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </main>
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

// Map Selection Component
const MapSelection = ({ onLocationSelect, currentLocation = null }) => {
  const [selectedPosition, setSelectedPosition] = useState<
    [number, number] | null
  >(null);
  const [locationName, setLocationName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [map, setMap] = useState<L.Map | null>(null);
  const defaultPosition: [number, number] =
    currentLocation && currentLocation.lat && currentLocation.lng
      ? [currentLocation.lat, currentLocation.lng]
      : [40.7128, -74.006]; // Use current location if available, otherwise New York City as default

  // Set initial marker if we have a current location
  useEffect(() => {
    if (currentLocation) {
      setSelectedPosition([currentLocation.lat, currentLocation.lng]);
      setLocationName(currentLocation.name);
    }
  }, [currentLocation]);

  // Pan to selected position when it changes
  useEffect(() => {
    if (map && selectedPosition) {
      map.flyTo(selectedPosition, 15, {
        animate: true,
        duration: 1,
      });
    }
  }, [map, selectedPosition]);

  // Function to handle map click and set marker
  const MapClickHandler = () => {
    const map = useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setSelectedPosition([lat, lng]);

        // Generate location name based on coordinates without API call
        try {
          console.log(
            `Generating location name for HomePage map coordinates: ${lat}, ${lng}`,
          );

          // Generate a location name based on coordinates
          const formattedLat = lat.toFixed(6);
          const formattedLng = lng.toFixed(6);

          // Determine if it's likely a sea location based on coordinates
          // This is a simplified approach - in reality we'd need more sophisticated logic
          const isSeaLocation = Math.random() > 0.7; // 30% chance of being a sea location for demo purposes

          // Generate country code
          let countryCodeValue = "";

          // Check if location is in Malta based on coordinates
          const isMalta =
            lat >= 35.8 && lat <= 36.1 && lng >= 14.1 && lng <= 14.6;

          if (isMalta) {
            console.log("Malta detected from map selection");
            setCountryCode("mt");
            countryCodeValue = "mt";
          } else {
            // Generate a country code based on latitude
            if (lat > 40 && lat < 50) {
              countryCodeValue = "es"; // Spain
            } else if (lat > 50 && lat < 60) {
              countryCodeValue = "gb"; // United Kingdom
            } else if (lat > 30 && lat < 40) {
              countryCodeValue = "it"; // Italy
            } else {
              countryCodeValue = ["fr", "de", "nl", "be"][
                Math.floor(Math.random() * 4)
              ];
            }
            setCountryCode(countryCodeValue);
          }

          if (isSeaLocation) {
            // For sea locations, display only coordinates
            setLocationName(`${formattedLat}, ${formattedLng}`);
            console.log("Sea location detected for HomePage map");
          } else {
            // For land locations, generate a plausible name
            let city = "";
            let country = "";

            // Very simplified location naming based on latitude ranges and country code
            if (countryCodeValue === "es") {
              city = ["Barcelona", "Madrid", "Valencia", "Seville"][
                Math.floor(Math.random() * 4)
              ];
              country = "Spain";
            } else if (countryCodeValue === "gb") {
              city = ["London", "Manchester", "Liverpool", "Birmingham"][
                Math.floor(Math.random() * 4)
              ];
              country = "United Kingdom";
            } else if (countryCodeValue === "it") {
              city = ["Rome", "Milan", "Naples", "Florence"][
                Math.floor(Math.random() * 4)
              ];
              country = "Italy";
            } else if (countryCodeValue === "fr") {
              city = ["Paris", "Lyon", "Marseille", "Bordeaux"][
                Math.floor(Math.random() * 4)
              ];
              country = "France";
            } else if (countryCodeValue === "de") {
              city = ["Berlin", "Munich", "Hamburg", "Frankfurt"][
                Math.floor(Math.random() * 4)
              ];
              country = "Germany";
            } else if (countryCodeValue === "mt") {
              city = ["Valletta", "Sliema", "St. Julian's", "Mdina"][
                Math.floor(Math.random() * 4)
              ];
              country = "Malta";
            } else {
              city = ["Amsterdam", "Brussels", "Copenhagen", "Oslo"][
                Math.floor(Math.random() * 4)
              ];
              country = ["Netherlands", "Belgium", "Denmark", "Norway"][
                Math.floor(Math.random() * 4)
              ];
            }

            const name = `${city}, ${country}`;
            setLocationName(name);
            console.log("Land location generated for HomePage map:", name);
          }

          // Log the generated location data
          console.log("Generated HomePage location data:", {
            isSeaLocation,
            countryCode: countryCodeValue,
            lat,
            lng,
          });
        } catch (error) {
          console.error("Error generating location name:", error);
          // Display coordinates as fallback
          const formattedLat = lat.toFixed(6);
          const formattedLng = lng.toFixed(6);
          setLocationName(`${formattedLat}, ${formattedLng}`);
          setCountryCode("");
        }
      },
    });
    return null;
  };

  return (
    <div className="relative h-full flex flex-col gap-y-6 justify-center items-center">
      <MapContainer
        center={defaultPosition}
        // Zoom in closer if we have a current location
        zoom={currentLocation ? 15 : 13}
        style={{ height: "100%", width: "100%" }}
        className="flex"
        ref={setMap}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Standard Map" checked>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Marine Chart">
            <TileLayer
              attribution='&copy; <a href="https://openseamap.org">OpenSeaMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <TileLayer
              attribution='&copy; <a href="https://openseamap.org">OpenSeaMap</a> contributors'
              url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <MapClickHandler />
        {selectedPosition && <Marker position={selectedPosition} />}
      </MapContainer>
      <div className="z-[1000] relative">
        <Button
          onClick={() => {
            if (selectedPosition) {
              onLocationSelect({
                lat: selectedPosition[0],
                lng: selectedPosition[1],
                name: locationName,
                countryCode: countryCode,
              });
            }
          }}
          disabled={!selectedPosition}
          className="bg-[#0251FB] text-white hover:bg-[#0251FB]/90 rounded-full"
        >
          Select This Location
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
