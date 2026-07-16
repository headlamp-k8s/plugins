// Minimal Vite ImportMeta augmentation so that import.meta.env compiles
// without pulling in the full vite package as a devDependency.
// See https://vitejs.dev/guide/env-and-mode\#intellisense-for-typescript

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
  /** Electron process marker exposed in renderer builds. */
  process?: { type?: string };
  /** Headlamp backend port used by local Electron development. */
  headlampBackendPort?: number;
  /** Docker Desktop client marker injected by the host. */
  ddClient?: unknown;
  /** Base path configured for Headlamp deployments. */
  headlampBaseUrl?: string;
  desktopApi?: {
    mcp?: {
      getConfig(): Promise<{
        success: boolean;
        config?: import('./mcp/types').MCPSettings;
        error?: string;
      }>;
      getToolsConfig(): Promise<{
        success: boolean;
        config?: import('./mcp/types').MCPToolsConfig;
        error?: string;
      }>;
    };
  };
}
