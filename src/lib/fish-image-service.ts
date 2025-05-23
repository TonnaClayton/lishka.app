/**
 * Fish Image Service
 * Handles retrieving fish images from various sources
 */
import { getBlobImage } from "./blob-storage";

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

  // Try Vercel Blob storage
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

  // Fall back to placeholder image
  console.log(`Using placeholder image for ${name} (${scientificName})`);
  return getPlaceholderFishImage();
}

/**
 * Synchronous version of getFishImageUrl that returns a placeholder image
 * This is used in non-async contexts where we can't use await
 */
export function getFishImageUrlSync(
  name?: string,
  scientificName?: string,
): string {
  // Always return placeholder for sync version
  // The async version should be used when possible to get actual images
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
