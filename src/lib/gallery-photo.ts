import { ImageMetadata } from "./image-metadata";
import type { Json } from "@/types/supabase";

export const toImageMetadataItem = (item: Json | string | null) => {
  let photo: ImageMetadata | null = null;
  try {
    if (typeof item === "string") {
      // Handle string photos
      const photoString = item as string;
      if (photoString.startsWith("{") && photoString.includes('"url"')) {
        // Parse JSON string
        try {
          const parsed = JSON.parse(photoString);
          // Ensure it has the correct structure
          photo = {
            url: parsed.url || photo,
            timestamp: parsed.timestamp || new Date().toISOString(),
            originalFileName: parsed.originalFileName || undefined,
            fishInfo: parsed.fishInfo || {
              name: "Unknown",
              estimatedSize: "Unknown",
              estimatedWeight: "Unknown",
              confidence: 0,
            },
            location: parsed.location || undefined,
          };
        } catch {
          // Create minimal metadata for unparseable JSON
          photo = {
            url: item,
            timestamp: new Date().toISOString(),
            fishInfo: {
              name: "Unknown",
              estimatedSize: "Unknown",
              estimatedWeight: "Unknown",
              confidence: 0,
            },
          };
        }
      } else {
        // Plain URL string - create metadata
        photo = {
          url: item,
          timestamp: new Date().toISOString(),
          fishInfo: {
            name: "Unknown",
            estimatedSize: "Unknown",
            estimatedWeight: "Unknown",
            confidence: 0,
          },
        };
      }
    } else {
      // Already an object - validate and fix if needed
      if (item && typeof item === "object") {
        const itemAny = item as any;

        photo = {
          url: itemAny.url,
          timestamp: itemAny.timestamp || new Date().toISOString(),
          originalFileName: itemAny.originalFileName || undefined,
          fishInfo: itemAny.fishInfo || {
            name: "Unknown",
            estimatedSize: "Unknown",
            estimatedWeight: "Unknown",
            confidence: 0,
          },
          location: itemAny.location || undefined,
        };
      }
    }
  } catch (photoError) {
    throw `${
      photoError instanceof Error ? photoError.message : String(photoError)
    }`;
  }

  return photo;
};
