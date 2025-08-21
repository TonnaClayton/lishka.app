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
      ],
      manifest: {
        name: "Lishka - Fishing Companion",
        short_name: "Lishka",
        description:
          "Your ultimate fishing companion app for tracking catches, gear, and locations",
        theme_color: "#1e40af",
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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "openai-cache",
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
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
            urlPattern: /^https:\/\/.*\.open-meteo\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "weather-cache",
              networkTimeoutSeconds: 10,
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
          // React and core libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          // UI libraries
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-select",
            "@radix-ui/react-accordion",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-popover",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-switch",
            "@radix-ui/react-slider",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-tooltip",
            "framer-motion",
            "vaul",
          ],

          // Data/API libraries
          "data-vendor": [
            "@supabase/supabase-js",
            "@tanstack/react-query",
            "axios",
          ],

          // Map libraries
          "map-vendor": ["leaflet", "react-leaflet"],

          // Image/media libraries
          "media-vendor": [
            "html2canvas",
            "html-to-image",
            "react-image-crop",
            "exif-js",
          ],

          // AI/ML libraries
          "ai-vendor": ["@ai-sdk/openai", "ai"],

          // Form libraries
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],

          // Utility libraries
          "utils-vendor": [
            "date-fns",
            "clsx",
            "class-variance-authority",
            "tailwind-merge",
            "lucide-react",
            "@radix-ui/react-icons",
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
    port: process.env.NODE_ENV === "development" ? 3000 : undefined,
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
