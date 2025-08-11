import { log } from "@/lib/logging";
import React, { useRef, useState } from "react";
import { Share, Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toBlob } from "html-to-image";
import { cn } from "@/lib/utils";
import FishInfoOverlay from "@/components/fish-info-overlay";
import { ImageMetadata } from "@/lib/image-metadata";

function FishImageCard({
  isSingleColumn,
  photo,
  setSuccess,
  handleImageClick,
  loading,
  handleEditAIInfo,
  handleDeletePhoto,
  setError,
}: {
  isSingleColumn: boolean;
  setSuccess: (success: string) => void;
  setError: (error: string) => void;
  handleImageClick: () => void;
  loading: boolean;
  handleEditAIInfo: () => void;
  handleDeletePhoto: () => void;
  photo: any;
}) {
  const [imageLoadingState, setImageLoadingState] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // All photos should now be ImageMetadata objects - simplified parsing

  const fishInfoOverlayRef = useRef<HTMLDivElement>(null);

  let photoUrl: string;
  let metadata: ImageMetadata | null = null;

  // Handle legacy data that might still be strings
  if (typeof photo === "string") {
    console.warn(`[ProfilePage] Legacy string photo detected at index:`, photo);
    // Check if it's a JSON string that needs parsing
    const photoString = photo as string;
    if (photoString.startsWith("{") && photoString.includes('"url"')) {
      try {
        const parsed = JSON.parse(photoString);
        photoUrl = parsed.url || photo;
        metadata = parsed;
        log(`[ProfilePage] Parsed legacy metadata for photo:`, metadata);
      } catch (parseError) {
        console.warn(
          `[ProfilePage] Failed to parse legacy photo metadata at index:`,
          parseError,
        );
        photoUrl = photo;
        // Create minimal metadata for legacy string URLs
        metadata = {
          url: photo,
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
      photoUrl = photo;
      // Create minimal metadata for plain string URLs
      metadata = {
        url: photo,
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
    // Standard case - photo is already an ImageMetadata object
    photoUrl = photo.url || String(photo);
    metadata = photo as ImageMetadata;
    log(`[ProfilePage] Standard metadata for photo:`, {
      hasMetadata: !!metadata,
      fishInfo: metadata?.fishInfo,
      location: metadata?.location,
      url: metadata?.url,
      timestamp: metadata?.timestamp,
      fullMetadata: metadata,
    });
  }

  const isLoading = imageLoadingState;
  const hasError = imageError;

  const handleSharePhoto = async () => {
    try {
      let photoUrl: string;
      let metadata: ImageMetadata | null = null;

      // Simplified extraction - all photos should be ImageMetadata objects now
      if (typeof photo === "string") {
        console.warn(
          `[ProfilePage] Legacy string photo in share function:`,
          photo,
        );
        const photoString = photo as string;
        if (photoString.startsWith("{") && photoString.includes('"url"')) {
          try {
            const parsed = JSON.parse(photoString);
            photoUrl = parsed.url || photo;
            metadata = parsed;
          } catch {
            photoUrl = photo;
          }
        } else {
          photoUrl = photo;
        }
      } else {
        photoUrl = photo.url || String(photo);
        metadata = photo as ImageMetadata;
      }

      // Check if Web Share API is available
      if (navigator.share) {
        try {
          let file: File;
          let shareText = "Check out this fish photo from Lishka!";

          // If we have metadata with fish info, export the overlay as an image
          if (metadata && (metadata.fishInfo || metadata.location)) {
            try {
              // Export the FishInfoOverlay as an image
              // const overlayBlob = await exportFishInfoOverlayAsImage(
              //   metadata,
              //   photoUrl,
              //   {
              //     quality: 0.9,
              //   }
              // );

              if (fishInfoOverlayRef.current === null) {
                return;
              }

              const overlayBlob = await toBlob(fishInfoOverlayRef.current, {
                cacheBust: true,
              });

              file = new File([overlayBlob], "fish-catch-with-info.png", {
                type: "image/png",
              });

              // Create enhanced share text
              if (
                metadata?.fishInfo?.name &&
                metadata.fishInfo.name !== "Unknown"
              ) {
                shareText = `Check out this ${metadata.fishInfo.name} I caught! 🎣`;
                if (
                  metadata.fishInfo.estimatedSize &&
                  metadata.fishInfo.estimatedSize !== "Unknown"
                ) {
                  shareText += ` Size: ${metadata.fishInfo.estimatedSize}`;
                }
                if (
                  metadata.fishInfo.estimatedWeight &&
                  metadata.fishInfo.estimatedWeight !== "Unknown"
                ) {
                  shareText += ` Weight: ${metadata.fishInfo.estimatedWeight}`;
                }
              }
            } catch (exportError) {
              console.error(
                "[ProfilePage] Error exporting overlay:",
                exportError,
              );
              // Fallback to original image
              const response = await fetch(photoUrl);
              const blob = await response.blob();
              file = new File([blob], "fish-photo.jpg", { type: blob.type });
            }
          } else {
            // No metadata, use original image
            const response = await fetch(photoUrl);
            const blob = await response.blob();
            file = new File([blob], "fish-photo.jpg", { type: blob.type });
          }

          await navigator.share({
            title: "My Fish Catch",
            text: shareText,
            files: [file],
          });

          log("[ProfilePage] Photo with overlay shared successfully");
        } catch (shareError) {
          console.error("[ProfilePage] Error sharing photo:", shareError);
          // Fallback to copying URL
          await navigator.clipboard.writeText(photoUrl);
          setSuccess("Photo URL copied to clipboard!");
          setTimeout(() => setSuccess(null), 3000);
        }
      } else {
        // Fallback: copy URL to clipboard
        try {
          await navigator.clipboard.writeText(photoUrl);
          setSuccess("Photo URL copied to clipboard!");
          setTimeout(() => setSuccess(null), 3000);
        } catch (clipboardError) {
          console.error(
            "[ProfilePage] Error copying to clipboard:",
            clipboardError,
          );
          setError("Unable to share photo. Please try again.");
        }
      }
    } catch (err) {
      console.error("[ProfilePage] Error sharing photo:", err);
      setError("Failed to share photo. Please try again.");
    }
  };

  return (
    <div
      className={cn(
        `relative cursor-pointer hover:opacity-90 transition-opacity overflow-hidden bg-gray-100 dark:bg-gray-700`,
        isSingleColumn ? "" : "aspect-square",
      )}
    >
      {/* Main image button */}
      <button onClick={handleImageClick} className="w-full h-full">
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <svg
              className="w-8 h-8 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-xs">Failed to load</span>
          </div>
        )}

        <div
          ref={fishInfoOverlayRef}
          className="w-full h-full"
          id="fish-info-overlay-container"
        >
          {/* Image */}
          <img
            src={`${photoUrl}${photoUrl.includes("?") ? "&" : "?"}cb=${metadata?.cacheBuster || Date.now()}`}
            alt={photo.url}
            className={`w-full transition-opacity duration-200 ${
              isLoading ? "opacity-0" : "opacity-100"
            } ${hasError ? "hidden" : ""} ${
              isSingleColumn ? "h-auto object-contain" : "h-full"
            }`}
            onLoadStart={() => {
              log(`[ProfilePage] Image started loading:`, photoUrl);
              setImageLoadingState(true);
              setImageError(false);
            }}
            onLoad={() => {
              log(`[ProfilePage] Image  loaded successfully:`, photoUrl);
              setImageLoadingState(false);
              setImageError(false);
            }}
            onError={(e) => {
              console.error(`[ProfilePage] Error loading image :`, {
                url: photoUrl,
                error: e,
                isHttps: photoUrl.startsWith("https://"),
                domain: (() => {
                  try {
                    return new URL(photoUrl).hostname;
                  } catch {
                    return "invalid-url";
                  }
                })(),
                urlLength: photoUrl.length,
                hasValidExtension: /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(
                  photoUrl,
                ),
              });

              // Try to get more details about the error
              fetch(photoUrl, { method: "HEAD" })
                .then((response) => {
                  console.error(`[ProfilePage] HTTP status for failed image:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: photoUrl,
                  });
                })
                .catch((fetchError) => {
                  console.error(`[ProfilePage] Network error for image:`, {
                    error: fetchError.message,
                    url: photoUrl,
                  });
                });

              setImageLoadingState(false);
              setImageError(true);
              // Don't automatically remove images - let user decide
              // Show error state instead of removing the image
            }}
          />

          {/* Fish Info Overlay - Use FishInfoOverlay component - Only show in single column */}
          {!isLoading && !hasError && metadata && isSingleColumn && (
            <FishInfoOverlay
              metadata={metadata}
              isSingleColumn={isSingleColumn}
            />
          )}
        </div>
      </button>

      {/* 3-dots menu - only show in single column mode */}
      {isSingleColumn && (
        <div className="absolute bottom-28 right-0 h-10 w-full z-20">
          <div className="flex items-center justify-end pr-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-white p-1.5 transition-colors">
                  <MoreVertical className="w-5 h-5 rotate-90" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSharePhoto();
                  }}
                  disabled={loading}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAIInfo();
                  }}
                  disabled={loading}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit AI Info
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto();
                  }}
                  className="text-red-600 hover:text-red-700 focus:text-red-700"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(FishImageCard);
