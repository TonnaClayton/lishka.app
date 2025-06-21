import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.NODE_ENV === "development"
      ? "/"
      : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"],
  },
  plugins: [react(), tempo()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: true,
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.openai.com https://nominatim.openstreetmap.org https://customer-api.open-meteo.com https://marine-api.open-meteo.com https://api.tempo.new https://api-2.tempolabs.ai https://storage.googleapis.com https://tempolabs.ai https://*.tempolabs.ai; connect-src 'self' ws://localhost:* wss://localhost:* ws://angry-cori8-wqcq3.view-2.tempo-dev.app wss://angry-cori8-wqcq3.view-2.tempo-dev.app https://api.openai.com https://nominatim.openstreetmap.org https://customer-api.open-meteo.com https://marine-api.open-meteo.com https://lmjlmyqbwgxmiguxqdhi.supabase.co https://vercel.com/api/blob/ https://blob.vercel-storage.com https://*.blob.vercel-storage.com https://api.tempo.new https://api-2.tempolabs.ai https://storage.googleapis.com https://tempolabs.ai https://*.tempolabs.ai; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; object-src 'none';",
    },
  },
});
