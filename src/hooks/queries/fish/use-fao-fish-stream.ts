import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { FishData } from "./use-fish-data";
import { apiStreamed } from "../api";
import { generateFishSlug } from "./utils";
import { parseStreamChunk, isNewFish } from "./fish-stream-utils";

export interface FAOFishStreamEvent {
  type: "init" | "status" | "fish" | "progress" | "complete" | "error";
  message?: string;
  data?: any;
  count?: number;
  checked?: number;
  found?: number;
  new_found?: number;
  total?: number;
  percentage?: number;
  total_found?: number;
  newly_discovered?: number;
  total_checked?: number;
  location?: string;
}

export interface UseFAOFishStreamReturn {
  // Fish data
  fish: FishData[];
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
  };

  // FAO area info
  faoAreas: Array<{
    fao_code: string;
    major_code: string;
    fao_name: string;
  }>;
  userLocation: {
    latitude: number;
    longitude: number;
    location_name?: string;
  } | null;

  // Controls
  startStream: (options?: {
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  stopStream: () => void;
  reset: () => void;
}

export interface UseFAOFishStreamOptions {
  latitude?: number;
  longitude?: number;
  autoStart?: boolean;
}

export function useFAOFishStream(
  options?: UseFAOFishStreamOptions,
): UseFAOFishStreamReturn {
  const { latitude, longitude, autoStart = false } = options || {};

  const [fish, setFish] = useState<FishData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [faoAreas, setFaoAreas] = useState<
    Array<{
      fao_code: string;
      major_code: string;
      fao_name: string;
    }>
  >([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    location_name?: string;
  } | null>(null);
  const [stats, setStats] = useState({
    checked: 0,
    found: 0,
    newFound: 0,
    total: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef<string>("");
  const hasAutoStartedRef = useRef(false);
  const seenFishRef = useRef<Set<string>>(new Set());

  const handleEvent = useCallback((event: FAOFishStreamEvent) => {
    switch (event.type) {
      case "init":
        setStatusMessage(event.message || "Initializing...");
        break;

      case "status":
        setStatusMessage(event.message || "");
        break;

      case "fish":
        if (event.data) {
          const fishName = event.data.name || event.data.common_name || "";
          const scientificName =
            event.data.scientific_name || event.data.scientificName || "";
          const transformedFish: FishData = {
            id: event.data.id,
            name: fishName,
            scientificName: scientificName,
            localName: event.data.local_name || event.data.localName,
            habitat: event.data.habitat || "",
            difficulty: (event.data.difficulty as any) || "Easy",
            season: event.data.season || "",
            isToxic: event.data.is_toxic ?? event.data.isToxic ?? false,
            dangerType: event.data.danger_type || event.data.dangerType,
            riskBadge: event.data.risk_badge || event.data.riskBadge || null,
            image: event.data.image,
            slug:
              event.data.slug || generateFishSlug(scientificName || fishName),
            flaggedForReview: event.data.flagged_for_review ?? false,
          };

          if (isNewFish(transformedFish.scientificName, seenFishRef)) {
            setFish((prev) => [...prev, transformedFish]);
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
  }, []);

  const handleStreamChunk = useCallback(
    (chunk: string) => {
      parseStreamChunk<FAOFishStreamEvent>(chunk, streamBufferRef, handleEvent);
    },
    [handleEvent],
  );

  const startStream = useCallback(
    async (overrideOptions?: { latitude?: number; longitude?: number }) => {
      if (isStreaming) return;

      // Use override options or fall back to hook options
      const finalLat = overrideOptions?.latitude ?? latitude;
      const finalLon = overrideOptions?.longitude ?? longitude;

      // Reset state
      setFish([]);
      setIsComplete(false);
      setError(null);
      setProgress(0);
      setStatusMessage("");
      setFaoAreas([]);
      setUserLocation(null);
      setStats({
        checked: 0,
        found: 0,
        newFound: 0,
        total: 0,
      });
      streamBufferRef.current = "";
      seenFishRef.current.clear();

      setIsStreaming(true);

      try {
        abortControllerRef.current = new AbortController();

        const queryParams = new URLSearchParams();
        if (typeof finalLat === "number") {
          queryParams.set("latitude", String(finalLat));
        }
        if (typeof finalLon === "number") {
          queryParams.set("longitude", String(finalLon));
        }

        const stream = await apiStreamed(
          `fao/fish/stream?${queryParams.toString()}`,
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
    },
    [isStreaming, latitude, longitude, handleStreamChunk],
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setFish([]);
    setIsComplete(false);
    setError(null);
    setProgress(0);
    setStatusMessage("");
    setFaoAreas([]);
    setUserLocation(null);
    setStats({
      checked: 0,
      found: 0,
      newFound: 0,
      total: 0,
    });
    streamBufferRef.current = "";
    seenFishRef.current.clear();
    hasAutoStartedRef.current = false;
  }, [stopStream]);

  useEffect(() => {
    if (
      autoStart &&
      !isStreaming &&
      !isComplete &&
      !hasAutoStartedRef.current
    ) {
      hasAutoStartedRef.current = true;
      startStream();
    }
  }, [autoStart, isStreaming, isComplete, startStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // All fish (no cached/new distinction for FAO endpoint)
  const allFish = useMemo(() => fish, [fish]);

  return {
    fish,
    allFish,
    isStreaming,
    isComplete,
    error,
    progress,
    statusMessage,
    stats,
    faoAreas,
    userLocation,
    startStream,
    stopStream,
    reset,
  };
}
