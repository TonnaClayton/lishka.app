export function getPlaceholderFishImage(): string {
  return "https://ghep9tkuzzpsmczw.public.blob.vercel-storage.com/default-image.jpg";
}

/**
 * Generate dynamic fish image URL from scientific name (removes spaces, converts to lowercase)
 */
function generateDynamicFishImageUrl(scientificName: string): string {
  const cleanName = scientificName
    .toLowerCase()
    .replace(/\s+/g, "") // Remove all spaces
    .replace(/[^a-z0-9]/g, ""); // Remove any non-alphanumeric characters

  return `https://ghep9tkuzzpsmczw.public.blob.vercel-storage.com/${cleanName}.png`;
}

/**
 * Get fish image URL using scientific name or fallback to placeholder with timeout
 */
export async function getFishImageUrl(
  name: string,
  scientificName: string,
): Promise<string> {
  console.log(
    `[FishImageService] Looking up image for ${name} (${scientificName})`,
  );

  // Only try dynamic URL generation using scientific name
  if (scientificName) {
    const dynamicUrl = generateDynamicFishImageUrl(scientificName);
    console.log(
      `[FishImageService] Trying dynamic URL for ${scientificName}: ${dynamicUrl}`,
    );

    try {
      // Test image loading using Image object with timeout
      const testImage = new Image();
      const imageLoadPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(
            `[FishImageService] Image load timeout for: ${dynamicUrl}`,
          );
          resolve(false);
        }, 8000); // 8 second timeout for image loading test

        testImage.onload = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        testImage.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
        testImage.src = dynamicUrl;
      });

      const imageExists = await imageLoadPromise;
      if (imageExists) {
        console.log(`[FishImageService] Dynamic URL accessible: ${dynamicUrl}`);
        return dynamicUrl;
      } else {
        console.log(
          `[FishImageService] Dynamic URL not accessible: ${dynamicUrl}`,
        );
      }
    } catch (error) {
      console.log(
        `[FishImageService] Error checking dynamic URL: ${dynamicUrl}`,
        error,
      );
    }
  }

  console.log(
    `[FishImageService] No image found for ${name} (${scientificName}), using placeholder`,
  );
  return getPlaceholderFishImage();
}

export function getFishImageUrlSync(
  name?: string,
  scientificName?: string,
): string {
  // For sync version, just return placeholder since we can't check accessibility
  return getPlaceholderFishImage();
}

export function handleFishImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fishName: string,
): void {
  const img = event.currentTarget;
  if (!img) return;

  if (!img.src.includes("default-image.jpg")) {
    img.src = getPlaceholderFishImage();
  }
}
