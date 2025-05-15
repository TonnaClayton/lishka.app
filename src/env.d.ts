/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_PEXELS_API_KEY?: string;
  readonly VITE_TEMPO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
