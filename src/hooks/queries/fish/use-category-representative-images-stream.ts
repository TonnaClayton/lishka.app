import { useState, useCallback, useRef, useEffect } from "react";
import { apiStreamed } from "../api";
import { parseStreamChunk } from "./fish-stream-utils";

// ---------------------------------------------------------------------------
// Stream event types (backend sends newline-delimited JSON)
// ---------------------------------------------------------------------------

interface CategoryImageStreamEvent {
  type: "category_image" | "complete" | "error";
  filterKey?: string;
  categoryId?: string;
  imageUrl?: string | null;
  message?: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Streams representative fish image URLs per category for the user's region.
 * Images appear progressively (like toxic fish stream); backend avoids reusing
 * the same fish so each card gets a different species.
 */
export function useCategoryRepresentativeImagesStream(
  latitude: number | undefined,
  longitude: number | undefined,
) {
  const [images, setImages] = useState<Map<string, string>>(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamBufferRef = useRef("");
  const hasAutoStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const enabled =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const handleEvent = useCallback((event: CategoryImageStreamEvent) => {
    switch (event.type) {
      case "category_image":
        if (
          event.filterKey != null &&
          event.categoryId != null &&
          event.imageUrl
        ) {
          const key = `${event.filterKey}:${event.categoryId}`;
          setImages((prev) => new Map(prev).set(key, event.imageUrl));
        }
        break;
      case "complete":
        setIsComplete(true);
        setIsStreaming(false);
        break;
      case "error":
        setError(event.message ?? "Stream failed");
        setIsStreaming(false);
        break;
    }
  }, []);

  const startStream = useCallback(async () => {
    if (!enabled || latitude == null || longitude == null) return;
    if (isStreaming) return;

    hasAutoStartedRef.current = true;
    setError(null);
    setIsComplete(false);
    setImages(new Map());
    streamBufferRef.current = "";
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
      });
      const stream = await apiStreamed(
        `fish/categories/representative-images/stream?${params.toString()}`,
        {
          method: "GET",
          signal: abortControllerRef.current.signal,
        },
        false,
      );

      if (!stream) {
        throw new Error("Failed to create stream");
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        parseStreamChunk<CategoryImageStreamEvent>(
          chunk,
          streamBufferRef,
          handleEvent,
        );
      }

      handleEvent({ type: "complete" });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [enabled, latitude, longitude, isStreaming, handleEvent]);

  useEffect(() => {
    if (enabled && !isStreaming && !isComplete && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      startStream();
    }
  }, [enabled, isStreaming, isComplete, startStream]);

  // When location changes, abort any in-flight stream and reset so a new stream starts
  const prevCoordsRef = useRef({ lat: latitude, lon: longitude });
  useEffect(() => {
    if (
      latitude !== prevCoordsRef.current.lat ||
      longitude !== prevCoordsRef.current.lon
    ) {
      prevCoordsRef.current = { lat: latitude, lon: longitude };
      hasAutoStartedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setImages(new Map());
      setIsComplete(false);
      setIsStreaming(false);
      setError(null);
    }
  }, [latitude, longitude]);

  const isLoading = isStreaming && images.size === 0;

  return {
    data: images,
    isLoading,
    isStreaming,
    isComplete,
    error,
    isError: error != null,
  };
}
