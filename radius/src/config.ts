import { DEFAULT_UCP_API_VERSION, PLUGIN_NAME } from './index';

/**
 * Interface for plugin settings stored in localStorage
 */
interface RadiusPluginSettings {
  ucpApiVersion?: string;
}

/**
 * Get the configured UCP API version from plugin settings
 * Falls back to the default version if not configured
 *
 * @returns The UCP API version string
 */
export function getUCPApiVersion(): string {
  try {
    const settingsKey = `plugin.settings.${PLUGIN_NAME}`;
    const settingsJson = localStorage.getItem(settingsKey);

    if (settingsJson) {
      const settings: RadiusPluginSettings = JSON.parse(settingsJson);
      if (settings.ucpApiVersion) {
        return settings.ucpApiVersion;
      }
    }
  } catch (error) {
    console.warn('Failed to load Radius plugin settings, using default API version:', error);
  }

  return DEFAULT_UCP_API_VERSION;
}
