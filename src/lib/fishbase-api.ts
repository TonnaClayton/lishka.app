/**
 * Fishbase API utilities
 *
 * This module provides functions to interact with the Fishbase API and format data
 */

import { fetchWithRetry, cacheApiResponse } from "./api-helpers";
import { getBlobImage } from "./blob-storage";

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
 * Fish image database interface
 */
interface FishImageDatabase {
  [key: string]: {
    url: string;
    width?: number;
    height?: number;
    quality?: "high" | "medium" | "low";
  };
}

/**
 * Custom database of high-quality fish images
 * Key format: lowercase scientific name with spaces removed
 * Example: "salmosalar" for "Salmo salar"
 */
const fishImageDatabase: FishImageDatabase = {
  // Atlantic Salmon
  salmosalar: {
    url: "https://images.unsplash.com/photo-1574155376612-bfa4ed8aabfd?w=800&q=90",
    width: 800,
    height: 533,
    quality: "high",
  },
  // Bluefin Tuna
  thunnusthynnus: {
    url: "https://images.unsplash.com/photo-1531930961374-8db90742096e?w=800&q=90",
    width: 800,
    height: 533,
    quality: "high",
  },
  // European Seabass
  dicentrarchuslabrax: {
    url: "https://images.unsplash.com/photo-1544943910-4268335342e0?w=800&q=90",
    width: 800,
    height: 533,
    quality: "high",
  },
  // Gilthead Seabream
  sparusaurata: {
    url: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&q=90",
    width: 800,
    height: 533,
    quality: "high",
  },
};

/**
 * Gets an image from our custom database
 *
 * @param scientificName Scientific name of the fish
 * @returns URL to an image of the fish or null if not found
 */
export function getCustomFishImage(scientificName: string): string | null {
  if (!scientificName) return null;

  // Normalize the scientific name (lowercase, remove spaces)
  const normalizedName = scientificName.toLowerCase().replace(/\s+/g, "");

  // Check if we have this fish in our database
  if (fishImageDatabase[normalizedName]) {
    console.log(`Found custom image for ${scientificName}`);
    return fishImageDatabase[normalizedName].url;
  }

  return null;
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
  console.log(
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
  console.log(`Fetching image for ${name} (${scientificName})`);

  // First try Vercel Blob storage
  try {
    console.log(`Checking Vercel Blob for image of ${scientificName}`);
    const blobImage = await getBlobImage(scientificName);
    if (blobImage) {
      console.log(
        `Found Vercel Blob image for ${scientificName}: ${blobImage}`,
      );
      return blobImage;
    } else {
      console.log(`No Vercel Blob image found for ${scientificName}`);
    }
  } catch (error) {
    console.error("Error getting Vercel Blob image:", error);
  }

  // We're not using Supabase anymore - skip that check

  // Try custom database next (higher quality than fishbase)
  const customImage = getCustomFishImage(scientificName);
  if (customImage) {
    console.log(`Found custom image for ${scientificName}: ${customImage}`);
    return customImage;
  }

  // Fall back to Lishka placeholder image
  console.log(`Using placeholder image for ${name} (${scientificName})`);
  return "https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746814934638-lishka-placeholder.png";
}

/**
 * Returns a placeholder image URL for a fish
 *
 * @param name Common name of the fish
 * @param scientificName Scientific name of the fish
 * @returns URL to a placeholder image
 */
export function getPlaceholderFishImage(): string {
  return "https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746814934638-lishka-placeholder.png";
}

/**
 * Synchronous version of getFishImageUrl that returns a placeholder image
 * This is used in non-async contexts where we can't use await
 *
 * @param name Common name of the fish
 * @param scientificName Scientific name of the fish
 * @returns URL to a placeholder image
 */
export function getFishImageUrlSync(
  name?: string,
  scientificName?: string,
): string {
  // Try custom database first
  if (scientificName) {
    const customImage = getCustomFishImage(scientificName);
    if (customImage) {
      return customImage;
    }
  }

  // Fall back to placeholder image
  return getPlaceholderFishImage();
}

/**
 * Handles image loading errors by providing a fallback image
 *
 * @param event The error event from an image load failure
 * @param fishName The common name of the fish for fallback
 */
export function handleFishImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fishName: string,
): void {
  const img = event.currentTarget;
  console.log(
    `Fish image error handler called for ${fishName}, current src: ${img.src}`,
  );

  // If any image failed to load, switch to default image
  if (!img.src.includes("lishka-placeholder")) {
    console.log(`Setting default placeholder image for ${fishName}`);
    img.src =
      "https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746814934638-lishka-placeholder.png";
  } else {
    console.log(`Already using placeholder image for ${fishName}`);
  }
}

/**
 * Fetches local fish name from Fishbase API based on scientific name and location
 *
 * @param scientificName Scientific name of the fish
 * @param countryCode ISO country code for the location
 * @returns Promise that resolves to the local name or null if not found
 */
import { OPENAI_ENABLED, OPENAI_DISABLED_MESSAGE } from "./openai-toggle";

export async function getLocalFishName(
  scientificName: string,
  countryCode: string = "es",
): Promise<string | null> {
  console.log(
    `Getting local name for ${scientificName} in country ${countryCode}`,
  );
  if (!scientificName) return null;

  try {
    // Get preferred language from localStorage, default to countryCode if not set
    const preferredLanguage =
      localStorage.getItem("preferredLanguage") || countryCode;
    console.log(`Using preferred language: ${preferredLanguage}`);

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
    console.log(`Checking hardcoded translations for ${scientificName}`);

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
      console.log(
        `Found hardcoded translation for ${scientificName}: ${localName}`,
      );
      return localName;
    }

    // If OpenAI is disabled, return null instead of making API call
    if (!OPENAI_ENABLED) {
      console.log(OPENAI_DISABLED_MESSAGE);
      return null;
    }

    // If no hardcoded translation, use OpenAI to get the translation
    // Check if API key is available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return null;
    }

    console.log(
      `Using OpenAI to get ${languageName} name for ${scientificName}`,
    );

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
      console.error(`OpenAI API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const localName = data.choices[0].message.content.trim();

    // Check if the response is NULL or similar
    if (localName === "NULL" || localName.toLowerCase() === "null") {
      console.log(
        `OpenAI couldn't find a ${languageName} name for ${scientificName}`,
      );
      return null;
    }

    console.log(
      `OpenAI provided ${languageName} name for ${scientificName}: ${localName}`,
    );

    // Cache the result for 24 hours
    cacheApiResponse(cacheKey, localName, 24 * 60 * 60 * 1000);

    return localName;
  } catch (error) {
    console.error("Error fetching local fish name:", error);
    return null;
  }
}
