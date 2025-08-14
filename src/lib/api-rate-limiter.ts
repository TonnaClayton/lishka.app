/**
 * API Rate Limiter - DISABLED
 *
 * This module has been disabled to remove rate limiting completely.
 * All requests will execute immediately without any throttling.
 */

import { log } from "./logging";

/**
 * Execute an API request directly without rate limiting
 * @param requestFn Function that executes the API request
 * @param priority Priority parameter is kept for compatibility but ignored
 * @returns Promise that resolves with the API response
 */
export function executeWithRateLimit<T>(
  requestFn: () => Promise<T>,
  priority: number = 1, // Parameter kept for compatibility but ignored
): Promise<T> {
  log(
    `[API Rate Limiter] Executing request with priority ${priority}`,
  );
  // Execute the request immediately without any rate limiting
  return requestFn();
}
