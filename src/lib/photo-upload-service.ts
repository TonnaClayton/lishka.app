import {
  getSupabaseStorageStatus,
  uploadImageToSupabase,
} from "./supabase-storage";
import { ImageMetadata, processImageUpload } from "./image-metadata";
import { log } from "./logging";

export interface PhotoUploadResult {
  success: boolean;
  metadata?: ImageMetadata;
  photoUrl?: string;
  url?: string; // Add url property for backward compatibility
  error?: string;
}

export interface PhotoUploadCallbacks {
  onStart?: () => void;
  onProgress?: (message: string) => void;
  onSuccess?: (result: PhotoUploadResult) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

/**
 * Unified photo upload service that handles validation, processing, and storage
 * Works independently of any specific component - handles both mobile and desktop
 */
export class PhotoUploadService {
  private static instance: PhotoUploadService;
  private uploadCallbacks: Map<string, PhotoUploadCallbacks> = new Map();

  static getInstance(): PhotoUploadService {
    if (!PhotoUploadService.instance) {
      PhotoUploadService.instance = new PhotoUploadService();
    }
    return PhotoUploadService.instance;
  }

  /**
   * Detect if the current device is mobile
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      .test(
        navigator.userAgent,
      );
  }

  /**
   * Get comprehensive device information
   */
  private getDeviceInfo() {
    const isMobile = this.isMobileDevice();
    return {
      isMobile,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      deviceMemory: (navigator as any).deviceMemory || "unknown",
      connection: (navigator as any).connection
        ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
        }
        : "unknown",
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    };
  }

  /**
   * Register callbacks for upload events
   */
  registerCallbacks(id: string, callbacks: PhotoUploadCallbacks): void {
    this.uploadCallbacks.set(id, callbacks);
  }

  /**
   * Unregister callbacks
   */
  unregisterCallbacks(id: string): void {
    this.uploadCallbacks.delete(id);
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks<T extends keyof PhotoUploadCallbacks>(
    event: T,
    ...args: Parameters<NonNullable<PhotoUploadCallbacks[T]>>
  ): void {
    this.uploadCallbacks.forEach((callbacks) => {
      const callback = callbacks[event];
      if (callback) {
        (callback as any)(...args);
      }
    });
  }

  /**
   * Upload and process a photo with comprehensive error handling
   * Unified method that works for both mobile and desktop
   */
  async uploadPhoto(
    file: File,
    source: "profile" | "bottomnav" | "other" = "other",
  ): Promise<PhotoUploadResult> {
    const deviceInfo = this.getDeviceInfo();
    const isMobile = deviceInfo.isMobile;

    log(`🔍 [PHOTO UPLOAD SERVICE] Upload started from ${source}:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileSizeInMB: (file.size / (1024 * 1024)).toFixed(2),
      lastModified: new Date(file.lastModified).toISOString(),
      deviceInfo,
      source,
    });

    // Notify start
    this.notifyCallbacks("onStart");
    this.notifyCallbacks("onProgress", "Starting upload...");

    try {
      // Validate file size (max 15MB)
      if (file.size > 15 * 1024 * 1024) {
        const errorMsg = `Photo must be less than 15MB (current: ${
          (file.size / (1024 * 1024)).toFixed(1)
        }MB)`;
        console.error("❌ [PHOTO UPLOAD SERVICE] File too large:", {
          isMobile,
          fileSize: file.size,
          fileSizeInMB: (file.size / (1024 * 1024)).toFixed(2),
          maxSizeInMB: 10,
          source,
        });
        this.notifyCallbacks("onError", errorMsg);
        return { success: false, error: errorMsg };
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        const errorMsg = "Please select an image file";
        console.error("❌ [PHOTO UPLOAD SERVICE] Invalid file type:", {
          isMobile,
          fileType: file.type,
          fileName: file.name,
          source,
        });
        this.notifyCallbacks("onError", errorMsg);
        return { success: false, error: errorMsg };
      }

      log(
        "✅ [PHOTO UPLOAD SERVICE] File validation passed, starting upload:",
        {
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
          source,
        },
      );

      // Check Supabase storage configuration
      const storageStatus = getSupabaseStorageStatus();
      log("[SupabaseStorage] 🔍 Checking Supabase storage:", {
        storageStatus,
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
        source,
      });

      if (!storageStatus.configured) {
        const errorMessage = "Supabase storage is not properly configured";
        console.error(
          "❌ [PHOTO UPLOAD SERVICE] Supabase storage not configured:",
          {
            errorMessage,
            isMobile,
            deviceType: isMobile ? "mobile" : "desktop",
            storageStatus,
            source,
          },
        );
        this.notifyCallbacks("onError", errorMessage);
        return { success: false, error: errorMessage };
      }

      // Process image metadata (two-stage AI: classification + detailed analysis)
      this.notifyCallbacks("onProgress", "Starting AI analysis...");
      log(
        "🚀 [PHOTO UPLOAD SERVICE] Starting two-stage AI metadata processing:",
        {
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
          fileName: file.name,
          fileSize: file.size,
          source,
        },
      );

      const metadataStart = Date.now();
      this.notifyCallbacks("onProgress", "Classifying image...");

      const metadata = await Promise.race([
        processImageUpload(file, null).catch((error) => {
          console.error("❌ [PHOTO UPLOAD SERVICE] Image processing error:", {
            error: error.message,
            isMobile,
            deviceType: isMobile ? "mobile" : "desktop",
            fileName: file.name,
            source,
          });
          throw error;
        }),
        new Promise<ImageMetadata>((_, reject) => {
          setTimeout(() => {
            const timeoutError = new Error("Image processing timed out");
            console.error(
              "⏰ [PHOTO UPLOAD SERVICE] Image processing timeout (45s)",
              {
                isMobile,
                deviceType: isMobile ? "mobile" : "desktop",
                fileName: file.name,
                timeoutAfter: 45000,
                source,
                error: timeoutError.message,
              },
            );
            reject(timeoutError);
          }, 45000);
        }),
      ]);

      const metadataTime = Date.now() - metadataStart;
      log(
        "✅ [PHOTO UPLOAD SERVICE] Two-stage AI metadata processing completed",
        {
          processingTime: metadataTime,
          metadata,
          hasFishInfo: !!metadata.fishInfo,
          fishName: metadata.fishInfo?.name,
          confidence: metadata.fishInfo?.confidence,
          hasLocation: !!metadata.location,
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
          isSlowProcessing: metadataTime > 30000,
          devicePerformance: {
            processingTime: metadataTime,
            connectionType: (navigator as any).connection?.effectiveType ||
              "unknown",
          },
          source,
          // CRITICAL DEBUG: Metadata structure validation
          metadataStructureCheck: {
            hasUrl: !!metadata.url,
            hasTimestamp: !!metadata.timestamp,
            hasOriginalFileName: !!metadata.originalFileName,
            hasFishInfo: !!metadata.fishInfo,
            fishInfoKeys: metadata.fishInfo
              ? Object.keys(metadata.fishInfo)
              : [],
            fishInfoComplete: metadata.fishInfo
              ? {
                hasName: typeof metadata.fishInfo.name === "string",
                hasSize: typeof metadata.fishInfo.estimatedSize === "string",
                hasWeight:
                  typeof metadata.fishInfo.estimatedWeight === "string",
                hasConfidence: typeof metadata.fishInfo.confidence === "number",
              }
              : null,
          },
          // Two-stage AI specific info
          twoStageAiInfo: {
            approach: "classification-first",
            expectedBenefits: [
              "improved accuracy",
              "reduced costs",
              "better error handling",
            ],
            fishDetected: metadata.fishInfo?.name !== "Unknown" &&
              metadata.fishInfo?.name !== "Fishing Gear Detected",
            gearDetected: metadata.fishInfo?.name === "Fishing Gear Detected",
          },
        },
      );

      // Notify that two-stage AI analysis is complete
      this.notifyCallbacks("onProgress", "Two-stage AI analysis completed");

      // Upload the photo with enhanced error handling
      this.notifyCallbacks("onProgress", "Uploading to Supabase storage...");
      log(
        "🔍 [PHOTO UPLOAD SERVICE] Starting photo upload to Supabase storage:",
        {
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
          fileName: file.name,
          fileSize: file.size,
          fileSizeInMB: (file.size / (1024 * 1024)).toFixed(2),
          source,
          timestamp: new Date().toISOString(),
        },
      );

      const uploadStart = Date.now();
      let photoUrl: string;

      try {
        // Upload to Supabase storage with timeout
        photoUrl = await Promise.race([
          uploadImageToSupabase(file, "fish-photos"),
          new Promise<never>((_, reject) => {
            setTimeout(
              () => {
                reject(new Error("Supabase upload timeout"));
              },
              isMobile ? 45000 : 30000,
            ); // Longer timeout for mobile
          }),
        ]);

        const uploadTime = Date.now() - uploadStart;
        log("✅ [PHOTO UPLOAD SERVICE] Photo upload successful:", {
          photoUrl,
          uploadTime,
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
          isSlowUpload: uploadTime > 15000,
          source,
          urlValid: photoUrl && photoUrl.startsWith("https://"),
          urlDomain: photoUrl ? new URL(photoUrl).hostname : "invalid",
        });
      } catch (uploadError) {
        const uploadTime = Date.now() - uploadStart;
        console.error("❌ [PHOTO UPLOAD SERVICE] Photo upload failed:", {
          error: uploadError instanceof Error
            ? uploadError.message
            : String(uploadError),
          errorType: uploadError instanceof Error
            ? uploadError.constructor.name
            : typeof uploadError,
          uploadTime,
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
          fileName: file.name,
          fileSize: file.size,
          source,
          timestamp: new Date().toISOString(),
        });

        // Re-throw with enhanced context
        if (uploadError instanceof Error) {
          if (uploadError.message.includes("Upload failed")) {
            throw new Error(
              `Supabase upload error: ${uploadError.message}. Please check your Supabase configuration.`,
            );
          }
          throw uploadError;
        } else {
          throw new Error(
            `Supabase photo upload failed: ${String(uploadError)}`,
          );
        }
      }

      const uploadTime = Date.now() - uploadStart;
      log("✅ [PHOTO UPLOAD SERVICE] Photo uploaded successfully:", {
        photoUrl,
        uploadTime,
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
        isSlowUpload: uploadTime > 15000,
        source,
      });

      // Create complete metadata object with URL and preserve debug info
      const completeMetadata: ImageMetadata = {
        ...metadata,
        url: photoUrl,
        // Preserve any debug information from the AI analysis
        ...(metadata.fishInfo?.debugInfo && {
          aiDebugInfo: metadata.fishInfo.debugInfo,
          openaiPrompt: metadata.fishInfo.openaiPrompt,
          rawJsonResponse: metadata.fishInfo.rawJsonResponse,
        }),
      };

      log("🔍 [PHOTO UPLOAD SERVICE] Complete metadata:", {
        completeMetadata,
        hasFishInfo: !!completeMetadata.fishInfo,
        fishName: completeMetadata.fishInfo?.name,
        fishSize: completeMetadata.fishInfo?.estimatedSize,
        fishWeight: completeMetadata.fishInfo?.estimatedWeight,
        fishConfidence: completeMetadata.fishInfo?.confidence,
        hasLocation: !!completeMetadata.location,
        locationAddress: completeMetadata.location?.address,
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
        totalProcessingTime: Date.now() - metadataStart,
        willShowOverlay: !!(
          completeMetadata.fishInfo &&
          (completeMetadata.fishInfo.name !== "Unknown" ||
            completeMetadata.fishInfo.estimatedSize !== "Unknown" ||
            completeMetadata.fishInfo.estimatedWeight !== "Unknown")
        ) ||
          !!(completeMetadata.location && completeMetadata.location.address),
        source,
        // CRITICAL DEBUG INFO
        metadataStructure: {
          hasUrl: !!completeMetadata.url,
          url: completeMetadata.url,
          hasTimestamp: !!completeMetadata.timestamp,
          hasOriginalFileName: !!completeMetadata.originalFileName,
          fishInfoStructure: completeMetadata.fishInfo
            ? {
              hasName: !!completeMetadata.fishInfo.name,
              hasSize: !!completeMetadata.fishInfo.estimatedSize,
              hasWeight: !!completeMetadata.fishInfo.estimatedWeight,
              hasConfidence:
                typeof completeMetadata.fishInfo.confidence === "number",
            }
            : null,
        },
      });

      // Generate success message
      let successMsg = "Photo uploaded!";
      if (
        metadata.fishInfo &&
        (metadata.fishInfo.name !== "Unknown" ||
          metadata.fishInfo.estimatedSize !== "Unknown" ||
          metadata.fishInfo.estimatedWeight !== "Unknown")
      ) {
        if (metadata.fishInfo.name !== "Unknown") {
          successMsg += ` Identified: ${metadata.fishInfo.name}`;
          if (metadata.fishInfo.confidence > 0) {
            successMsg += ` (${
              Math.round(metadata.fishInfo.confidence * 100)
            }% confident)`;
          }
        } else {
          successMsg += " Fish data detected!";
        }
        log(
          "🎉 [PHOTO UPLOAD SERVICE] Fish info detected - success with fish info:",
          {
            successMsg,
            isMobile,
            deviceType: isMobile ? "mobile" : "desktop",
            fishInfo: metadata.fishInfo,
            source,
          },
        );
      } else {
        successMsg = "Photo uploaded successfully!";
        log(
          "ℹ️ [PHOTO UPLOAD SERVICE] No fish info detected - generic success:",
          {
            successMsg,
            isMobile,
            deviceType: isMobile ? "mobile" : "desktop",
            metadata,
            source,
          },
        );
      }

      const result: PhotoUploadResult = {
        success: true,
        metadata: completeMetadata,
        photoUrl,
        url: photoUrl, // Add url property for backward compatibility
      };

      log("🎉 [PHOTO UPLOAD SERVICE] Final result:", {
        result,
        hasUrl: !!result.url,
        hasPhotoUrl: !!result.photoUrl,
        hasMetadata: !!result.metadata,
        isMobile: deviceInfo.isMobile,
        source,
      });

      this.notifyCallbacks("onSuccess", result);
      this.notifyCallbacks("onProgress", successMsg);

      return result;
    } catch (err: any) {
      const errorDetails = {
        error: err?.message || "Unknown error",
        errorType: err?.constructor?.name || "Unknown",
        stack: err?.stack,
        isMobile: deviceInfo.isMobile,
        deviceType: deviceInfo.isMobile ? "mobile" : "desktop",
        fileName: file.name,
        fileSize: file.size,
        deviceInfo,
        source,
      };

      console.error(
        "❌ [PHOTO UPLOAD SERVICE] Photo upload error:",
        errorDetails,
      );

      let errorMsg = "Failed to upload photo. Please try again.";
      if (err instanceof Error) {
        if (
          err.message.includes("timed out") ||
          err.message.includes("timeout")
        ) {
          errorMsg = deviceInfo.isMobile
            ? "Upload is taking too long on mobile. Please check your connection and try again."
            : "Upload is taking too long. Please check your connection and try again.";
        } else {
          errorMsg = deviceInfo.isMobile
            ? `Mobile upload error: ${err.message}`
            : err.message;
        }
      } else {
        errorMsg = deviceInfo.isMobile
          ? "Failed to upload photo from mobile device. Please try again."
          : "Failed to upload photo. Please try again.";
      }

      this.notifyCallbacks("onError", errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      log("🔍 [PHOTO UPLOAD SERVICE] Upload process completed:", {
        isMobile: deviceInfo.isMobile,
        deviceType: deviceInfo.isMobile ? "mobile" : "desktop",
        fileName: file.name,
        source,
      });
      this.notifyCallbacks("onComplete");
    }
  }
}

// Export singleton instance
export const photoUploadService = PhotoUploadService.getInstance();
