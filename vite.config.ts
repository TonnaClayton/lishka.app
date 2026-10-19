import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.NODE_ENV === "development"
      ? "/"
      : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"],
  },
  ssr: {
    noExternal: ["posthog-js", "posthog-js/react"],
  },
  plugins: [
    react(),
    tempo(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
        "sitemap.xml",
        "robots.txt",
      ],
      manifest: {
        name: "Lishka - Fishing Companion",
        short_name: "Lishka",
        description:
          "Your ultimate fishing companion app for tracking catches, gear, and locations",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "favicon-16x16.png",
            sizes: "16x16",
            type: "image/png",
          },
          {
            src: "favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
        categories: ["sports", "lifestyle", "utilities"],
        screenshots: [],
      },
      workbox: {
        // HTML is deliberately EXCLUDED from precache. If we precached
        // index.html, workbox would serve the cached copy on every
        // navigation, and returning visitors would see the version of
        // the app from whenever they last loaded — old chunk hashes,
        // old copy, old badges. We serve HTML via the NetworkFirst
        // navigation rule below so every visit fetches the latest
        // index.html from Vercel (which is cheap; ~5ms edge hit).
        globPatterns: ["**/*.{js,css,ico,png,svg,jpg,jpeg,webp}"],
        // Landing hero + method backgrounds are 2-5 MB screenshots;
        // lift the precache ceiling to 6 MiB so the SW build passes.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Clean up outdated caches
        cleanupOutdatedCaches: true,
        // Skip waiting and claim clients immediately on update. Paired
        // with the controllerchange auto-reload in src/pwa.ts, this
        // means a new deploy is picked up on the current visit, not
        // the next one.
        skipWaiting: true,
        clientsClaim: true,
        // No SPA precache fallback — the NetworkFirst navigation
        // handler below owns HTML delivery (with an offline fallback
        // to the runtime HTML cache).
        navigateFallback: null,
        runtimeCaching: [
          {
            // Fresh HTML on every navigation. Network first, fall back
            // to the cached copy only if offline / timeout. This is
            // what makes deploys visible without users needing to
            // clear cache.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 20,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.(co|com)\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache JS/CSS chunks with NetworkFirst strategy
            urlPattern: /\.(?:js|css)$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "assets-cache",
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "@radix-ui/react-separator"],
          "utils-vendor": [
            "clsx",
            "class-variance-authority",
            "tailwind-merge",
            "lucide-react",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    port: process.env.NODE_ENV === "development" ? 3001 : undefined,
    allowedHosts: true,
    hmr: {
      overlay: false, // Disable error overlay to prevent blocking UI during development
    },
    headers: {
      // Temporarily disable CSP for development to avoid Vercel Blob issues
      // TODO: Re-enable with proper configuration for production
      // "Content-Security-Policy": "...",
    },
  },
});
