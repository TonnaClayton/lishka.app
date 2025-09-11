import { config } from "@/lib/config";

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

  const response = await fetch(url, {
    ...restOptions,
    method: restOptions.method ?? "GET",
    headers: mergedHeaders,
  });

  return response.body;
}
