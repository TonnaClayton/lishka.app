const env = import.meta.env;

export const config = {
  DEV: env.DEV,
  VITE_PUBLIC_POSTHOG_KEY: env.VITE_PUBLIC_POSTHOG_KEY,
  VITE_PUBLIC_POSTHOG_HOST: env.VITE_PUBLIC_POSTHOG_HOST,
};
