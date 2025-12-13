import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { FishData } from "./use-fish-data";
import { apiStreamed } from "../api";
import { DEFAULT_LOCATION } from "@/lib/const";

export interface ToxicFishStreamEvent {
  type:
    | "init"
    | "cached_fish"
    | "status"
    | "toxic_fish"
    | "progress"
    | "complete"
    | "error";
  message?: string;
  data?: any; // API returns snake_case, we transform it
  count?: number;
  checked?: number;
  found?: number;
  new_found?: number;
  total?: number;
  percentage?: number;
  cached_count?: number;
  total_found?: number;
  cached?: number;
  newly_discovered?: number;
  total_checked?: number;
  location?: string;
  total_species?: number;
}

export interface UseToxicFishStreamReturn {
  // Fish data
  cachedFish: FishData[];
  newFish: FishData[];
  allFish: FishData[];

  // Status
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;

  // Progress
  progress: number;
  statusMessage: string;
  stats: {
    checked: number;
    found: number;
    newFound: number;
    total: number;
    cachedCount: number;
  };

  // Controls
  startStream: () => Promise<void>;
  stopStream: () => void;
  reset: () => void;
}

export interface UseToxicFishStreamOptions {
  userLocation?: string;
  autoStart?: boolean;
}

export function useToxicFishStream(
  options?: UseToxicFishStreamOptions,
): UseToxicFishStreamReturn {
  const { userLocation, autoStart = true } = options || {};

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
  const seenFishRef = useRef<Set<string>>(new Set()); // Track all scientific names we've seen

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

        const event: ToxicFishStreamEvent = JSON.parse(jsonData);
        handleEvent(event);
      }
    } catch (e) {
      console.error("Failed to parse stream chunk:", e);
    }
  }, []);

  const handleEvent = (event: ToxicFishStreamEvent) => {
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
            isToxic: event.data.is_toxic ?? event.data.isToxic ?? true, // Default to true since cached fish in toxic section should all be toxic
            dangerType:
              event.data.danger_type ||
              event.data.dangerType ||
              (event.data.is_toxic || event.data.isToxic
                ? "Toxic - handle with caution"
                : undefined),
            image: event.data.image,
            slug: event.data.slug,
          };

          // Check if we've seen this scientific name before (in either array)
          if (!seenFishRef.current.has(transformedFish.scientificName)) {
            seenFishRef.current.add(transformedFish.scientificName);
            setCachedFish((prev) => [...prev, transformedFish]);
          } else {
            console.warn(
              `⚠️  Duplicate cached fish ignored: ${transformedFish.scientificName}`,
            );
          }
        }
        break;

      case "toxic_fish":
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
            isToxic: event.data.is_toxic ?? event.data.isToxic ?? true,
            dangerType:
              event.data.danger_type ||
              event.data.dangerType ||
              (event.data.is_toxic || event.data.isToxic
                ? "Toxic - handle with caution"
                : undefined),
            image: event.data.image,
            slug: event.data.slug,
          };

          // Check if we've seen this scientific name before (in either array)
          if (!seenFishRef.current.has(transformedFish.scientificName)) {
            seenFishRef.current.add(transformedFish.scientificName);
            setNewFish((prev) => [...prev, transformedFish]);
          } else {
            console.warn(
              `⚠️  Duplicate toxic fish ignored: ${transformedFish.scientificName}`,
            );
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
        setStatusMessage(event.message || "Complete!");
        setIsComplete(true);
        setProgress(100);
        if (event.total_found !== undefined) {
          setStats((prev) => ({
            ...prev,
            found: event.total_found!,
            newFound: event.newly_discovered ?? prev.newFound,
            checked: event.total_checked ?? prev.checked,
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
    seenFishRef.current.clear(); // Reset the seen fish tracker

    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();

      // Use the existing apiStreamed function
      const stream = await apiStreamed(
        "fish/toxic/stream",
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
    seenFishRef.current.clear(); // Reset the seen fish tracker
    hasAutoStartedRef.current = false;
  }, [stopStream]);

  useEffect(() => {
    if (
      autoStart &&
      userLocation &&
      userLocation !== DEFAULT_LOCATION.name &&
      !isStreaming &&
      !isComplete &&
      !hasAutoStartedRef.current
    ) {
      console.log(
        "🎯 [Toxic Fish Stream] Auto-starting for location:",
        userLocation,
      );
      hasAutoStartedRef.current = true;
      startStream();
    }
  }, [userLocation, autoStart, isStreaming, isComplete, startStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Combine and deduplicate cached + new fish
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
