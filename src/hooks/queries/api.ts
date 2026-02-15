import { config } from "@/lib/config";
import { log } from "@/lib/logging";

type SupabaseLocalAuthToken = {
  access_token: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  token_type: string;
};

export async function api<T = any>(
  path: string,
  options?: RequestInit,
  isFormData?: boolean,
): Promise<T> {
  const url = `${config.BACKEND_URL}/${path}`;

  const supabaseLocalAuthTokenKey = `sb-${config.VITE_SUPABASE_PROJECT_ID}-auth-token`;

  const supabaseLocalAuthTokenRaw = localStorage.getItem(
    supabaseLocalAuthTokenKey,
  );

  let supabaseLocalAuthToken: SupabaseLocalAuthToken | null = null;

  if (supabaseLocalAuthTokenRaw) {
    supabaseLocalAuthToken = JSON.parse(
      supabaseLocalAuthTokenRaw,
    ) as SupabaseLocalAuthToken;
  }

  const defaultHeaders: Record<string, string> = {
    Accept: "*/*",
    "Content-Type": "application/json",
  };

  if (isFormData) {
    // Remove the default content type
    delete defaultHeaders["Content-Type"];
  }

  if (supabaseLocalAuthToken?.access_token) {
    defaultHeaders["Authorization"] =
      `Bearer ${supabaseLocalAuthToken.access_token}`;
  }

  if (supabaseLocalAuthToken?.refresh_token) {
    defaultHeaders["x-lishka-user-refresh-token"] =
      supabaseLocalAuthToken.refresh_token;
  }

  const mergedHeaders = new Headers(defaultHeaders);

  if (options?.headers) {
    const incoming = new Headers(options.headers as HeadersInit);
    incoming.forEach((value, key) => mergedHeaders.set(key, value));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { headers: _headers, ...restOptions } = options ?? {};

  const response = await fetch(url, {
    ...restOptions,
    method: restOptions.method ?? "GET",
    headers: mergedHeaders,
  });

  // Handle HTTP error status codes
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error("content is too large");
    }
    if (response.status === 400) {
      throw new Error(`Bad request: ${response.statusText}`);
    }
    if (response.status === 500) {
      throw new Error(`Server error: ${response.statusText}`);
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function apiStreamed(
  path: string,
  options?: RequestInit,
  isFormData?: boolean,
): Promise<ReadableStream<Uint8Array> | null> {
  const url = `${config.BACKEND_URL}/${path}`;

  const supabaseLocalAuthTokenKey = `sb-${config.VITE_SUPABASE_PROJECT_ID}-auth-token`;

  const supabaseLocalAuthTokenRaw = localStorage.getItem(
    supabaseLocalAuthTokenKey,
  );

  let supabaseLocalAuthToken: SupabaseLocalAuthToken | null = null;

  if (supabaseLocalAuthTokenRaw) {
    supabaseLocalAuthToken = JSON.parse(
      supabaseLocalAuthTokenRaw,
    ) as SupabaseLocalAuthToken;
  }

  const defaultHeaders: Record<string, string> = {
    Accept: "*/*",
    "Content-Type": "application/json",
  };

  if (isFormData) {
    // Remove the default content type
    delete defaultHeaders["Content-Type"];
  }

  if (supabaseLocalAuthToken?.access_token) {
    defaultHeaders["Authorization"] =
      `Bearer ${supabaseLocalAuthToken.access_token}`;
  }

  if (supabaseLocalAuthToken?.refresh_token) {
    defaultHeaders["x-lishka-user-refresh-token"] =
      supabaseLocalAuthToken.refresh_token;
  }

  const mergedHeaders = new Headers(defaultHeaders);

  if (options?.headers) {
    const incoming = new Headers(options.headers as HeadersInit);
    incoming.forEach((value, key) => mergedHeaders.set(key, value));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { headers: _headers, ...restOptions } = options ?? {};

  // Add timeout for initial connection (60 seconds).
  // AI streaming endpoints need extra time for auth, rate-limit check,
  // session creation, and AI model warm-up before the first byte arrives.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      ...restOptions,
      method: restOptions.method ?? "GET",
      headers: mergedHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle HTTP error status codes

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error("content is too large");
      }
      if (response.status === 400) {
        throw new Error(`Bad request: ${response.statusText}`);
      }
      if (response.status === 500) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.body;
  } catch (error) {
    log("[API STREAMED] Error:", error);
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out — please try again");
    }
    throw error;
  }
}
