import { put } from "@vercel/blob";

/**
 * Vercel Blob Storage Service
 *
 * This service handles file uploads to Vercel Blob storage.
 * Requires VITE_BLOB_READ_WRITE_TOKEN environment variable to be set.
 */

/**
 * Get the blob storage token from environment variables
 */
function getBlobToken(): string {
  // Check for the VITE_ prefixed version (required for Vite browser access)
  const token = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "VITE_BLOB_READ_WRITE_TOKEN environment variable is missing. " +
        "Please add it in your project settings with your Vercel Blob token.",
    );
  }

  if (typeof token !== "string" || token.trim() === "") {
    throw new Error(
      "VITE_BLOB_READ_WRITE_TOKEN environment variable is empty. " +
        "Please set a valid Vercel Blob token in your project settings.",
    );
  }

  return token.trim();
}

/**
 * Validate file before upload
 */
function validateFile(file: File, maxSizeMB: number = 10): void {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`);
  }

  // Check file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  // Check for valid file extension
  const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (!fileExtension || !validExtensions.includes(fileExtension)) {
    throw new Error(
      "Please select a valid image file (jpg, jpeg, png, gif, webp)",
    );
  }
}

/**
 * Generate a clean filename for upload
 */
function generateFileName(file: File, prefix: string = "images"): string {
  const timestamp = Date.now();
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return `${prefix}/${cleanName}-${timestamp}.${fileExt}`;
}

/**
 * Upload a general image file to Vercel Blob
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    console.log("[BlobStorage] Starting image upload:", {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeFormatted: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    });

    // Get token and validate file
    const token = getBlobToken();
    console.log("[BlobStorage] Token validation:", {
      hasToken: !!token,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10) + "...",
    });

    validateFile(file);
    console.log("[BlobStorage] File validation passed");

    // Generate filename
    const fileName = generateFileName(file, "images");
    console.log("[BlobStorage] Generated filename:", fileName);

    // Upload to Vercel Blob with detailed logging
    console.log("[BlobStorage] Initiating Vercel Blob upload...");
    const uploadStartTime = Date.now();

    const blob = await put(fileName, file, {
      access: "public",
      token: token,
    });

    const uploadTime = Date.now() - uploadStartTime;
    console.log("[BlobStorage] Upload completed in", uploadTime, "ms");
    console.log("[BlobStorage] Blob response:", {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      contentDisposition: blob.contentDisposition,
      size: blob.size,
    });

    // Validate the returned URL
    if (!blob.url) {
      throw new Error("No URL returned from Vercel Blob");
    }

    if (!blob.url.startsWith("https://")) {
      console.warn("[BlobStorage] Warning: URL is not HTTPS:", blob.url);
    }

    if (!blob.url.includes("blob.vercel-storage.com")) {
      console.warn(
        "[BlobStorage] Warning: URL is not from Vercel Blob domain:",
        blob.url,
      );
    }

    console.log("[BlobStorage] Upload successful:", blob.url);
    return blob.url;
  } catch (error) {
    console.error("[BlobStorage] Upload failed:", error);

    // Enhanced error logging
    if (error instanceof Error) {
      console.error("[BlobStorage] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error during upload: ${error.message}. Please check your internet connection.`,
      );
    }

    // Check if it's an authentication error
    if (
      error instanceof Error &&
      (error.message.includes("401") || error.message.includes("403"))
    ) {
      throw new Error(
        `Authentication error: ${error.message}. Please check your Vercel Blob token.`,
      );
    }

    throw error;
  }
}

/**
 * Upload avatar with unique filename for a specific user
 */
export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<string> {
  try {
    console.log("[BlobStorage] Starting avatar upload:", {
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // Validate user ID
    if (!userId || userId.trim() === "") {
      throw new Error("User ID is required for avatar upload");
    }

    // Get token and validate file
    const token = getBlobToken();
    validateFile(file, 10); // 10MB limit for avatars

    // Create unique filename for avatar
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `avatars/${userId}-${timestamp}.${fileExt}`;

    console.log("[BlobStorage] Uploading avatar to:", fileName);

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      token: token,
    });

    console.log("[BlobStorage] Avatar upload successful:", blob.url);
    return blob.url;
  } catch (error) {
    console.error("[BlobStorage] Avatar upload failed:", error);
    throw error;
  }
}

/**
 * Check if blob storage is properly configured
 */
export function isBlobStorageConfigured(): boolean {
  try {
    getBlobToken();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get configuration status for debugging
 */
export function getBlobStorageStatus(): {
  configured: boolean;
  hasToken: boolean;
  tokenLength?: number;
  error?: string;
} {
  try {
    const token = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return {
        configured: false,
        hasToken: false,
        error: "VITE_BLOB_READ_WRITE_TOKEN environment variable is not set",
      };
    }

    if (typeof token !== "string" || token.trim() === "") {
      return {
        configured: false,
        hasToken: true,
        tokenLength: token?.length || 0,
        error: "VITE_BLOB_READ_WRITE_TOKEN is empty or invalid",
      };
    }

    return {
      configured: true,
      hasToken: true,
      tokenLength: token.length,
    };
  } catch (error) {
    return {
      configured: false,
      hasToken: false,
      error:
        error instanceof Error ? error.message : "Unknown configuration error",
    };
  }
}
