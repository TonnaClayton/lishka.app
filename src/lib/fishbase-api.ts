/**
 * Fishbase API utilities
 *
 * This module provides functions to interact with the Fishbase API and format data
 */

import { cacheApiResponse, fetchWithRetry } from "./api-helpers";
import {
  getFishImageUrl as getFishImageFromService,
  getPlaceholderFishImage,
  handleFishImageError,
} from "./fish-image-service";
import { error as logError, log } from "./logging";
import { config } from "@/lib/config";

/**
 * Generates a Fishbase image URL for a given scientific name
 * Format: https://www.fishbase.org/images/thumbnails/jpg/tn_[First 2 letters of genus][First 3 letters of species]_[variant].jpg
 *
 * @param scientificName The scientific name of the fish (e.g., "Salmo salar")
 * @param variant The image variant (default: "u0" for standard image)
 * @returns The URL to the fish image on Fishbase, or null if scientific name is invalid or if it's a stamp image
 */
export function getFishbaseImageUrl(
  scientificName: string,
  variant: string = "u0",
): string | null {
  if (!scientificName) return null;

  // Skip stamp images (typically have 's' variants)
  if (variant.startsWith("s")) return null;

  const nameParts = scientificName.split(" ");
  if (nameParts.length < 2) return null;

  const genus = nameParts[0];
  const species = nameParts[1];

  // Take first 2 letters of genus and first 3 letters of species
  const genusPrefix = genus.substring(0, 2);
  const speciesPrefix = species.substring(0, 3);

  // Format based on examples: https://www.fishbase.org/images/thumbnails/jpg/tn_Sedum_u7.jpg
  return `https://www.fishbase.org/images/thumbnails/jpg/tn_${genusPrefix}${speciesPrefix}_${variant}.jpg`;
}

/**
 * Gets an image from Supabase storage - REMOVED
 * This function has been removed as we're no longer using Supabase
 *
 * @param scientificName Scientific name of the fish
 * @returns URL to an image of the fish or null if not found
 */
export async function getSupabaseImage(
  scientificName: string,
): Promise<string | null> {
  // We're not using Supabase anymore
  log(
    `Supabase storage has been removed. Using alternative image sources for ${scientificName}`,
  );
  return null;
}

/**
 * Gets an image URL for a fish, first checking Vercel Blob storage, then using custom database,
 * otherwise falling back to default image
 *
 * @param name Common name of the fish
 * @param scientificName Scientific name of the fish
 * @returns URL to an image of the fish
 */
export async function getFishImageUrl(
  name: string,
  scientificName: string,
): Promise<string> {
  log(`Fetching image for ${name} (${scientificName})`);

  // Use the fish image service to get the image
  try {
    const imageUrl = await getFishImageFromService(name, scientificName);
    log(`Got image for ${scientificName}: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    error("Error getting fish image:", error);
    // Fall back to Lishka placeholder image
    log(`Using placeholder image for ${name} (${scientificName})`);
    return getPlaceholderFishImage();
  }
}

/**
 * Fetches local fish name from Fishbase API based on scientific name and location
 *
 * @param scientificName Scientific name of the fish
 * @param countryCode ISO country code for the location
 * @returns Promise that resolves to the local name or null if not found
 */
import { OPENAI_DISABLED_MESSAGE, OPENAI_ENABLED } from "./openai-toggle";

export async function getLocalFishName(
  scientificName: string,
  countryCode: string = "es",
): Promise<string | null> {
  log(`Getting local name for ${scientificName} in country ${countryCode}`);
  if (!scientificName) return null;

  try {
    // Get preferred language from localStorage, default to countryCode if not set
    const preferredLanguage =
      localStorage.getItem("preferredLanguage") || countryCode;
    log(`Using preferred language: ${preferredLanguage}`);

    // Force lowercase for consistent comparison
    const languageCode = preferredLanguage.toLowerCase();

    // Map language codes to human-readable language names for OpenAI
    const languageNames = {
      es: "Spanish",
      fr: "French",
      it: "Italian",
      pt: "Portuguese",
      de: "German",
      gr: "Greek",
      mt: "Maltese",
      en: "English",
    };

    // Get the full language name for OpenAI prompt
    const languageName = languageNames[languageCode] || languageCode;

    // First try with hardcoded common translations for immediate response
    // This is a fallback to ensure we have some translations for demo purposes
    log(`Checking hardcoded translations for ${scientificName}`);

    // Common fish translations by scientific name and language
    const commonTranslations = {
      "Salmo salar": {
        es: "Salmón del Atlántico",
        fr: "Saumon atlantique",
        it: "Salmone atlantico",
        pt: "Salmão do Atlântico",
        de: "Atlantischer Lachs",
        gr: "Σολομός του Ατλαντικού",
        mt: "Salamun tal-Atlantiku",
        en: "Atlantic Salmon",
      },
      "Thunnus thynnus": {
        es: "Atún rojo",
        fr: "Thon rouge",
        it: "Tonno rosso",
        pt: "Atum-rabilho",
        de: "Roter Thun",
        gr: "Ερυθρός τόνος",
        mt: "Tonn",
        en: "Bluefin Tuna",
      },
      "Dicentrarchus labrax": {
        es: "Lubina",
        fr: "Bar commun",
        it: "Spigola",
        pt: "Robalo",
        de: "Wolfsbarsch",
        gr: "Λαβράκι",
        mt: "Spnott",
        en: "European Seabass",
      },
      "Sparus aurata": {
        es: "Dorada",
        fr: "Daurade royale",
        it: "Orata",
        pt: "Dourada",
        de: "Goldbrasse",
        gr: "Τσιπούρα",
        mt: "Awrata",
        en: "Gilthead Seabream",
      },
      "Dentex dentex": {
        es: "Dentón",
        fr: "Denté commun",
        it: "Dentice",
        pt: "Capatão-legítimo",
        de: "Zahnbrasse",
        gr: "Συναγρίδα",
        mt: "Dentici",
        en: "Common Dentex",
      },
      "Merluccius merluccius": {
        es: "Merluza",
        fr: "Merlu",
        it: "Nasello",
        pt: "Pescada",
        de: "Seehecht",
        gr: "Μπακαλιάρος",
        mt: "Marlozz",
        en: "European Hake",
      },
      "Mullus barbatus": {
        es: "Salmonete de fango",
        fr: "Rouget de vase",
        it: "Triglia di fango",
        pt: "Salmonete-da-vasa",
        de: "Rotbarbe",
        gr: "Κουτσομούρα",
        mt: "Trilja",
        en: "Red Mullet",
      },
      "Scomber scombrus": {
        es: "Caballa",
        fr: "Maquereau",
        it: "Sgombro",
        pt: "Cavala",
        de: "Makrele",
        gr: "Σκουμπρί",
        mt: "Kavalli",
        en: "Atlantic Mackerel",
      },
      "Engraulis encrasicolus": {
        es: "Boquerón",
        fr: "Anchois",
        it: "Acciuga",
        pt: "Biqueirão",
        de: "Europäische Sardelle",
        gr: "Γαύρος",
        mt: "Inċova",
        en: "European Anchovy",
      },
      "Muraena helena": {
        es: "Morena",
        fr: "Murène",
        it: "Murena",
        pt: "Moreia",
        de: "Muräne",
        gr: "Σμέρνα",
        mt: "Morina",
        en: "Mediterranean Moray",
      },
    };

    // Check if we have a hardcoded translation
    if (
      commonTranslations[scientificName] &&
      commonTranslations[scientificName][languageCode]
    ) {
      const localName = commonTranslations[scientificName][languageCode];
      log(`Found hardcoded translation for ${scientificName}: ${localName}`);
      return localName;
    }

    // If OpenAI is disabled, return null instead of making API call
    if (!OPENAI_ENABLED) {
      log(OPENAI_DISABLED_MESSAGE);
      return null;
    }

    // If no hardcoded translation, use OpenAI to get the translation
    // Check if API key is available
    const apiKey = config.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      logError("OpenAI API key is missing");
      return null;
    }

    log(`Using OpenAI to get ${languageName} name for ${scientificName}`);

    // Create a cache key for the fish local name API request
    const cacheKey = `fish_local_name_${scientificName}_${languageCode}`;

    const response = await fetchWithRetry(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a multilingual fish species expert that provides accurate translations of fish names.",
            },
            {
              role: "user",
              content: `What is the ${languageName} local name for the fish with scientific name "${scientificName}"? Respond with ONLY the local name in ${languageName}, nothing else. If you don't know, respond with NULL.`,
            },
          ],
          temperature: 0.3,
          max_tokens: 50,
        }),
      },
      2, // 2 retries for translations
      3000, // 3 second initial delay (longer for lower priority)
    );

    if (!response.ok) {
      logError(`OpenAI API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const localName = data.choices[0].message.content.trim();

    // Check if the response is NULL or similar
    if (localName === "NULL" || localName.toLowerCase() === "null") {
      log(`OpenAI couldn't find a ${languageName} name for ${scientificName}`);
      return null;
    }

    log(
      `OpenAI provided ${languageName} name for ${scientificName}: ${localName}`,
    );

    // Cache the result for 24 hours
    cacheApiResponse(cacheKey, localName, 24 * 60 * 60 * 1000);

    return localName;
  } catch (error) {
    logError("Error fetching local fish name:", error);
    return null;
  }
}

// Re-export functions from fish-image-service for backward compatibility
export { getPlaceholderFishImage, handleFishImageError };
