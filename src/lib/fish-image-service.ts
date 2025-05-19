/**
 * Fish Image Service
 * Handles retrieving fish images from various sources
 */
import { getBlobImage } from "./blob-storage";

/**
 * Custom database of high-quality fish images
 */
const fishImageDatabase: Record<string, string> = {
  // Atlantic Salmon
  salmosalar:
    "https://images.unsplash.com/photo-1574155376612-bfa4ed8aabfd?w=800&q=90",
  // Bluefin Tuna
  thunnusthynnus:
    "https://images.unsplash.com/photo-1531930961374-8db90742096e?w=800&q=90",
  // European Seabass
  dicentrarchuslabrax:
    "https://images.unsplash.com/photo-1544943910-4268335342e0?w=800&q=90",
  // Gilthead Seabream
  sparusaurata:
    "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&q=90",
};

/**
 * Gets an image from custom database
 */
export function getCustomFishImage(scientificName: string): string | null {
  if (!scientificName) return null;

  // Normalize the scientific name
  const normalizedName = scientificName.toLowerCase().replace(/\s+/g, "");

  // Check if we have this fish in our database
  if (fishImageDatabase[normalizedName]) {
    console.log(`Found custom image for ${scientificName}`);
    return fishImageDatabase[normalizedName];
  }

  return null;
}

/**
 * Gets a placeholder image URL for a fish
 */
export function getPlaceholderFishImage(): string {
  return "https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746814934638-lishka-placeholder.png";
}

/**
 * Gets an image URL for a fish, checking multiple sources
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

  // Try custom database next
  const customImage = getCustomFishImage(scientificName);
  if (customImage) {
    console.log(`Found custom image for ${scientificName}: ${customImage}`);
    return customImage;
  }

  // Fall back to placeholder image
  console.log(`Using placeholder image for ${name} (${scientificName})`);
  return getPlaceholderFishImage();
}

/**
 * Handles image loading errors by providing a fallback image
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
    img.src = getPlaceholderFishImage();
  } else {
    console.log(`Already using placeholder image for ${fishName}`);
  }
}
