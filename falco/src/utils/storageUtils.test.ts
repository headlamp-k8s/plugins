import { defaultSettings, FalcoSettings, loadSettings, saveSettings } from './storageUtils';

describe('loadSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default settings when nothing stored', () => {
    const settings = loadSettings();
    expect(settings).toEqual(defaultSettings);
  });

  it('should return a fresh copy of defaults (not the same reference)', () => {
    const settings1 = loadSettings();
    const settings2 = loadSettings();
    expect(settings1).not.toBe(settings2);
    expect(settings1).toEqual(settings2);
  });

  it('should load stored settings', () => {
    const stored: FalcoSettings = { backend: 'redis', redisUrl: 'http://localhost:8080' };
    localStorage.setItem('falco_event_storage_settings', JSON.stringify(stored));
    const settings = loadSettings();
    expect(settings).toEqual(stored);
  });

  it('should fall back to file backend for invalid backend value', () => {
    localStorage.setItem(
      'falco_event_storage_settings',
      JSON.stringify({ backend: 'invalid', redisUrl: 'test' })
    );
    const settings = loadSettings();
    expect(settings.backend).toBe('file');
  });

  it('should handle invalid JSON gracefully', () => {
    localStorage.setItem('falco_event_storage_settings', 'not-json');
    const settings = loadSettings();
    expect(settings).toEqual(defaultSettings);
  });

  it('should ensure redisUrl is a string', () => {
    localStorage.setItem(
      'falco_event_storage_settings',
      JSON.stringify({ backend: 'file', redisUrl: 123 })
    );
    const settings = loadSettings();
    expect(settings.redisUrl).toBe('');
  });
});

describe('saveSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save settings to localStorage', () => {
    const settings: FalcoSettings = { backend: 'redis', redisUrl: 'http://example.com' };
    saveSettings(settings);
    const stored = JSON.parse(localStorage.getItem('falco_event_storage_settings') || '');
    expect(stored).toEqual(settings);
  });

  it('should overwrite previous settings', () => {
    saveSettings({ backend: 'file', redisUrl: '' });
    saveSettings({ backend: 'redis', redisUrl: 'http://new-url.com' });
    const stored = JSON.parse(localStorage.getItem('falco_event_storage_settings') || '');
    expect(stored.backend).toBe('redis');
    expect(stored.redisUrl).toBe('http://new-url.com');
  });
});
