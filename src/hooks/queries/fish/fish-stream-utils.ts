/**
 * Shared utilities for fish stream hooks
 * Extracted common logic to reduce duplication between use-fish-stream and use-toxic-fish-stream
 */

/**
 * Parse stream chunks and handle SSE/newline-delimited JSON format
 * @param chunk - Raw chunk from stream
 * @param bufferRef - Ref to buffer for incomplete lines
 * @param onEvent - Callback to handle parsed events
 */
export function parseStreamChunk<T>(
  chunk: string,
  bufferRef: { current: string },
  onEvent: (event: T) => void,
): void {
  if (!chunk) return;

  try {
    bufferRef.current += chunk;

    // Split by newlines - backend sends newline-delimited JSON or SSE format
    const lines = bufferRef.current.split("\n");

    // Keep the last line in the buffer if it's incomplete
    if (!bufferRef.current.endsWith("\n")) {
      bufferRef.current = lines.pop() ?? "";
    } else {
      bufferRef.current = "";
    }

    for (const line of lines) {
      if (!line.trim()) continue;

      // Check if this is SSE format (data: prefix) or raw JSON
      let jsonData = line.trim();
      if (line.startsWith("data:")) {
        jsonData = line.replace(/^data:\s?/, "").trim();
      }

      if (!jsonData) continue;

      const event: T = JSON.parse(jsonData);
      onEvent(event);
    }
  } catch (e) {
    console.error("Failed to parse stream chunk:", e);
  }
}

/**
 * Create a deduplicated array of fish from cached and new fish arrays
 * @param cachedFish - Array of cached fish
 * @param newFish - Array of newly discovered fish
 * @returns Deduplicated array of all fish
 */
export function combineAndDeduplicateFish<T extends { scientificName: string }>(
  cachedFish: T[],
  newFish: T[],
): T[] {
  const fishMap = new Map<string, T>();

  // Add cached fish first
  cachedFish.forEach((fish) => {
    fishMap.set(fish.scientificName, fish);
  });

  // Add new fish (will overwrite if duplicate)
  newFish.forEach((fish) => {
    fishMap.set(fish.scientificName, fish);
  });

  return Array.from(fishMap.values());
}

/**
 * Check if a fish has been seen before and add it to the seen set
 * @param scientificName - Scientific name of the fish
 * @param seenRef - Ref to Set of seen scientific names
 * @returns true if fish is new (not seen before), false if duplicate
 */
export function isNewFish(
  scientificName: string,
  seenRef: { current: Set<string> },
): boolean {
  if (seenRef.current.has(scientificName)) {
    return false;
  }
  seenRef.current.add(scientificName);
  return true;
}
