import { useState, useCallback, useRef } from "react";
import { FishData } from "./use-fish-data";

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

export function useToxicFishStream(
  baseUrl: string = "/fish/toxic/stream",
): UseToxicFishStreamReturn {
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

    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch(baseUrl, {
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: ToxicFishStreamEvent = JSON.parse(line.slice(6));
              handleEvent(event);
            } catch (e: unknown) {
              console.error("Failed to parse SSE event:", line, e);
            }
          }
        }
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
  }, [baseUrl, isStreaming]);

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
            isToxic: event.data.is_toxic ?? event.data.isToxic ?? false,
            dangerType: event.data.danger_type || event.data.dangerType,
            image: event.data.image_url || event.data.image,
            slug: event.data.slug,
          };
          setCachedFish((prev) => [...prev, transformedFish]);
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
            dangerType: event.data.danger_type || event.data.dangerType,
            image: event.data.image_url || event.data.image,
            slug: event.data.slug,
          };
          setNewFish((prev) => [...prev, transformedFish]);
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
  }, [stopStream]);

  const allFish = [...cachedFish, ...newFish];

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
