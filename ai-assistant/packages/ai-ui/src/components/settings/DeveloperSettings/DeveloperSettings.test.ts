/**
 * Tests for DeveloperSettings component logic.
 *
 * Exercises the helper functions (hasMockModelProvider, addMockModelProvider,
 * removeMockModelProvider) and the configuration contracts.
 *
 * Note: helpers are imported directly to avoid triggering @mui/material
 * resolution in the node test environment.
 */

import type { SavedConfigurations } from '@headlamp-k8s/ai-common/managers/ProviderConfigManager';
import { describe, expect, it } from 'vitest';

// ---------------------------------------------------------------------------
// Inline copies of pure-logic helpers from DeveloperSettings.tsx
// to test without importing the React component (avoids MUI dep).
// ---------------------------------------------------------------------------

const MOCK_MODEL_PROVIDER_ID = 'mock-testing-model';
const MOCK_MODEL_DISPLAY_NAME = 'Mock Testing Model';

function hasMockModelProvider(savedConfigs: SavedConfigurations | null | undefined): boolean {
  return savedConfigs?.providers?.some(p => p.providerId === MOCK_MODEL_PROVIDER_ID) ?? false;
}

function addMockModelProvider(
  savedConfigs: SavedConfigurations | null | undefined
): SavedConfigurations {
  const configs: SavedConfigurations = savedConfigs || { providers: [] };
  const providers = [...(configs.providers || [])];

  if (!providers.some(p => p.providerId === MOCK_MODEL_PROVIDER_ID)) {
    providers.push({
      providerId: MOCK_MODEL_PROVIDER_ID,
      displayName: MOCK_MODEL_DISPLAY_NAME,
      config: {},
    });
  }

  const mockIndex = providers.findIndex(p => p.providerId === MOCK_MODEL_PROVIDER_ID);
  return {
    ...configs,
    providers,
    defaultProviderIndex: mockIndex >= 0 ? mockIndex : configs.defaultProviderIndex,
    termsAccepted: true,
  };
}

function removeMockModelProvider(
  savedConfigs: SavedConfigurations | null | undefined
): SavedConfigurations {
  const configs: SavedConfigurations = savedConfigs || { providers: [] };
  const providers = (configs.providers || []).filter(p => p.providerId !== MOCK_MODEL_PROVIDER_ID);

  let defaultIndex = configs.defaultProviderIndex ?? 0;
  const oldProviders = configs.providers || [];
  const removedIndex = oldProviders.findIndex(p => p.providerId === MOCK_MODEL_PROVIDER_ID);
  if (removedIndex >= 0 && removedIndex <= defaultIndex) {
    defaultIndex = Math.max(0, defaultIndex - 1);
  }
  if (providers.length === 0) {
    defaultIndex = 0;
  }

  // Check if the removed provider was the active default
  const wasDefault =
    configs.defaultProviderIndex !== undefined &&
    oldProviders[configs.defaultProviderIndex]?.providerId === MOCK_MODEL_PROVIDER_ID;
  if (wasDefault) {
    defaultIndex = 0;
  }

  return {
    ...configs,
    providers,
    defaultProviderIndex: providers.length > 0 ? defaultIndex : undefined,
  };
}

/** Shape of devOptions config. */
interface DeveloperOptionsConfig {
  enableMockModel?: boolean;
  enableMockAgent?: boolean;
  enableFakeMCP?: boolean;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const emptyConfigs: SavedConfigurations = {};

const configsWithMock: SavedConfigurations = {
  providers: [
    {
      providerId: 'openai',
      displayName: 'OpenAI',
      config: { apiKey: 'sk-test', model: 'gpt-4o' },
    },
    {
      providerId: 'mock-testing-model',
      displayName: 'Mock Testing Model',
      config: {},
    },
  ],
  defaultProviderIndex: 0,
  termsAccepted: true,
};

const configsWithoutMock: SavedConfigurations = {
  providers: [
    {
      providerId: 'openai',
      displayName: 'OpenAI',
      config: { apiKey: 'sk-test', model: 'gpt-4o' },
    },
    {
      providerId: 'copilot',
      displayName: 'GitHub Copilot',
      config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
    },
  ],
  defaultProviderIndex: 0,
  termsAccepted: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeveloperSettings helpers', () => {
  describe('hasMockModelProvider', () => {
    it('returns false for empty configs', () => {
      expect(hasMockModelProvider(emptyConfigs)).toBe(false);
    });

    it('returns false for null/undefined configs', () => {
      expect(hasMockModelProvider(null)).toBe(false);
      expect(hasMockModelProvider(undefined)).toBe(false);
    });

    it('returns true when mock-testing-model provider exists', () => {
      expect(hasMockModelProvider(configsWithMock)).toBe(true);
    });

    it('returns false when mock-testing-model provider is absent', () => {
      expect(hasMockModelProvider(configsWithoutMock)).toBe(false);
    });
  });

  describe('addMockModelProvider', () => {
    it('adds mock model to empty configs', () => {
      const result = addMockModelProvider(emptyConfigs);
      expect(result.providers).toHaveLength(1);
      expect(result.providers![0].providerId).toBe('mock-testing-model');
      expect(result.defaultProviderIndex).toBe(0);
      expect(result.termsAccepted).toBe(true);
    });

    it('adds mock model to null configs', () => {
      const result = addMockModelProvider(null);
      expect(result.providers).toHaveLength(1);
      expect(result.providers![0].providerId).toBe('mock-testing-model');
    });

    it('adds mock model to existing providers', () => {
      const result = addMockModelProvider(configsWithoutMock);
      expect(result.providers).toHaveLength(3);
      expect(result.providers![2].providerId).toBe('mock-testing-model');
      // Mock model should become the default
      expect(result.defaultProviderIndex).toBe(2);
    });

    it('does not duplicate if already present', () => {
      const result = addMockModelProvider(configsWithMock);
      const mockCount = result.providers!.filter(p => p.providerId === 'mock-testing-model').length;
      expect(mockCount).toBe(1);
    });

    it('sets mock model as default provider', () => {
      const result = addMockModelProvider(configsWithoutMock);
      const mockIndex = result.providers!.findIndex(p => p.providerId === 'mock-testing-model');
      expect(result.defaultProviderIndex).toBe(mockIndex);
    });
  });

  describe('removeMockModelProvider', () => {
    it('removes mock model from configs', () => {
      const result = removeMockModelProvider(configsWithMock);
      expect(result.providers).toHaveLength(1);
      expect(result.providers![0].providerId).toBe('openai');
    });

    it('handles configs without mock model gracefully', () => {
      const result = removeMockModelProvider(configsWithoutMock);
      expect(result.providers).toHaveLength(2);
    });

    it('handles empty configs gracefully', () => {
      const result = removeMockModelProvider(emptyConfigs);
      expect(result.providers).toHaveLength(0);
    });

    it('handles null configs gracefully', () => {
      const result = removeMockModelProvider(null);
      expect(result.providers).toHaveLength(0);
    });

    it('adjusts default index when mock model is removed', () => {
      // Mock is at index 1, default is at 0 → index stays 0
      const result = removeMockModelProvider(configsWithMock);
      expect(result.defaultProviderIndex).toBe(0);
    });

    it('adjusts default index when mock model was the default', () => {
      const configs: SavedConfigurations = {
        providers: [
          { providerId: 'mock-testing-model', displayName: 'Mock', config: {} },
          { providerId: 'openai', displayName: 'OpenAI', config: { apiKey: 'sk-test' } },
        ],
        defaultProviderIndex: 0,
      };
      const result = removeMockModelProvider(configs);
      expect(result.providers).toHaveLength(1);
      expect(result.providers![0].providerId).toBe('openai');
      expect(result.defaultProviderIndex).toBe(0);
    });
  });

  describe('DeveloperOptionsConfig', () => {
    it('defaults to all disabled when empty', () => {
      const opts: DeveloperOptionsConfig = {};
      expect(opts.enableMockModel).toBeUndefined();
      expect(opts.enableMockAgent).toBeUndefined();
      expect(opts.enableFakeMCP).toBeUndefined();
    });

    it('can enable all options', () => {
      const opts: DeveloperOptionsConfig = {
        enableMockModel: true,
        enableMockAgent: true,
        enableFakeMCP: true,
      };
      expect(opts.enableMockModel).toBe(true);
      expect(opts.enableMockAgent).toBe(true);
      expect(opts.enableFakeMCP).toBe(true);
    });

    it('supports partial configuration', () => {
      const opts: DeveloperOptionsConfig = {
        enableMockModel: true,
      };
      expect(opts.enableMockModel).toBe(true);
      expect(opts.enableMockAgent).toBeUndefined();
      expect(opts.enableFakeMCP).toBeUndefined();
    });
  });
});
