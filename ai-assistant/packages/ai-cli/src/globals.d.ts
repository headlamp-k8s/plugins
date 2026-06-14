// Minimal type augmentations to compile ai-common sources when consumed as a
// file: dependency. The desktopApi property is injected by the Electron renderer
// and accessed optionally in ai-common; the CLI never calls it.

interface Window {
  desktopApi?: Record<string, any>;
}

interface ImportMetaEnv {
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  [key: string]: unknown;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
