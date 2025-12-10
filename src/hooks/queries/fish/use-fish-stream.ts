import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { FishData } from "./use-fish-data";
import { apiStreamed } from "../api";
import { DEFAULT_LOCATION } from "@/lib/const";

interface FishStreamEvent {
  type:
    | "init"
    | "cached_fish"
    | "status"
    | "fish"
    | "progress"
    | "complete"
    | "error";
  message?: string;
  location?: string;
  cached_count?: number;
  data?: any;
  count?: number;
  percentage?: number;
  checked?: number;
  found?: number;
  new_found?: number;
  total?: number;
  total_found?: number;
  cached?: number;
  newly_discovered?: number;
  total_checked?: number;
}

interface UseFishStreamOptions {
  userLocation?: string;
  autoStart?: boolean;
}

interface UseFishStreamReturn {
  cachedFish: FishData[];
  newFish: FishData[];
  allFish: FishData[];
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  progress: number;
  statusMessage: string;
  stats: {
    checked: number;
    found: number;
    newFound: number;
    total: number;
    cachedCount: number;
  };
  startStream: () => Promise<void>;
  stopStream: () => void;
  reset: () => void;
}

export function useFishStream(
  options?: UseFishStreamOptions,
): UseFishStreamReturn {
  const { userLocation, autoStart = false } = options || {};
  const [cachedFish, setCachedFish] = useState<FishData[]>([]);
  const [newFish, setNewFish] = useState<FishData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [stats, setStats] = useState({
    checked: 0,
    found: 0,
    newFound: 0,
    total: 0,
    cachedCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef<string>("");
  const hasAutoStartedRef = useRef(false);
  const seenFishRef = useRef<Set<string>>(new Set());

  const handleStreamChunk = useCallback((chunk: string) => {
    if (!chunk) return;

    try {
      streamBufferRef.current += chunk;

      // Split by newlines - backend sends newline-delimited JSON or SSE format
      const lines = streamBufferRef.current.split("\n");

      // Keep the last line in the buffer if it's incomplete
      if (!streamBufferRef.current.endsWith("\n")) {
        streamBufferRef.current = lines.pop() ?? "";
      } else {
        streamBufferRef.current = "";
      }

      for (const line of lines) {
        if (!line.trim()) continue;

        // Check if this is SSE format (data: prefix) or raw JSON
        let jsonData = line.trim();
        if (line.startsWith("data:")) {
          jsonData = line.replace(/^data:\s?/, "").trim();
        }

        if (!jsonData) continue;

        const event: FishStreamEvent = JSON.parse(jsonData);
        handleEvent(event);
      }
    } catch (e) {
      console.error("Failed to parse stream chunk:", e);
    }
  }, []);

  const handleEvent = (event: FishStreamEvent) => {
    switch (event.type) {
      case "init":
        setStatusMessage(event.message || "Initializing...");
        break;

      case "status":
        setStatusMessage(event.message || "");
        if (event.cached_count !== undefined) {
          setStats((prev) => ({ ...prev, cachedCount: event.cached_count! }));
        }
        break;

      case "cached_fish":
        if (event.data) {
          // Transform snake_case API response to camelCase FishData
          const transformedFish: FishData = {
            name: event.data.name || event.data.common_name || "",
            scientificName:
              event.data.scientific_name || event.data.scientificName || "",
            localName: event.data.local_name || event.data.localName,
            habitat: event.data.habitat || "",
            difficulty: (event.data.difficulty as any) || "Easy",
            season: event.data.season || "",
            isToxic: false,
            image: event.data.image_url || event.data.image,
            slug: event.data.slug,
          };

          // Check if we've seen this scientific name before (in either array)
          if (!seenFishRef.current.has(transformedFish.scientificName)) {
            seenFishRef.current.add(transformedFish.scientificName);
            setCachedFish((prev) => [...prev, transformedFish]);
          }
        }
        break;

      case "fish":
        if (event.data) {
          // Transform snake_case API response to camelCase FishData
          const transformedFish: FishData = {
            name: event.data.name || event.data.common_name || "",
            scientificName:
              event.data.scientific_name || event.data.scientificName || "",
            habitat:
              event.data.water_type === "saltwater" ? "Marine" : "Freshwater",
            difficulty: "Easy", // Default for now
            season: "Year-round", // Default for now
            isToxic: false,
            image: event.data.image_url || event.data.image,
          };

          // Check if we've seen this scientific name before (in either array)
          if (!seenFishRef.current.has(transformedFish.scientificName)) {
            seenFishRef.current.add(transformedFish.scientificName);
            setNewFish((prev) => [...prev, transformedFish]);
          }
        }
        break;

      case "progress":
        if (event.percentage !== undefined) {
          setProgress(event.percentage);
        }
        if (
          event.checked !== undefined ||
          event.found !== undefined ||
          event.new_found !== undefined ||
          event.total !== undefined
        ) {
          setStats((prev) => ({
            ...prev,
            checked: event.checked ?? prev.checked,
            found: event.found ?? prev.found,
            newFound: event.new_found ?? prev.newFound,
            total: event.total ?? prev.total,
          }));
        }
        break;

      case "complete":
        setIsComplete(true);
        setIsStreaming(false);
        setStatusMessage(event.message || "Complete");
        if (event.total_found !== undefined) {
          setStats((prev) => ({
            ...prev,
            found: event.total_found!,
            cachedCount: event.cached || prev.cachedCount,
            newFound: event.newly_discovered || prev.newFound,
            checked: event.total_checked || prev.checked,
          }));
        }
        break;

      case "error":
        setError(event.message || "An error occurred");
        setIsStreaming(false);
        break;
    }
  };

  const startStream = useCallback(async () => {
    if (isStreaming) return;

    // Reset state
    setCachedFish([]);
    setNewFish([]);
    setIsComplete(false);
    setError(null);
    setProgress(0);
    setStatusMessage("");
    setStats({
      checked: 0,
      found: 0,
      newFound: 0,
      total: 0,
      cachedCount: 0,
    });
    streamBufferRef.current = "";
    seenFishRef.current.clear();

    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();

      // Use the existing apiStreamed function
      const stream = await apiStreamed(
        "fish/stream",
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
        handleStreamChunk(chunk);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
        console.error("Stream error:", err);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [isStreaming, handleStreamChunk]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setCachedFish([]);
    setNewFish([]);
    setIsComplete(false);
    setError(null);
    setProgress(0);
    setStatusMessage("");
    setStats({
      checked: 0,
      found: 0,
      newFound: 0,
      total: 0,
      cachedCount: 0,
    });
    streamBufferRef.current = "";
    seenFishRef.current.clear();
    hasAutoStartedRef.current = false;
  }, [stopStream]);

  // Auto-start stream when location changes (if enabled)
  useEffect(() => {
    if (
      autoStart &&
      userLocation &&
      userLocation !== DEFAULT_LOCATION.name &&
      !isStreaming &&
      !isComplete &&
      !hasAutoStartedRef.current
    ) {
      console.log("🎯 [Fish Stream] Auto-starting for location:", userLocation);
      hasAutoStartedRef.current = true;
      startStream();
    }
  }, [userLocation, autoStart, isStreaming, isComplete, startStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const allFish = useMemo(() => {
    const fishMap = new Map<string, FishData>();

    // Add cached fish first
    cachedFish.forEach((fish) => {
      fishMap.set(fish.scientificName, fish);
    });

    // Add new fish (will overwrite if duplicate)
    newFish.forEach((fish) => {
      fishMap.set(fish.scientificName, fish);
    });

    return Array.from(fishMap.values());
  }, [cachedFish, newFish]);

  return {
    cachedFish,
    newFish,
    allFish,
    isStreaming,
    isComplete,
    error,
    progress,
    statusMessage,
    stats,
    startStream,
    stopStream,
    reset,
  };
}
