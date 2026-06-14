// Minimal Vite ImportMeta augmentation so that import.meta.env compiles
// without pulling in the full vite package as a devDependency.
// See https://vitejs.dev/guide/env-and-mode#intellisense-for-typescript

interface ImportMetaEnv {
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  [key: string]: unknown;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
