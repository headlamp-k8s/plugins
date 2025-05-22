/**
 * Storage key for the Falco event settings.
 */
export const FALCO_SETTINGS_KEY = 'falco_event_storage_settings';

/**
 * Type definition for Falco settings
 */
export interface FalcoSettings {
  backend: 'file' | 'redis';
  redisUrl: string;
}

/**
 * Default settings for the Falco plugin.
 */
export const defaultSettings: FalcoSettings = {
  backend: 'file',
  redisUrl: '', // Optional REST proxy URL.
};

/**
 * Type guard to check if a value is a valid backend type
 */
function isValidBackend(value: unknown): value is 'file' | 'redis' {
  return value === 'file' || value === 'redis';
}

/**
 * Loads the settings from localStorage.
 * @returns The settings object.
 */
export function loadSettings(): FalcoSettings {
  try {
    const rawData = localStorage.getItem(FALCO_SETTINGS_KEY);
    if (!rawData) return defaultSettings;

    const parsed = JSON.parse(rawData);

    // Type guard to ensure we have an object with the right properties
    if (parsed && typeof parsed === 'object' && 'backend' in parsed) {
      return {
        // Ensure backend has the correct type
        backend: isValidBackend(parsed.backend) ? parsed.backend : 'file',
        // Ensure redisUrl is a string
        redisUrl: typeof parsed.redisUrl === 'string' ? parsed.redisUrl : '',
      };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
}

/**
 * Saves the settings to localStorage.
 * @param settings The settings object to save.
 */
export function saveSettings(settings: FalcoSettings): void {
  localStorage.setItem(FALCO_SETTINGS_KEY, JSON.stringify(settings));
}
