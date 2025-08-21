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
): Promise<T> {
  const url = `${config.BACKEND_URL}/${path}`;

  const supabaseLocalAuthTokenKey = `sb-${config.VITE_SUPABASE_PROJECT_ID}-auth-token`;

  const supabaseLocalAuthTokenRaw = localStorage.getItem(
    supabaseLocalAuthTokenKey,
  );

  console.log("supabaseLocalAuthTokenRaw", supabaseLocalAuthTokenRaw);

  let supabaseLocalAuthToken: SupabaseLocalAuthToken | null = null;

  if (supabaseLocalAuthTokenRaw) {
    supabaseLocalAuthToken = JSON.parse(
      supabaseLocalAuthTokenRaw,
    ) as SupabaseLocalAuthToken;
  }

  console.log("supabaseLocalAuthToken", supabaseLocalAuthToken);

  const defaultHeaders: Record<string, string> = {
    Accept: "*/*",
    "Content-Type": "application/json",
  };

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
