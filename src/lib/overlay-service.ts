import { ImageMetadata } from "./image-metadata";
import { log } from "./logging";

/**
 * Unified overlay service that handles overlay rendering decisions consistently
 * across desktop and mobile platforms
 */
export class OverlayService {
  private static instance: OverlayService;

  static getInstance(): OverlayService {
    if (!OverlayService.instance) {
      OverlayService.instance = new OverlayService();
    }
    return OverlayService.instance;
  }

  /**
   * Detect if the current device is mobile
   */
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  }

  /**
   * Check if we should show the fish overlay based on metadata and display context
   * Unified logic that works consistently across desktop and mobile
   */
  shouldShowOverlay(
    metadata: ImageMetadata | null,
    isSingleColumn: boolean = true,
    forceShow: boolean = false,
  ): boolean {
    const isMobile = this.isMobileDevice();

    log("🔍 [OVERLAY SERVICE] shouldShowOverlay called:", {
      hasMetadata: !!metadata,
      isSingleColumn,
      forceShow,
      isMobile,
      deviceType: isMobile ? "mobile" : "desktop",
      userAgent: navigator.userAgent.substring(0, 50) + "...",
    });

    if (!metadata) {
      log("🔍 [OVERLAY SERVICE] No overlay: No metadata");
      return false;
    }

    // Check if we have any displayable information
    const hasFishInfo = this.hasFishInformation(metadata);
    const hasLocation = this.hasLocationInformation(metadata);
    const hasAnyDisplayableInfo = hasFishInfo || hasLocation;

    log("🔍 [OVERLAY SERVICE] Data analysis:", {
      hasFishInfo,
      hasLocation,
      hasAnyDisplayableInfo,
      fishName: metadata.fishInfo?.name,
      fishSize: metadata.fishInfo?.estimatedSize,
      fishWeight: metadata.fishInfo?.estimatedWeight,
      locationAddress: metadata.location?.address,
      isMobile,
      deviceType: isMobile ? "mobile" : "desktop",
    });

    if (!hasAnyDisplayableInfo) {
      log("🔍 [OVERLAY SERVICE] No overlay: No displayable information", {
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
      });
      return false;
    }

    // CRITICAL FIX: Mobile devices should ALWAYS show overlay when there's displayable info
    // Desktop shows overlay in single column mode or when forced
    const shouldShow = isMobile || forceShow || isSingleColumn;

    // ADDITIONAL MOBILE CHECK: Ensure mobile always shows overlay with displayable info
    const forceMobileOverlay = isMobile && hasAnyDisplayableInfo;
    const finalDecision = shouldShow || forceMobileOverlay;

    // ULTRA CRITICAL: If mobile and has displayable info, ALWAYS return true
    if (isMobile && hasAnyDisplayableInfo) {
      log(
        "🔍 [OVERLAY SERVICE] MOBILE OVERRIDE: Forcing overlay display on mobile with displayable info",
        {
          isMobile,
          hasAnyDisplayableInfo,
          hasFishInfo,
          hasLocation,
          deviceType: "mobile",
          overrideDecision: true,
        },
      );
      return true;
    }

    log("🔍 [OVERLAY SERVICE] Final display decision:", {
      shouldShow,
      forceMobileOverlay,
      finalDecision,
      isMobile,
      isSingleColumn,
      forceShow,
      hasDisplayableInfo: hasAnyDisplayableInfo,
      reasoning: isMobile
        ? "Mobile device - ALWAYS show overlay when data exists"
        : forceShow
          ? "Force show enabled"
          : isSingleColumn
            ? "Desktop single column mode - show overlay"
            : "Desktop multi-column mode - no overlay",
      deviceType: isMobile ? "mobile" : "desktop",
    });

    return finalDecision;
  }

  /**
   * Check if metadata contains fish information worth displaying
   */
  hasFishInformation(metadata: ImageMetadata): boolean {
    if (!metadata.fishInfo) {
      return false;
    }

    const { name, estimatedSize, estimatedWeight } = metadata.fishInfo;

    // Consider it displayable if we have any non-"Unknown" information
    const hasName = name && name !== "Unknown";
    const hasSize = estimatedSize && estimatedSize !== "Unknown";
    const hasWeight = estimatedWeight && estimatedWeight !== "Unknown";

    return hasName || hasSize || hasWeight;
  }

  /**
   * Check if metadata contains location information worth displaying
   */
  hasLocationInformation(metadata: ImageMetadata): boolean {
    return !!(metadata.location && metadata.location.address);
  }

  /**
   * Extract metadata from photo (handles both string and object formats)
   * UNIFIED method that works consistently across all components
   */
  extractPhotoMetadata(photo: string | ImageMetadata): ImageMetadata | null {
    const isMobile = this.isMobileDevice();

    log("🔍 [OVERLAY SERVICE] extractPhotoMetadata called:", {
      photoType: typeof photo,
      isString: typeof photo === "string",
      photoPreview:
        typeof photo === "string" ? photo.substring(0, 100) + "..." : "object",
      isMobile,
      deviceType: isMobile ? "mobile" : "desktop",
    });

    if (typeof photo === "string") {
      // Check if it's a JSON string containing metadata
      if (photo.startsWith("{") || photo.startsWith("[")) {
        try {
          const parsed = JSON.parse(photo);
          log("🔍 [OVERLAY SERVICE] Successfully parsed JSON string:", {
            hasFishInfo: !!parsed.fishInfo,
            fishName: parsed.fishInfo?.name,
            fishSize: parsed.fishInfo?.estimatedSize,
            fishWeight: parsed.fishInfo?.estimatedWeight,
            hasLocation: !!parsed.location,
            locationAddress: parsed.location?.address,
            isMobile,
            deviceType: isMobile ? "mobile" : "desktop",
            fullParsed: parsed,
          });
          return parsed;
        } catch (parseError) {
          console.warn("🔍 [OVERLAY SERVICE] Failed to parse JSON string:", {
            error: parseError.message,
            photoString: photo.substring(0, 200),
            isMobile,
            deviceType: isMobile ? "mobile" : "desktop",
          });
          return { url: photo, timestamp: new Date().toISOString() };
        }
      } else {
        // Plain URL string
        log("🔍 [OVERLAY SERVICE] Plain URL string detected:", {
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
        });
        return { url: photo, timestamp: new Date().toISOString() };
      }
    } else {
      // Already an object
      const metadata = photo as ImageMetadata;
      log("🔍 [OVERLAY SERVICE] Object metadata:", {
        hasFishInfo: !!metadata.fishInfo,
        fishName: metadata.fishInfo?.name,
        fishSize: metadata.fishInfo?.estimatedSize,
        fishWeight: metadata.fishInfo?.estimatedWeight,
        hasLocation: !!metadata.location,
        locationAddress: metadata.location?.address,
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
        fullMetadata: metadata,
      });
      return metadata;
    }
  }

  /**
   * Get device information for debugging
   */
  getDeviceInfo() {
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
}

// Export singleton instance
export const overlayService = OverlayService.getInstance();
