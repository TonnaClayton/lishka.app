/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_PEXELS_API_KEY?: string;
  readonly VITE_TEMPO?: string;
  readonly BLOB_READ_WRITE_TOKEN?: string;
  readonly VITE_BLOB_READ_WRITE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
