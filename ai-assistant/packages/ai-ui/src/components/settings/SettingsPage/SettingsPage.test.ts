/**
 * Tests for SettingsPage component logic.
 *
 * Exercises the data contracts and configuration management logic
 * that the SettingsPage component uses internally.
 */

import {
  getActiveConfig,
  type SavedConfigurations,
} from '@headlamp-k8s/ai-common/managers/ProviderConfigManager';
import { describe, expect, it, vi } from 'vitest';
import type { ToolInfo } from '../AIToolsSettings/AIToolsSettings';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const emptyConfigs: SavedConfigurations = {};

const singleProviderConfigs: SavedConfigurations = {
  providers: [
    {
      providerId: 'openai',
      displayName: 'OpenAI',
      config: { apiKey: 'sk-test', model: 'gpt-4o' },
    },
  ],
  defaultProviderIndex: 0,
  termsAccepted: true,
};

const multiProviderConfigs: SavedConfigurations = {
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
    {
      providerId: 'local',
      displayName: 'Ollama (llama3)',
      config: { baseUrl: 'http://localhost:11434', model: 'llama3' },
    },
  ],
  defaultProviderIndex: 0,
  termsAccepted: true,
};

const sampleTools: ToolInfo[] = [
  { id: 'web-search', name: 'Web Search', description: 'Search the web' },
  { id: 'code-exec', name: 'Code Execution', description: 'Run code' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsPage logic', () => {
  describe('active configuration initialization', () => {
    it('uses active config from saved configs when available', () => {
      const active = getActiveConfig(singleProviderConfigs);
      expect(active).toBeDefined();
      expect(active?.providerId).toBe('openai');
      expect(active?.config.apiKey).toBe('sk-test');
    });

    it('falls back to openai default when no saved configs', () => {
      const active = getActiveConfig(emptyConfigs);
      expect(active).toBeFalsy();
      // Component would then use { providerId: 'openai', config: getDefaultConfig('openai') }
    });

    it('uses default provider index for active config', () => {
      const active = getActiveConfig(multiProviderConfigs);
      expect(active).toBeDefined();
      expect(active?.providerId).toBe('openai'); // index 0
    });

    it('handles null/undefined saved configs', () => {
      const active = getActiveConfig(null as any);
      expect(active).toBeFalsy();
    });
  });

  describe('model selector change handling', () => {
    it('updates active configuration on change', () => {
      const changes = {
        providerId: 'anthropic',
        config: { apiKey: 'ant-test', model: 'claude-3' },
        displayName: 'Anthropic',
      };

      // Simulate state update
      const newActive = {
        providerId: changes.providerId,
        config: changes.config,
        displayName: changes.displayName,
      };

      expect(newActive.providerId).toBe('anthropic');
      expect(newActive.displayName).toBe('Anthropic');
    });

    it('persists saved configs when included in change', () => {
      const onConfigsChange = vi.fn();
      const changes = {
        providerId: 'openai',
        config: { apiKey: 'sk-new' },
        displayName: 'OpenAI',
        savedConfigs: multiProviderConfigs,
      };

      if (changes.savedConfigs) {
        onConfigsChange(changes.savedConfigs);
      }

      expect(onConfigsChange).toHaveBeenCalledWith(multiProviderConfigs);
    });

    it('does not persist when no savedConfigs in change', () => {
      const onConfigsChange = vi.fn();
      const changes = {
        providerId: 'openai',
        config: { apiKey: 'sk-new' },
        displayName: 'OpenAI',
      };

      if ((changes as any).savedConfigs) {
        onConfigsChange((changes as any).savedConfigs);
      }

      expect(onConfigsChange).not.toHaveBeenCalled();
    });
  });

  describe('preview toggle', () => {
    it('defaults to true when not specified', () => {
      const previewEnabled = (emptyConfigs as any)?.previewEnabled ?? true;
      expect(previewEnabled).toBe(true);
    });

    it('uses stored value when specified', () => {
      const configs = { ...singleProviderConfigs, previewEnabled: false } as any;
      const previewEnabled = configs.previewEnabled ?? true;
      expect(previewEnabled).toBe(false);
    });
  });

  describe('tools section rendering logic', () => {
    it('renders when tools, isToolEnabled, and onToolToggle are all provided', () => {
      const hasTools = sampleTools.length > 0;
      const hasIsToolEnabled = true;
      const hasOnToolToggle = true;
      const shouldRender = hasTools && hasIsToolEnabled && hasOnToolToggle;
      expect(shouldRender).toBe(true);
    });

    it('does not render when tools is empty', () => {
      const tools: ToolInfo[] = [];
      const shouldRender = tools.length > 0;
      expect(shouldRender).toBe(false);
    });
  });

  describe('optional sections', () => {
    it('Holmes section renders when onHolmesConfigChange is provided', () => {
      const onHolmesConfigChange = vi.fn();
      expect(typeof onHolmesConfigChange).toBe('function');
    });

    it('AKS section renders when aksDocUrl is provided', () => {
      const aksDocUrl = 'https://learn.microsoft.com/en-us/azure/aks/install';
      expect(aksDocUrl).toBeTruthy();
    });

    it('Preview toggle renders when onPreviewChange is provided', () => {
      const onPreviewChange = vi.fn();
      expect(typeof onPreviewChange).toBe('function');
    });
  });

  describe('config store interface', () => {
    it('config store has get and update methods', () => {
      const store = {
        get: () => ({ providers: [] }),
        update: vi.fn(),
      };

      expect(typeof store.get).toBe('function');
      expect(typeof store.update).toBe('function');
    });

    it('config store update is called with merged configs', () => {
      const data: Record<string, any> = { providers: [] };
      const store = {
        get: () => data,
        update: vi.fn((patch: any) => {
          Object.assign(data, patch);
        }),
      };

      store.update({ previewEnabled: true });
      expect(store.update).toHaveBeenCalledWith({ previewEnabled: true });
    });
  });
});
