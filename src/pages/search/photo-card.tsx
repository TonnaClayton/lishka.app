import { Skeleton } from "@/components/ui/skeleton";
import { useLazyLoading } from "@/hooks/use-lazy-loading";
import { error, log } from "@/lib/logging";
import { ROUTES } from "@/lib/routing";
import { cn } from "@/lib/utils";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function SearchPhotoCard({
  url,
  name,
}: {
  url: string;
  name: string;
}) {
  // Memoize lazy loading options to prevent unnecessary re-renders
  const lazyLoadingOptions = useMemo(() => ({ rootMargin: "100px" }), []);
  const [imageRef, isVisible] = useLazyLoading(lazyLoadingOptions);
  const [imageLoadingState, setImageLoadingState] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  return (
    <div
      ref={(el) => {
        (imageRef as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
    >
      {isVisible ? (
        <Link to={ROUTES.PROFILE} target="_blank">
          <img
            src={url}
            alt={name}
            className={cn(
              `w-full transition-all duration-200 hover:scale-[1.03] h-[100px] rounded-[8px] aspect-square`,
              imageLoadingState ? "opacity-0" : "opacity-100",
              imageError ? "hidden" : "",
            )}
            // eslint-disable-next-line react/no-unknown-property
            onLoadStart={() => {
              log(`[ProfilePage] Image started loading:`, url);
              setImageLoadingState(true);
              setImageError(false);
            }}
            onLoad={() => {
              log(`[ProfilePage] Image  loaded successfully:`, url);
              setImageLoadingState(false);
              setImageError(false);
            }}
            onError={(e) => {
              error(`[ProfilePage] Error loading image :`, {
                url: url,
                error: e,
                isHttps: url.startsWith("https://"),
                domain: (() => {
                  try {
                    return new URL(url).hostname;
                  } catch {
                    return "invalid-url";
                  }
                })(),
                urlLength: url.length,
                hasValidExtension: /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url),
              });

              // Try to get more details about the error
              fetch(url, { method: "HEAD" })
                .then((response) => {
                  error(`[ProfilePage] HTTP status for failed image:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: url,
                  });
                })
                .catch((fetchError) => {
                  error(`[ProfilePage] Network error for image:`, {
                    error: fetchError.message,
                    url: url,
                  });
                });

              setImageLoadingState(false);
              setImageError(true);
              // Don't automatically remove images - let user decide
              // Show error state instead of removing the image
            }}
          />
        </Link>
      ) : (
        <div
          className={cn(
            `w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-[8px] flex items-center justify-center h-[100px]`,
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-16 h-2 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
