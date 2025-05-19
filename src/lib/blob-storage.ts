/**
 * Vercel Blob Storage utilities
 */
import { put, list, del } from "@vercel/blob";

// Store configuration
const STORE_ID = "store_gHeP9tKUZzpsMcZW";
const STORE_URL = "https://ghep9tkuzzpsmczw.public.blob.vercel-storage.com";

/**
 * Uploads an image to Vercel Blob Storage
 */
export async function uploadImage(
  file: File,
  fileName: string,
): Promise<string> {
  try {
    const { url } = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
      storeId: STORE_ID,
    });

    console.log(`Image uploaded to Vercel Blob: ${url}`);
    return url;
  } catch (error) {
    console.error("Error uploading image to Vercel Blob:", error);
    throw error;
  }
}

/**
 * Gets an image URL from Vercel Blob Storage
 */
export async function getBlobImage(
  scientificName: string,
): Promise<string | null> {
  if (!scientificName) return null;

  try {
    // Normalize the scientific name
    const normalizedName = scientificName.toLowerCase().replace(/\s+/g, "");

    // Try direct URL construction first (faster than listing)
    const possibleExtensions = ["jpg", "jpeg", "png", "webp"];
    for (const ext of possibleExtensions) {
      const directUrl = `${STORE_URL}/${normalizedName}.${ext}`;
      try {
        const response = await fetch(directUrl, { method: "HEAD" });
        if (response.ok) {
          console.log(
            `Found direct Blob image for ${scientificName}: ${directUrl}`,
          );
          return directUrl;
        }
      } catch (e) {
        // Continue to next extension if fetch fails
      }
    }

    // If direct URL fails, try listing blobs
    const blobs = await list({
      prefix: normalizedName,
      storeId: STORE_ID,
    });

    if (blobs.blobs.length > 0) {
      console.log(
        `Found Vercel Blob image for ${scientificName}: ${blobs.blobs[0].url}`,
      );
      return blobs.blobs[0].url;
    }

    console.log(`No Vercel Blob images found for ${scientificName}`);
    return null;
  } catch (error) {
    console.error("Error fetching image from Vercel Blob:", error);
    return null;
  }
}

/**
 * Deletes an image from Vercel Blob Storage
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    await del(url, { storeId: STORE_ID });
    console.log(`Image deleted from Vercel Blob: ${url}`);
    return true;
  } catch (error) {
    console.error("Error deleting image from Vercel Blob:", error);
    return false;
  }
}
