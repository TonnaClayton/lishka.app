/**
 * API Helper functions with retries but NO rate limiting
 */

// Simple exponential backoff implementation
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Makes an API request with retry logic but no rate limiting
 * @param url The URL to fetch
 * @param options Fetch options
 * @param maxRetries Maximum number of retries (default: 3)
 * @param initialDelay Initial delay in ms before first retry (default: 1000)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<Response> {
  // Direct fetch without rate limiting
  let lastError: Error;
  let delay = initialDelay;

  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    try {
      const response = await fetch(url, options);

      // If we get a 429 (rate limit) or 500-level error, wait and retry
      if (
        response.status === 429 ||
        (response.status >= 500 && response.status < 600)
      ) {
        console.log(
          `API error (${response.status}). Retry ${retryCount + 1}/${maxRetries} after ${delay}ms`,
        );

        // If this is our last retry, return the response anyway
        if (retryCount === maxRetries) {
          return response;
        }

        // Wait before retrying
        await sleep(delay);

        // Exponential backoff - double the delay for next retry
        delay *= 2;
        continue;
      }

      // Log non-200 responses for debugging
      if (!response.ok) {
        console.error(`API request failed with status: ${response.status}`);
        try {
          const errorText = await response.text();
          console.error(`Error response: ${errorText}`);
          // Parse error response if possible
          try {
            const errorJson = JSON.parse(errorText);
            console.error("Parsed error:", errorJson);
            if (errorJson.error) {
              throw new Error(
                `OpenAI API Error: ${errorJson.error.message || errorJson.error}`,
              );
            }
          } catch (parseError) {
            console.error("Could not parse error response as JSON");
          }
        } catch (e) {
          console.error("Could not read error response body");
        }
      }

      // For any other response, return it
      return response;
    } catch (error) {
      console.error(
        `API request failed (attempt ${retryCount + 1}/${maxRetries + 1}):`,
        error,
      );
      lastError = error as Error;

      // If this is our last retry, throw the error
      if (retryCount === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await sleep(delay);

      // Exponential backoff
      delay *= 2;
    }
  }

  // This should never be reached due to the throw in the loop,
  // but TypeScript needs it for type safety
  throw lastError!;
}

/**
 * Cache API responses in localStorage with expiration
 * @param key Cache key
 * @param data Data to cache
 * @param ttlMs Time to live in milliseconds (default: 1 hour)
 */
export function cacheApiResponse(
  key: string,
  data: any,
  ttlMs: number = 3600000,
): void {
  try {
    const cacheItem = {
      data,
      expiry: Date.now() + ttlMs,
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error("Error caching API response:", error);
  }
}

/**
 * Get cached API response if not expired
 * @param key Cache key
 * @returns Cached data or null if expired/not found
 */
export function getCachedApiResponse(key: string): any {
  try {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;

    const { data, expiry } = JSON.parse(cachedItem);

    // Return null if expired
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error retrieving cached API response:", error);
    return null;
  }
}
