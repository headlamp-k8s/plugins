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
    if (!rawData) return { ...defaultSettings };

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
    return { ...defaultSettings };
  } catch (error) {
    console.error('Error loading settings:', error);
    return { ...defaultSettings };
  }
}

/**
 * Saves the settings to localStorage.
 * @param settings The settings object to save.
 */
export function saveSettings(settings: FalcoSettings): void {
  localStorage.setItem(FALCO_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Normalizes a user-provided Redis REST proxy URL.
 *
 * Validates that the URL is parseable and uses an http(s) scheme, and strips
 * any trailing slashes from the path. Throws an Error with a clear message if
 * the URL is invalid so callers can display it to the user.
 *
 * @param url The raw URL string from user input.
 * @returns The normalized URL (no trailing slash).
 */
export function normalizeRedisUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    throw new Error('Redis URL is empty.');
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Invalid Redis URL: ${trimmed}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Redis URL must use http or https scheme (got "${parsed.protocol}").`);
  }
  // Reconstruct without trailing slash on the path, preserving any query/hash.
  const base = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`;
  return base + (parsed.search || '') + (parsed.hash || '');
}
