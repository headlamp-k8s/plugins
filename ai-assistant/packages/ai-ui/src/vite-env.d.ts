/** Build-time environment variables consumed by ai-ui. */
interface ImportMetaEnv {
  readonly VITE_HEADLAMP_AI_TEST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
