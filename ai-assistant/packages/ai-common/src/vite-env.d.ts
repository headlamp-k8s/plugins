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

// desktopApi is injected by @kinvolk/headlamp-plugin in the Electron renderer.
// Modules in ai-common may read from it optionally; declaring it here keeps
// ai-common independent of that package.
interface Window {
  desktopApi?: Record<string, any>;
}
