import { put } from "@vercel/blob";
import { config } from "@/lib/config";
import { log } from "./logging";

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
  log("[BlobStorage] 🔍 Checking for blob token:", {
    hasViteToken: !!config.VITE_BLOB_READ_WRITE_TOKEN,
    tokenLength: config.VITE_BLOB_READ_WRITE_TOKEN?.length || 0,
    tokenType: typeof config.VITE_BLOB_READ_WRITE_TOKEN,
    allEnvKeys: Object.keys(config).filter((key) => key.includes("BLOB")),
  });

  // Check for the VITE_ prefixed version (required for Vite browser access)
  const token = config.VITE_BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error("[BlobStorage] ❌ Token missing:", {
      VITE_BLOB_READ_WRITE_TOKEN: config.VITE_BLOB_READ_WRITE_TOKEN,
      availableEnvVars: Object.keys(config).filter(
        (key) => key.includes("BLOB") || key.includes("VERCEL"),
      ),
      allEnvVars: Object.keys(config),
    });
    throw new Error(
      "VITE_BLOB_READ_WRITE_TOKEN environment variable is missing. " +
        "Please add it in your project settings with your Vercel Blob token.",
    );
  }

  if (typeof token !== "string" || token.trim() === "") {
    console.error("[BlobStorage] ❌ Token invalid:", {
      tokenType: typeof token,
      tokenValue: token,
      tokenLength: token?.length || 0,
      isEmpty: token === "",
      isWhitespace: token?.trim() === "",
    });
    throw new Error(
      "VITE_BLOB_READ_WRITE_TOKEN environment variable is empty. " +
        "Please set a valid Vercel Blob token in your project settings.",
    );
  }

  log("[BlobStorage] ✅ Token validation successful:", {
    tokenLength: token.length,
    tokenPrefix: token.substring(0, 10) + "...",
    tokenSuffix: "..." + token.substring(token.length - 4),
  });

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
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  try {
    log("[BlobStorage] 🚀 Starting image upload:", {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeFormatted: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      isMobile,
      deviceType: isMobile ? "mobile" : "desktop",
      timestamp: new Date().toISOString(),
    });

    // Get token and validate file with enhanced error handling
    let token;
    try {
      token = getBlobToken();
      log("[BlobStorage] ✅ Token validation successful:", {
        hasToken: !!token,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + "...",
        isMobile,
      });
    } catch (tokenError) {
      console.error("[BlobStorage] ❌ Token validation failed:", {
        error: tokenError.message,
        isMobile,
        availableEnvVars: {
          VITE_BLOB_READ_WRITE_TOKEN: !!config.VITE_BLOB_READ_WRITE_TOKEN,
          tokenLength: config.VITE_BLOB_READ_WRITE_TOKEN?.length || 0,
        },
      });
      throw new Error(`Failed to get upload token: ${tokenError.message}`);
    }

    try {
      validateFile(file);
      log("[BlobStorage] ✅ File validation passed", { isMobile });
    } catch (validationError) {
      console.error("[BlobStorage] ❌ File validation failed:", {
        error: validationError.message,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isMobile,
      });
      throw validationError;
    }

    // Generate filename
    const fileName = generateFileName(file, "images");
    log("[BlobStorage] 📝 Generated filename:", { fileName, isMobile });

    // Upload to Vercel Blob with detailed logging and timeout
    log("[BlobStorage] 🔄 Initiating Vercel Blob upload...", {
      isMobile,
    });
    const uploadStartTime = Date.now();

    // Add timeout wrapper for mobile devices
    const uploadTimeout = isMobile ? 120000 : 90000; // 120s for mobile, 90s for desktop
    const uploadPromise = put(fileName, file, {
      access: "public",
      token: token,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error("[BlobStorage] ⏰ Upload timeout:", {
          timeout: uploadTimeout,
          fileName,
          fileSize: file.size,
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
        });
        reject(
          new Error(
            `Upload timeout after ${uploadTimeout / 1000} seconds. Please try again with a smaller image or better connection.`,
          ),
        );
      }, uploadTimeout);
    });

    const blob = await Promise.race([uploadPromise, timeoutPromise]);

    const uploadTime = Date.now() - uploadStartTime;
    log("[BlobStorage] ✅ Upload completed:", {
      uploadTime: uploadTime + "ms",
      isMobile,
      isSlowUpload: uploadTime > 30000,
    });

    log("[BlobStorage] 📋 Blob response details:", {
      hasUrl: !!blob.url,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      contentDisposition: blob.contentDisposition,
      // @ts-ignore
      size: blob.size,
      downloadUrl: blob.downloadUrl,
      isMobile,
    });

    // Enhanced URL validation
    if (!blob.url) {
      console.error("[BlobStorage] ❌ No URL in blob response:", {
        fullBlobResponse: blob,
        blobKeys: Object.keys(blob),
        isMobile,
      });
      throw new Error(
        "Failed to get upload url - No URL returned from Vercel Blob",
      );
    }

    if (!blob.url.startsWith("https://")) {
      console.warn("[BlobStorage] ⚠️ URL is not HTTPS:", {
        url: blob.url,
        isMobile,
      });
    }

    if (!blob.url.includes("blob.vercel-storage.com")) {
      console.warn("[BlobStorage] ⚠️ URL is not from Vercel Blob domain:", {
        url: blob.url,
        domain: new URL(blob.url).hostname,
        isMobile,
      });
    }

    // Test URL accessibility
    try {
      const testResponse = await fetch(blob.url, { method: "HEAD" });
      log("[BlobStorage] 🔍 URL accessibility test:", {
        status: testResponse.status,
        ok: testResponse.ok,
        url: blob.url,
        isMobile,
      });
    } catch (testError) {
      console.warn("[BlobStorage] ⚠️ URL accessibility test failed:", {
        error: testError.message,
        url: blob.url,
        isMobile,
      });
    }

    log("[BlobStorage] 🎉 Upload successful:", {
      url: blob.url,
      isMobile,
    });
    return blob.url;
  } catch (error) {
    const uploadTime = Date.now();
    console.error("[BlobStorage] 💥 Upload failed:", {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      isMobile,
      deviceType: isMobile ? "mobile" : "desktop",
      timestamp: new Date().toISOString(),
    });

    // Enhanced error logging
    if (error instanceof Error) {
      console.error("[BlobStorage] 📋 Detailed error information:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        isMobile,
      });
    }

    // Check for specific error types and provide better error messages
    if (error instanceof Error) {
      // Network/connectivity errors
      if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        const networkError = `Network error during upload: ${error.message}. Please check your internet connection.`;
        console.error("[BlobStorage] 🌐 Network error detected:", {
          networkError,
          isMobile,
        });
        throw new Error(networkError);
      }

      // Authentication errors
      if (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("Unauthorized")
      ) {
        const authError = `Authentication error: ${error.message}. Please check your Vercel Blob token configuration.`;
        console.error("[BlobStorage] 🔐 Authentication error detected:", {
          authError,
          isMobile,
        });
        throw new Error(authError);
      }

      // Timeout errors
      if (error.message.includes("timeout")) {
        const timeoutError = `Upload timeout: ${error.message}. ${isMobile ? "Mobile uploads may take longer due to slower connections." : "Please try again."}`;
        console.error("[BlobStorage] ⏰ Timeout error detected:", {
          timeoutError,
          isMobile,
        });
        throw new Error(timeoutError);
      }

      // Token-related errors
      if (error.message.includes("token") || error.message.includes("Token")) {
        const tokenError = `Token error: ${error.message}. Please check your VITE_BLOB_READ_WRITE_TOKEN environment variable.`;
        console.error("[BlobStorage] 🔑 Token error detected:", {
          tokenError,
          isMobile,
        });
        throw new Error(tokenError);
      }

      // File size or validation errors
      if (
        error.message.includes("size") ||
        error.message.includes("large") ||
        error.message.includes("validation")
      ) {
        console.error("[BlobStorage] 📁 File validation error detected:", {
          error: error.message,
          isMobile,
        });
        throw error; // Re-throw as-is for validation errors
      }
    }

    // Generic error with enhanced context
    const genericError = `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}. ${isMobile ? "If you're on mobile, try switching to a stronger WiFi connection." : "Please try again."}`;
    console.error("[BlobStorage] ❓ Generic error:", {
      genericError,
      isMobile,
    });
    throw new Error(genericError);
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
    log("[BlobStorage] Starting avatar upload:", {
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

    log("[BlobStorage] Uploading avatar to:", fileName);

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      token: token,
    });

    log("[BlobStorage] Avatar upload successful:", blob.url);
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
    const token = config.VITE_BLOB_READ_WRITE_TOKEN;

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
